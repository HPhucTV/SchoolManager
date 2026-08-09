"""Read-only aggregates that deepen core school workflows without new tables."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from math import ceil

from sqlalchemy.orm import Session

from app import models
from app.schemas.insights import (
    AttentionItem,
    ClassGradebookResponse,
    GradebookStudentRow,
    Pagination,
    StudentGradebookResponse,
    StudentSubjectGrade,
    TodayDashboardResponse,
    TodayScheduleItem,
    TodayWorkItem,
)


LOCAL_TIMEZONE = timezone(timedelta(hours=7), name="Asia/Ho_Chi_Minh")
DAY_ALIASES = {
    0: ("Monday", "Thứ 2", "Thứ Hai"),
    1: ("Tuesday", "Thứ 3", "Thứ Ba"),
    2: ("Wednesday", "Thứ 4", "Thứ Tư"),
    3: ("Thursday", "Thứ 5", "Thứ Năm"),
    4: ("Friday", "Thứ 6", "Thứ Sáu"),
    5: ("Saturday", "Thứ 7", "Thứ Bảy"),
    6: ("Sunday", "Chủ Nhật"),
}


def _local_now(value: datetime | None = None) -> datetime:
    current = value or datetime.now(LOCAL_TIMEZONE)
    if current.tzinfo is None:
        return current.replace(tzinfo=LOCAL_TIMEZONE)
    return current.astimezone(LOCAL_TIMEZONE)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=LOCAL_TIMEZONE)
    return parsed.astimezone(LOCAL_TIMEZONE)


def _average(values: list[float]) -> float | None:
    if not values:
        return None
    return round(sum(values) / len(values), 1)


def _assignment_percentage(submission: models.Submission, assignment: models.Assignment) -> float:
    maximum = max(float(assignment.total_points or 0), 1.0)
    return min(100.0, max(0.0, float(submission.total_score or 0) / maximum * 100))


class SchoolInsights:
    """One read-only interface for today, gradebook and attention projections."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def today(self, actor: models.User, *, now: datetime | None = None) -> TodayDashboardResponse:
        current = _local_now(now)
        class_query = self.db.query(models.Class)
        if actor.role == "teacher":
            class_query = class_query.filter(models.Class.teacher_id == actor.id)
        elif actor.role == "student":
            class_query = class_query.filter(models.Class.id == actor.class_id)
        else:
            class_query = class_query.filter(models.Class.id == -1)

        classes = class_query.all()
        class_ids = [school_class.id for school_class in classes]
        class_names = {school_class.id: school_class.name for school_class in classes}

        schedule_query = self.db.query(models.Schedule).filter(
            models.Schedule.day_of_week.in_(DAY_ALIASES[current.weekday()]),
        )
        if actor.role == "teacher":
            schedule_query = schedule_query.filter(models.Schedule.teacher_id == actor.id)
        elif actor.role == "student":
            schedule_query = schedule_query.filter(models.Schedule.class_id == actor.class_id)

        schedule = [
            TodayScheduleItem(
                id=item.id,
                subject=item.subject,
                start_time=item.start_time,
                end_time=item.end_time,
                room=item.room,
                class_id=item.class_id,
                class_name=class_names.get(item.class_id, item.class_info.name if item.class_info else "Lớp học"),
                teacher_name=item.teacher.name if item.teacher else None,
            )
            for item in schedule_query.order_by(models.Schedule.start_time).all()
        ]

        work_items = self._work_items(
            actor,
            class_ids=class_ids,
            class_names=class_names,
            now=current,
        )
        attention = (
            self._teacher_attention(class_ids=class_ids, class_names=class_names, now=current)
            if actor.role == "teacher"
            else []
        )
        unread_notifications = self.db.query(models.Notification).filter(
            models.Notification.user_id == actor.id,
            models.Notification.is_read.is_(False),
        ).count()

        return TodayDashboardResponse(
            date=current.date().isoformat(),
            schedule=schedule,
            work_items=work_items,
            attention=attention,
            unread_notifications=unread_notifications,
        )

    def _work_items(
        self,
        actor: models.User,
        *,
        class_ids: list[int],
        class_names: dict[int, str],
        now: datetime,
    ) -> list[TodayWorkItem]:
        if not class_ids:
            return []

        completed_assignment_ids: set[int] = set()
        completed_quiz_ids: set[int] = set()
        if actor.role == "student":
            completed_assignment_ids = {
                assignment_id
                for assignment_id, in self.db.query(models.Submission.assignment_id).filter(
                    models.Submission.student_id == actor.id,
                ).all()
            }
            completed_quiz_ids = {
                quiz_id
                for quiz_id, in self.db.query(models.QuizResult.quiz_id).filter(
                    models.QuizResult.student_id == actor.id,
                ).all()
            }

        lower_bound = now - timedelta(days=30)
        upper_bound = now + timedelta(days=7)
        sortable: list[tuple[datetime, TodayWorkItem]] = []

        assignments = self.db.query(models.Assignment).filter(
            models.Assignment.class_id.in_(class_ids),
            models.Assignment.status == "active",
            models.Assignment.deadline.isnot(None),
        ).all()
        for assignment in assignments:
            deadline = _parse_datetime(assignment.deadline)
            if deadline is None or deadline < lower_bound or deadline > upper_bound:
                continue
            if actor.role == "student" and assignment.id in completed_assignment_ids:
                continue
            sortable.append((
                deadline,
                TodayWorkItem(
                    kind="assignment",
                    id=assignment.id,
                    title=assignment.title,
                    subject=assignment.subject,
                    deadline=assignment.deadline,
                    is_overdue=deadline < now,
                    class_id=assignment.class_id,
                    class_name=class_names.get(assignment.class_id, "Lớp học"),
                    action_url=(
                        f"/student/assignment/{assignment.id}"
                        if actor.role == "student"
                        else f"/teacher/bai-tap?classId={assignment.class_id}"
                    ),
                ),
            ))

        quizzes = self.db.query(models.Quiz).filter(
            models.Quiz.class_id.in_(class_ids),
            models.Quiz.status == "active",
            models.Quiz.deadline.isnot(None),
        ).all()
        for quiz in quizzes:
            deadline = _parse_datetime(quiz.deadline)
            if deadline is None or deadline < lower_bound or deadline > upper_bound:
                continue
            if actor.role == "student" and quiz.id in completed_quiz_ids:
                continue
            sortable.append((
                deadline,
                TodayWorkItem(
                    kind="quiz",
                    id=quiz.id,
                    title=quiz.title,
                    subject=quiz.subject,
                    deadline=quiz.deadline,
                    is_overdue=deadline < now,
                    class_id=quiz.class_id,
                    class_name=class_names.get(quiz.class_id, "Lớp học"),
                    action_url=(
                        f"/student/quiz/{quiz.id}"
                        if actor.role == "student"
                        else f"/teacher/kiem-tra?classId={quiz.class_id}"
                    ),
                ),
            ))

        sortable.sort(key=lambda entry: entry[0])
        return [item for _, item in sortable[:6]]

    def _teacher_attention(
        self,
        *,
        class_ids: list[int],
        class_names: dict[int, str],
        now: datetime,
    ) -> list[AttentionItem]:
        if not class_ids:
            return []

        students = self.db.query(models.User).filter(
            models.User.role == "student",
            models.User.class_id.in_(class_ids),
        ).order_by(models.User.name).all()
        students_by_id = {student.id: student for student in students}
        items: list[AttentionItem] = []

        alerts = self.db.query(models.SOSAlert).join(
            models.User,
            models.SOSAlert.student_id == models.User.id,
        ).filter(
            models.User.class_id.in_(class_ids),
            models.SOSAlert.status.in_(("pending", "reviewing")),
        ).order_by(models.SOSAlert.created_at.desc()).all()
        for alert in alerts:
            student = students_by_id.get(alert.student_id)
            if student is None or student.class_id is None:
                continue
            anonymous = bool(alert.is_anonymous)
            items.append(AttentionItem(
                id=f"sos-{alert.id}",
                kind="sos",
                priority="high",
                title="Yêu cầu hỗ trợ ẩn danh" if anonymous else student.name,
                description=f"Có yêu cầu hỗ trợ đang chờ xử lý tại {class_names.get(student.class_id, 'lớp học')}.",
                class_id=student.class_id,
                class_name=class_names.get(student.class_id, "Lớp học"),
                student_id=None if anonymous else student.id,
                action_url="/teacher/suc-khoe",
                occurred_at=alert.created_at,
            ))

        overdue_assignments = []
        assignments = self.db.query(models.Assignment).filter(
            models.Assignment.class_id.in_(class_ids),
            models.Assignment.status == "active",
            models.Assignment.deadline.isnot(None),
        ).all()
        for assignment in assignments:
            deadline = _parse_datetime(assignment.deadline)
            if deadline is not None and deadline < now:
                overdue_assignments.append((deadline, assignment))
        overdue_assignments.sort(key=lambda entry: entry[0])

        for deadline, assignment in overdue_assignments:
            submitted_ids = {
                student_id
                for student_id, in self.db.query(models.Submission.student_id).filter(
                    models.Submission.assignment_id == assignment.id,
                ).all()
            }
            for student in students:
                if student.class_id != assignment.class_id or student.id in submitted_ids:
                    continue
                items.append(AttentionItem(
                    id=f"missing-assignment-{assignment.id}-{student.id}",
                    kind="missing_assignment",
                    priority="medium",
                    title=student.name,
                    description=f"Chưa nộp “{assignment.title}” đã quá hạn.",
                    class_id=assignment.class_id,
                    class_name=class_names.get(assignment.class_id, "Lớp học"),
                    student_id=student.id,
                    action_url=f"/teacher/lop-hoc/{assignment.class_id}",
                    occurred_at=deadline.isoformat(),
                ))
                if len(items) >= 8:
                    return items[:8]

        low_results = self.db.query(models.QuizResult, models.Quiz).join(
            models.Quiz,
            models.QuizResult.quiz_id == models.Quiz.id,
        ).filter(
            models.Quiz.class_id.in_(class_ids),
            models.QuizResult.percentage < 50,
        ).order_by(models.QuizResult.completed_at.desc()).limit(12).all()
        for result, quiz in low_results:
            student = students_by_id.get(result.student_id)
            if student is None:
                continue
            items.append(AttentionItem(
                id=f"low-quiz-{quiz.id}-{student.id}",
                kind="low_quiz_score",
                priority="medium",
                title=student.name,
                description=f"Đạt {round(float(result.percentage), 1)}% ở bài “{quiz.title}”.",
                class_id=quiz.class_id,
                class_name=class_names.get(quiz.class_id, "Lớp học"),
                student_id=student.id,
                action_url=f"/teacher/lop-hoc/{quiz.class_id}",
                occurred_at=result.completed_at,
            ))
            if len(items) >= 8:
                break
        return items[:8]

    def class_gradebook(
        self,
        school_class: models.Class,
        *,
        page: int,
        page_size: int,
        now: datetime | None = None,
    ) -> ClassGradebookResponse:
        current = _local_now(now)
        student_query = self.db.query(models.User).filter(
            models.User.role == "student",
            models.User.class_id == school_class.id,
        )
        total_students = student_query.count()
        students = student_query.order_by(models.User.name).offset((page - 1) * page_size).limit(page_size).all()
        student_ids = [student.id for student in students]

        assignments = self.db.query(models.Assignment).filter(
            models.Assignment.class_id == school_class.id,
            models.Assignment.status != "draft",
        ).all()
        quizzes = self.db.query(models.Quiz).filter(
            models.Quiz.class_id == school_class.id,
            models.Quiz.status != "draft",
        ).all()
        assignment_ids = [assignment.id for assignment in assignments]
        quiz_ids = [quiz.id for quiz in quizzes]

        submissions = (
            self.db.query(models.Submission).filter(
                models.Submission.student_id.in_(student_ids),
                models.Submission.assignment_id.in_(assignment_ids),
            ).all()
            if student_ids and assignment_ids
            else []
        )
        quiz_results = (
            self.db.query(models.QuizResult).filter(
                models.QuizResult.student_id.in_(student_ids),
                models.QuizResult.quiz_id.in_(quiz_ids),
            ).all()
            if student_ids and quiz_ids
            else []
        )
        assignment_by_id = {assignment.id: assignment for assignment in assignments}
        submissions_by_student: dict[int, list[models.Submission]] = defaultdict(list)
        for submission in submissions:
            submissions_by_student[submission.student_id].append(submission)
        results_by_student: dict[int, list[models.QuizResult]] = defaultdict(list)
        for result in quiz_results:
            results_by_student[result.student_id].append(result)

        rows = []
        for student in students:
            student_submissions = submissions_by_student[student.id]
            submission_assignment_ids = {submission.assignment_id for submission in student_submissions}
            result_quiz_ids = {result.quiz_id for result in results_by_student[student.id]}
            assignment_scores = [
                _assignment_percentage(submission, assignment_by_id[submission.assignment_id])
                for submission in student_submissions
                if submission.status == "graded" and submission.assignment_id in assignment_by_id
            ]
            quiz_scores = [float(result.percentage) for result in results_by_student[student.id]]
            all_scores = assignment_scores + quiz_scores
            missing_items = sum(
                1
                for assignment in assignments
                if assignment.id not in submission_assignment_ids
                and (deadline := _parse_datetime(assignment.deadline)) is not None
                and deadline < current
            ) + sum(
                1
                for quiz in quizzes
                if quiz.id not in result_quiz_ids
                and (deadline := _parse_datetime(quiz.deadline)) is not None
                and deadline < current
            )
            overall = _average(all_scores)
            rows.append(GradebookStudentRow(
                student_id=student.id,
                student_name=student.name,
                student_email=student.email,
                assignment_average=_average(assignment_scores),
                quiz_average=_average(quiz_scores),
                overall_average=overall,
                graded_items=len(all_scores),
                total_items=len(assignments) + len(quizzes),
                missing_items=missing_items,
                needs_attention=missing_items > 0 or any(score < 50 for score in all_scores),
            ))

        return ClassGradebookResponse(
            class_id=school_class.id,
            class_name=school_class.name,
            assignment_count=len(assignments),
            quiz_count=len(quizzes),
            students=rows,
            pagination=Pagination(
                page=page,
                page_size=page_size,
                total_items=total_students,
                total_pages=max(1, ceil(total_students / page_size)),
            ),
        )

    def student_gradebook(self, actor: models.User) -> StudentGradebookResponse:
        if actor.class_id is None:
            return StudentGradebookResponse(subjects=[])
        school_class = self.db.query(models.Class).filter(models.Class.id == actor.class_id).first()
        if school_class is None:
            return StudentGradebookResponse(subjects=[])

        assignments = self.db.query(models.Assignment).filter(
            models.Assignment.class_id == school_class.id,
            models.Assignment.status != "draft",
        ).all()
        quizzes = self.db.query(models.Quiz).filter(
            models.Quiz.class_id == school_class.id,
            models.Quiz.status != "draft",
        ).all()
        assignment_ids = [assignment.id for assignment in assignments]
        quiz_ids = [quiz.id for quiz in quizzes]
        submissions = (
            self.db.query(models.Submission).filter(
                models.Submission.student_id == actor.id,
                models.Submission.assignment_id.in_(assignment_ids),
            ).all()
            if assignment_ids
            else []
        )
        quiz_results = (
            self.db.query(models.QuizResult).filter(
                models.QuizResult.student_id == actor.id,
                models.QuizResult.quiz_id.in_(quiz_ids),
            ).all()
            if quiz_ids
            else []
        )
        assignment_by_id = {assignment.id: assignment for assignment in assignments}
        quiz_by_id = {quiz.id: quiz for quiz in quizzes}
        submissions_by_subject: dict[str, list[models.Submission]] = defaultdict(list)
        for submission in submissions:
            assignment = assignment_by_id.get(submission.assignment_id)
            if assignment and assignment.subject:
                submissions_by_subject[assignment.subject].append(submission)
        results_by_subject: dict[str, list[models.QuizResult]] = defaultdict(list)
        for result in quiz_results:
            quiz = quiz_by_id.get(result.quiz_id)
            if quiz and quiz.subject:
                results_by_subject[quiz.subject].append(result)

        assignment_counts: dict[str, int] = defaultdict(int)
        quiz_counts: dict[str, int] = defaultdict(int)
        for assignment in assignments:
            if assignment.subject:
                assignment_counts[assignment.subject] += 1
        for quiz in quizzes:
            if quiz.subject:
                quiz_counts[quiz.subject] += 1

        all_scores: list[float] = []
        subject_rows = []
        for subject in sorted(set(assignment_counts) | set(quiz_counts)):
            subject_submissions = submissions_by_subject[subject]
            assignment_scores = [
                _assignment_percentage(submission, assignment_by_id[submission.assignment_id])
                for submission in subject_submissions
                if submission.status == "graded" and submission.assignment_id in assignment_by_id
            ]
            subject_results = results_by_subject[subject]
            quiz_scores = [float(result.percentage) for result in subject_results]
            scores = assignment_scores + quiz_scores
            all_scores.extend(scores)
            overall = _average(scores)
            subject_rows.append(StudentSubjectGrade(
                subject=subject,
                assignment_average=_average(assignment_scores),
                quiz_average=_average(quiz_scores),
                overall_average=overall,
                completed_items=len(subject_submissions) + len(subject_results),
                graded_items=len(scores),
                total_items=assignment_counts[subject] + quiz_counts[subject],
                needs_review=overall is not None and overall < 50,
            ))

        return StudentGradebookResponse(
            class_id=school_class.id,
            class_name=school_class.name,
            overall_average=_average(all_scores),
            subjects=subject_rows,
        )
