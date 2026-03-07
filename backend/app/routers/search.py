"""
Global Smart Search API
Hybrid scoring: text relevance (BM25-inspired) + recency + personalization + popularity
"""

import math
import unicodedata
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import (
    User, Class, Assignment, Quiz, Activity, Notification,
    Submission, QuizResult, SearchHistory,
)

router = APIRouter()

# ── helpers ──────────────────────────────────────────────────────

def remove_diacritics(text: str) -> str:
    """Remove Vietnamese diacritics for fuzzy matching."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def text_relevance(query_norm: str, title: str, description: str = "") -> float:
    """
    BM25-inspired text relevance score (0-1).
    - Exact match in title → 1.0
    - Partial match in title → 0.6-0.9
    - Match in description → 0.3-0.5
    """
    title_norm = remove_diacritics(title or "")
    desc_norm = remove_diacritics(description or "")
    query_tokens = query_norm.split()

    if not query_tokens:
        return 0.0

    # Exact match
    if query_norm == title_norm:
        return 1.0

    # Full query appears in title
    if query_norm in title_norm:
        return 0.9

    # Count how many tokens match in title vs description
    title_hits = sum(1 for t in query_tokens if t in title_norm)
    desc_hits = sum(1 for t in query_tokens if t in desc_norm)
    total = len(query_tokens)

    title_score = (title_hits / total) * 0.8 if total else 0
    desc_score = (desc_hits / total) * 0.4 if total else 0

    return min(max(title_score, desc_score), 1.0)


def recency_score(date_str: Optional[str], deadline_str: Optional[str] = None) -> float:
    """
    Exponential decay recency (0-1). Items from last 24h → ~1.0, 30 days → ~0.3.
    Items with approaching deadlines get a boost.
    """
    now = datetime.utcnow()
    score = 0.3  # default for items without date

    if date_str:
        try:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00").replace("+00:00", ""))
        except (ValueError, AttributeError):
            try:
                dt = datetime.strptime(date_str[:19], "%Y-%m-%dT%H:%M:%S")
            except (ValueError, AttributeError):
                return score

        days_ago = max((now - dt).total_seconds() / 86400, 0)
        score = math.exp(-0.04 * days_ago)  # half-life ≈ 17 days

    # Deadline boost: items due within 3 days get boosted
    if deadline_str:
        try:
            dl = datetime.fromisoformat(deadline_str.replace("Z", "+00:00").replace("+00:00", ""))
        except (ValueError, AttributeError):
            try:
                dl = datetime.strptime(deadline_str[:19], "%Y-%m-%dT%H:%M:%S")
            except (ValueError, AttributeError):
                return score

        days_until = (dl - now).total_seconds() / 86400
        if 0 < days_until <= 3:
            score = min(score + 0.3, 1.0)

    return score


def personalization_score(item_class_id: Optional[int], user: User) -> float:
    """Items belonging to the user's class score higher."""
    if item_class_id is None:
        return 0.5
    if user.role == "student" and user.class_id == item_class_id:
        return 1.0
    if user.role == "teacher":
        return 0.8  # teachers see all but their classes slightly favoured
    return 0.3


def popularity_score(count: int, max_count: int) -> float:
    """Normalised popularity (0-1) using log scale."""
    if max_count <= 0:
        return 0.0
    return math.log(1 + count) / math.log(1 + max_count) if count > 0 else 0.0


def compute_final(text_rel: float, recency: float, personal: float, popular: float) -> float:
    return text_rel * 0.45 + recency * 0.25 + personal * 0.20 + popular * 0.10


# ── search endpoint ──────────────────────────────────────────────

