"""Local quiz-bank question selection.

This is a concrete filesystem adapter. There is no repository port because the
project has only one real question-bank implementation.
"""

import json
import random
from functools import lru_cache
from pathlib import Path
from typing import Any


QUIZ_BANK_PATH = Path(__file__).resolve().parents[2] / "data" / "quiz_bank.json"

KEYWORDS = {
    "Toán": ["toán", "math", "phương trình", "hình học", "đại số", "số học", "tích phân", "đạo hàm", "xác suất", "thống kê", "lượng giác", "vectơ", "hàm số"],
    "Lý": ["vật lý", "lý", "physics", "điện", "quang", "cơ học", "nhiệt", "sóng", "từ trường", "newton", "năng lượng"],
    "Hóa": ["hóa", "chemistry", "nguyên tử", "phản ứng", "axit", "bazơ", "muối", "hữu cơ", "vô cơ", "oxi", "hidro"],
    "Sinh": ["sinh", "biology", "tế bào", "adn", "gen", "di truyền", "quang hợp", "tiến hóa", "hệ sinh thái", "enzyme"],
    "Sử": ["sử", "history", "lịch sử", "chiến tranh", "cách mạng", "triều đại", "phong kiến"],
    "Văn": ["văn", "literature", "thơ", "truyện", "tác phẩm", "nhà văn", "văn học", "nghị luận"],
    "Địa": ["địa", "geography", "địa lý", "khí hậu", "dân số", "sông", "biển", "châu lục"],
    "Anh văn": ["anh", "english", "tiếng anh", "grammar", "vocabulary", "toeic", "ielts"],
    "Tin học": ["tin", "informatics", "computer", "lập trình", "python", "html", "thuật toán", "máy tính"],
    "GDCD": ["gdcd", "công dân", "pháp luật", "hiến pháp", "đạo đức", "quyền", "nghĩa vụ"],
}


@lru_cache(maxsize=1)
def load_quiz_bank() -> dict[str, dict[str, list[dict[str, Any]]]]:
    try:
        return json.loads(QUIZ_BANK_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _match_subject(topic: str, bank: dict[str, Any]) -> str | None:
    topic_lower = topic.lower().strip()
    for subject in bank:
        if subject.lower() in topic_lower or topic_lower in subject.lower():
            return subject

    best_match: str | None = None
    best_score = 0
    for subject, keywords in KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in topic_lower)
        if score > best_score:
            best_score = score
            best_match = subject
    return best_match


def _fallback_questions(topic: str, difficulty: str, count: int, start_index: int) -> list[dict[str, Any]]:
    difficulty_label = {"easy": "cơ bản", "medium": "trung bình", "hard": "nâng cao"}.get(difficulty, difficulty)
    return [
        {
            "question_text": f"Câu hỏi {difficulty_label} số {index + 1} về {topic}",
            "difficulty": difficulty,
            "option_a": "Đáp án A",
            "option_b": "Đáp án B",
            "option_c": "Đáp án C",
            "option_d": "Đáp án D",
            "correct_answer": random.choice(["A", "B", "C", "D"]),
            "order_num": start_index + index,
        }
        for index in range(count)
    ]


def generate_questions(topic: str, difficulty: str, count: int, start_index: int) -> list[dict[str, Any]]:
    bank = load_quiz_bank()
    matched_subject = _match_subject(topic, bank)
    if not matched_subject or matched_subject not in bank:
        if not bank:
            return _fallback_questions(topic, difficulty, count, start_index)
        matched_subject = random.choice(list(bank))

    available = bank[matched_subject].get(difficulty, [])
    if not available:
        available = next(
            (bank[matched_subject].get(level, []) for level in ("easy", "medium", "hard") if bank[matched_subject].get(level)),
            [],
        )
    if not available:
        return _fallback_questions(topic, difficulty, count, start_index)

    selected = random.sample(available, min(count, len(available)))
    if len(selected) < count:
        extra_pool = [
            question
            for level in ("easy", "medium", "hard")
            if level != difficulty
            for question in bank[matched_subject].get(level, [])
        ]
        if extra_pool:
            selected.extend(random.sample(extra_pool, min(count - len(selected), len(extra_pool))))

    return [
        {
            "question_text": question["question_text"],
            "difficulty": difficulty,
            "option_a": question["option_a"],
            "option_b": question["option_b"],
            "option_c": question["option_c"],
            "option_d": question["option_d"],
            "correct_answer": question["correct_answer"],
            "order_num": start_index + index,
        }
        for index, question in enumerate(selected)
    ]
