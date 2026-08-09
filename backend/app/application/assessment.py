"""Assessment use cases for quiz creation, visibility and submission."""

import json
from datetime import datetime

from sqlalchemy.orm import Session

from app import models
from app.application.audit import record_audit_event
from app.application.errors import ApplicationError, ErrorCode
from app.application.notifications import add_class_notifications
from app.application.transactions import transaction
from app.domain import assessment as policy
from app.infrastructure.quiz_bank import generate_questions
from app.schemas.assessment import (
    MessageResponse,
    QuizCreateRequest,
    QuizResponse,
    QuizResultResponse,
    QuizSubmissionResponse,
    QuizSubmitRequest,
    QuizUpdateRequest,
    quiz_response,
)


class Assessment:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _quiz(self, quiz_id: int) -> models.Quiz:
        quiz = self.db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
        if quiz is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Quiz not found")
        return quiz

    def _teacher_class(self, actor: models.User, class_id: int) -> models.Class:
        school_class = self.db.query(models.Class).filter(models.Class.id == class_id).first()
        if school_class is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Không tìm thấy lớp học")
        if actor.role != "teacher" or school_class.teacher_id != actor.id:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền truy cập lớp học này")
        return school_class

    @staticmethod
    def _require_manager(
        actor: models.User,
        quiz: models.Quiz,
        *,
        allow_admin: bool = False,
        message: str = "Not authorized",
    ) -> None:
        if not policy.can_manage_quiz(
            role=actor.role,
            actor_id=actor.id,
            teacher_id=quiz.teacher_id,
            allow_admin=allow_admin,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, message)

    def list_quizzes(self, actor: models.User) -> list[QuizResponse]:
        if not policy.can_list_quizzes(role=actor.role):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền xem bài kiểm tra")
        query = self.db.query(models.Quiz)
        if actor.role == "student":
            query = query.filter(models.Quiz.class_id == actor.class_id)
        elif actor.role == "teacher":
            query = query.filter(models.Quiz.teacher_id == actor.id)
        return [quiz_response(quiz, role=actor.role) for quiz in query.all()]

    def create_quiz(self, actor: models.User, request: QuizCreateRequest) -> QuizResponse:
        if actor.role != "teacher":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Only teachers can create quizzes")
        self._teacher_class(actor, request.class_id)

        if request.questions:
            total_questions = len(request.questions)
            easy_count = sum(question.difficulty == "easy" for question in request.questions)
            medium_count = sum(question.difficulty == "medium" for question in request.questions)
            hard_count = sum(question.difficulty == "hard" for question in request.questions)
            generated = [
                {**question.model_dump(), "order_num": order_num}
                for order_num, question in enumerate(request.questions)
            ]
        else:
            total_questions = request.easy_count + request.medium_count + request.hard_count
            easy_count = request.easy_count
            medium_count = request.medium_count
            hard_count = request.hard_count
            generated: list[dict[str, object]] = []
            start_index = 0
            topic = request.topic or request.subject or ""
            for difficulty, count in (
                ("easy", request.easy_count),
                ("medium", request.medium_count),
                ("hard", request.hard_count),
            ):
                if count > 0:
                    generated.extend(generate_questions(topic, difficulty, count, start_index))
                    start_index += count

        quiz = models.Quiz(
            title=request.title,
            subject=request.subject,
            topic=request.topic,
            class_id=request.class_id,
            teacher_id=actor.id,
            easy_count=easy_count,
            medium_count=medium_count,
            hard_count=hard_count,
            total_questions=total_questions,
            deadline=request.deadline,
            allow_retake=request.allow_retake,
            show_answers=request.show_answers,
            created_at=datetime.now().isoformat(),
            status="draft",
        )
        with transaction(self.db):
            self.db.add(quiz)
            self.db.flush()
            for question in generated:
                self.db.add(models.QuizQuestion(quiz_id=quiz.id, **question))
            self.db.flush()
            add_class_notifications(
                self.db,
                class_id=quiz.class_id,
                title=f"Bài kiểm tra mới: {quiz.title}",
                message=f"Môn {quiz.subject} - {quiz.topic}. Hạn nộp: {quiz.deadline}.",
                notification_type="quiz",
                action_url=f"/student/quiz/{quiz.id}",
            )
            record_audit_event(
                self.db,
                actor=actor,
                action="quiz.created",
                resource_type="quiz",
                resource_id=quiz.id,
                details={"class_id": quiz.class_id, "total_questions": total_questions},
            )
        return quiz_response(quiz, role=actor.role)

    def update_quiz(
        self,
        actor: models.User,
        quiz_id: int,
        request: QuizUpdateRequest,
    ) -> QuizResponse:
        if actor.role != "teacher":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này")
        quiz = self._quiz(quiz_id)
        self._require_manager(actor, quiz, message="Bạn không có quyền truy cập tài nguyên này")
        with transaction(self.db):
            if request.status:
                quiz.status = request.status
            record_audit_event(
                self.db,
                actor=actor,
                action="quiz.status_updated",
                resource_type="quiz",
                resource_id=quiz.id,
                details={"status": quiz.status},
            )
        return quiz_response(quiz, role=actor.role)

    def delete_quiz(self, actor: models.User, quiz_id: int) -> MessageResponse:
        quiz = self._quiz(quiz_id)
        self._require_manager(actor, quiz, allow_admin=True)
        with transaction(self.db):
            self.db.query(models.QuizResult).filter(
                models.QuizResult.quiz_id == quiz_id,
            ).delete(synchronize_session=False)
            self.db.query(models.QuizQuestion).filter(
                models.QuizQuestion.quiz_id == quiz_id,
            ).delete(synchronize_session=False)
            record_audit_event(
                self.db,
                actor=actor,
                action="quiz.deleted",
                resource_type="quiz",
                resource_id=quiz.id,
                details={"class_id": quiz.class_id},
            )
            self.db.delete(quiz)
        return MessageResponse(message="Deleted successfully")

    def get_quiz(self, actor: models.User, quiz_id: int) -> QuizResponse:
        quiz = self._quiz(quiz_id)
        if actor.role == "student":
            if actor.class_id != quiz.class_id:
                raise ApplicationError(ErrorCode.FORBIDDEN, "Nội dung này không thuộc lớp của bạn")
            if quiz.status != "active":
                raise ApplicationError(ErrorCode.FORBIDDEN, "Bài kiểm tra chưa được mở")
        elif not policy.can_view_quiz(
            role=actor.role,
            actor_id=actor.id,
            actor_class_id=actor.class_id,
            teacher_id=quiz.teacher_id,
            class_id=quiz.class_id,
            status=quiz.status,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Not authorized")
        return quiz_response(quiz, role=actor.role)

    def get_my_result(self, actor: models.User, quiz_id: int) -> QuizResultResponse:
        if actor.role != "student":
            return QuizResultResponse(attempted=False)
        quiz = self._quiz(quiz_id)
        if actor.class_id != quiz.class_id:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Nội dung này không thuộc lớp của bạn")
        result = self.db.query(models.QuizResult).filter(
            models.QuizResult.quiz_id == quiz_id,
            models.QuizResult.student_id == actor.id,
        ).first()
        if result is None:
            return QuizResultResponse(attempted=False)
        return QuizResultResponse(
            attempted=True,
            score=result.score,
            total_questions=result.total_questions,
            percentage=result.percentage,
            completed_at=result.completed_at,
        )

    def submit_quiz(
        self,
        actor: models.User,
        quiz_id: int,
        request: QuizSubmitRequest,
    ) -> QuizSubmissionResponse:
        if actor.role != "student":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Only students can submit quizzes")
        quiz = self._quiz(quiz_id)
        if actor.class_id != quiz.class_id:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Nội dung này không thuộc lớp của bạn")
        if quiz.status != "active":
            raise ApplicationError(ErrorCode.INVALID_REQUEST, "Bài kiểm tra hiện không mở")
        existing = self.db.query(models.QuizResult).filter(
            models.QuizResult.quiz_id == quiz_id,
            models.QuizResult.student_id == actor.id,
        ).first()
        if not policy.allows_attempt(
            has_existing_result=existing is not None,
            allow_retake=quiz.allow_retake,
        ):
            raise ApplicationError(ErrorCode.INVALID_REQUEST, "You have already submitted this quiz")

        score = policy.score_quiz(
            [policy.ScorableQuestion(id=question.id, correct_answer=question.correct_answer) for question in quiz.questions],
            request.answers,
        )
        completed_at = datetime.now().isoformat()
        result = models.QuizResult(
            quiz_id=quiz_id,
            student_id=actor.id,
            score=score.correct,
            total_questions=score.total,
            percentage=score.percentage,
            answers=json.dumps(request.answers),
            completed_at=completed_at,
        )
        with transaction(self.db):
            if existing:
                self.db.delete(existing)
                self.db.flush()
            self.db.add(result)
            self.db.flush()
            record_audit_event(
                self.db,
                actor=actor,
                action="quiz.submitted",
                resource_type="quiz_result",
                resource_id=result.id,
                details={"quiz_id": quiz.id, "percentage": score.percentage},
            )
        return QuizSubmissionResponse(
            score=score.correct,
            total_questions=score.total,
            percentage=score.percentage,
            completed_at=completed_at,
            show_answers=quiz.show_answers,
        )