@router.get("")
def global_search(
    q: str = Query(..., min_length=1, max_length=200),
    type: str = Query("all", pattern="^(all|students|classes|assignments|quizzes|activities|notifications)$"),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query_norm = remove_diacritics(q.strip())
    results: dict = {}

    # ── 1) Students ──────────────────────────────────────────
    if type in ("all", "students"):
        students = db.query(User).filter(
            User.role == "student",
            or_(
                func.lower(User.name).contains(q.lower()),
                func.lower(User.email).contains(q.lower()),
            )
        ).limit(limit).all()

        items = []
        for s in students:
            tr = text_relevance(query_norm, s.name, s.email or "")
            rec = 0.5
            per = personalization_score(s.class_id, current_user)
            pop = 0.0
            items.append({
                "id": s.id,
                "title": s.name,
                "subtitle": s.email,
                "extra": s.status,
                "type": "students",
                "score": compute_final(tr, rec, per, pop),
                "url": f"/teacher/hoc-sinh",
            })
        results["students"] = sorted(items, key=lambda x: x["score"], reverse=True)

    # ── 2) Classes ───────────────────────────────────────────
    if type in ("all", "classes"):
        classes = db.query(Class).filter(
            or_(
                func.lower(Class.name).contains(q.lower()),
                func.lower(Class.grade).contains(q.lower()),
                func.lower(Class.class_code).contains(q.lower()),
            )
        ).limit(limit).all()

        items = []
        for c in classes:
            tr = text_relevance(query_norm, c.name, c.grade or "")
            rec = recency_score(c.created_at)
            per = personalization_score(c.id, current_user)
            pop = popularity_score(c.student_count or 0, 50)
            items.append({
                "id": c.id,
                "title": c.name,
                "subtitle": f"Khối {c.grade}" if c.grade else "",
                "extra": f"{c.student_count or 0} học sinh",
                "type": "classes",
                "score": compute_final(tr, rec, per, pop),
                "url": f"/teacher/lop-hoc" if current_user.role in ("teacher", "admin") else f"/student/lop-hoc",
            })
        results["classes"] = sorted(items, key=lambda x: x["score"], reverse=True)

    # ── 3) Assignments ───────────────────────────────────────
    if type in ("all", "assignments"):
        assignments = db.query(Assignment).filter(
            or_(
                func.lower(Assignment.title).contains(q.lower()),
                func.lower(Assignment.subject).contains(q.lower()),
            )
        ).limit(limit).all()

        max_sub = db.query(Submission.assignment_id).group_by(Submission.assignment_id).order_by(
            Submission.assignment_id.desc()
        ).count()
        max_sub_count = max_sub if max_sub else 0

        items = []
        for a in assignments:
            sub_count = db.query(Submission).filter(Submission.assignment_id == a.id).count()
            tr = text_relevance(query_norm, a.title, a.description or "")
            rec = recency_score(a.created_at, a.deadline)
            per = personalization_score(a.class_id, current_user)
            pop = popularity_score(sub_count, max_sub_count)
            items.append({
                "id": a.id,
                "title": a.title,
                "subtitle": a.subject or "",
                "extra": a.status,
                "type": "assignments",
                "score": compute_final(tr, rec, per, pop),
                "url": f"/teacher/bai-tap" if current_user.role in ("teacher", "admin") else f"/student/assignment",
            })
        results["assignments"] = sorted(items, key=lambda x: x["score"], reverse=True)

    # ── 4) Quizzes ───────────────────────────────────────────
    if type in ("all", "quizzes"):
        quizzes = db.query(Quiz).filter(
            or_(
                func.lower(Quiz.title).contains(q.lower()),
                func.lower(Quiz.subject).contains(q.lower()),
                func.lower(Quiz.topic).contains(q.lower()),
            )
        ).limit(limit).all()

        max_qr = db.query(QuizResult.quiz_id).group_by(QuizResult.quiz_id).order_by(
            QuizResult.quiz_id.desc()
        ).count()
        max_qr_count = max_qr if max_qr else 0

        items = []
        for qz in quizzes:
            qr_count = db.query(QuizResult).filter(QuizResult.quiz_id == qz.id).count()
            tr = text_relevance(query_norm, qz.title, f"{qz.subject} {qz.topic}")
            rec = recency_score(qz.created_at, qz.deadline)
            per = personalization_score(qz.class_id, current_user)
            pop = popularity_score(qr_count, max_qr_count)
            items.append({
                "id": qz.id,
                "title": qz.title,
                "subtitle": f"{qz.subject} - {qz.topic}",
                "extra": qz.status,
                "type": "quizzes",
                "score": compute_final(tr, rec, per, pop),
                "url": f"/teacher/kiem-tra" if current_user.role in ("teacher", "admin") else f"/student/quiz",
            })
        results["quizzes"] = sorted(items, key=lambda x: x["score"], reverse=True)

    # ── 5) Activities ────────────────────────────────────────
    if type in ("all", "activities"):
        activities = db.query(Activity).filter(
            or_(
                func.lower(Activity.title).contains(q.lower()),
                func.lower(Activity.type).contains(q.lower()),
            )
        ).limit(limit).all()

        items = []
        for act in activities:
            tr = text_relevance(query_norm, act.title, act.description or "")
            rec = recency_score(act.created_at, act.scheduled_date)
            per = personalization_score(act.class_id, current_user)
            pop = popularity_score(act.participants_count or 0, 100)
            items.append({
                "id": act.id,
                "title": act.title,
                "subtitle": act.type or "",
                "extra": act.status,
                "type": "activities",
                "score": compute_final(tr, rec, per, pop),
                "url": f"/teacher/hoat-dong" if current_user.role in ("teacher", "admin") else f"/student/assignment",
            })
        results["activities"] = sorted(items, key=lambda x: x["score"], reverse=True)

    # ── 6) Notifications ────────────────────────────────────
    if type in ("all", "notifications"):
        notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            or_(
                func.lower(Notification.title).contains(q.lower()),
                func.lower(Notification.message).contains(q.lower()),
            )
        ).limit(limit).all()

        items = []
        for n in notifications:
            tr = text_relevance(query_norm, n.title, n.message or "")
            rec = recency_score(n.created_at)
            per = 1.0  # always personal
            pop = 0.0
            items.append({
                "id": n.id,
                "title": n.title,
                "subtitle": (n.message or "")[:80],
                "extra": n.type,
                "type": "notifications",
                "score": compute_final(tr, rec, per, pop),
                "url": f"/teacher/cai-dat" if current_user.role in ("teacher", "admin") else f"/student/notifications",
            })
        results["notifications"] = sorted(items, key=lambda x: x["score"], reverse=True)

    # Save search history
    history_entry = SearchHistory(
        user_id=current_user.id,
        query=q.strip(),
        searched_at=datetime.utcnow().isoformat(),
    )
    db.add(history_entry)
    db.commit()

    # Build flat sorted list for "all" type
    all_items = []
    for category_items in results.values():
        all_items.extend(category_items)
    all_items.sort(key=lambda x: x["score"], reverse=True)

    return {
        "query": q,
        "total": len(all_items),
        "results": results,
        "top_results": all_items[:limit],
    }


# ── suggestions endpoint ─────────────────────────────────────────

@router.get("/suggestions")
def search_suggestions(
    q: str = Query("", max_length=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    suggestions: List[dict] = []

    if q.strip():
        # Autocomplete from existing titles
        query_lower = q.lower()

        # Class names
        classes = db.query(Class.name).filter(
            func.lower(Class.name).contains(query_lower)
        ).limit(3).all()
        for c in classes:
            suggestions.append({"text": c[0], "type": "class"})

        # Assignment titles
        assignments = db.query(Assignment.title).filter(
            func.lower(Assignment.title).contains(query_lower)
        ).limit(3).all()
        for a in assignments:
            suggestions.append({"text": a[0], "type": "assignment"})

        # Quiz titles
        quizzes = db.query(Quiz.title).filter(
            func.lower(Quiz.title).contains(query_lower)
        ).limit(3).all()
        for qz in quizzes:
            suggestions.append({"text": qz[0], "type": "quiz"})

        # Student names
        students = db.query(User.name).filter(
            User.role == "student",
            func.lower(User.name).contains(query_lower)
        ).limit(3).all()
        for s in students:
            suggestions.append({"text": s[0], "type": "student"})
    else:
        # Return recent search history
        recent = db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        ).order_by(SearchHistory.id.desc()).limit(5).all()
        for h in recent:
            suggestions.append({"text": h.query, "type": "history"})

    return {"suggestions": suggestions}


# ── log click endpoint ───────────────────────────────────────────

@router.post("/log-click")
def log_search_click(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = SearchHistory(
        user_id=current_user.id,
        query=data.get("query", ""),
        result_type=data.get("result_type"),
        result_id=data.get("result_id"),
        searched_at=datetime.utcnow().isoformat(),
    )
    db.add(entry)
    db.commit()
    return {"status": "ok"}
