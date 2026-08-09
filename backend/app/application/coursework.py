"""Coursework use cases.

`Coursework` is the interface used by HTTP adapters and application tests. It
owns authorization decisions, SQLAlchemy queries, transactions, response
visibility, notifications and audit events for assignments.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app import models
from app.application.audit import record_audit_event
from app.application.errors import ApplicationError, ErrorCode
from app.application.notifications import add_class_notifications
from app.application.transactions import transaction
from app.domain import coursework as policy
from app.schemas.coursework import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
    GradeRequest,
    GradeResponse,
    MessageResponse,
    SubmissionCreateRequest,
    SubmissionResponse,
    assignment_response,
    submission_response,
)


class Coursework:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _assignment(self, assignment_id: int) -> models.Assignment:
        assignment = self.db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
        if assignment is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Assignment not found")
        return assignment

    def _teacher_class(self, actor: models.User, class_id: int) -> models.Class:
        school_class = self.db.query(models.Class).filter(models.Class.id == class_id).first()
        if school_class is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Không tìm thấy lớp học")
        if actor.role != "teacher" or school_class.teacher_id != actor.id:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền truy cập lớp học này")
        return school_class

    @staticmethod
    def _require_manager(actor: models.User, assignment: models.Assignment, message: str = "Not authorized") -> None:
        if not policy.can_manage_assignment(
            role=actor.role,
            actor_id=actor.id,
            teacher_id=assignment.teacher_id,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, message)

    def list_assignments(self, actor: models.User) -> list[AssignmentResponse]:
        if not policy.can_list_assignments(role=actor.role):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền xem bài tập")
        query = self.db.query(models.Assignment)
        if actor.role == "teacher":
            query = query.filter(models.Assignment.teacher_id == actor.id)
        elif actor.role == "student":
            query = query.filter(models.Assignment.class_id == actor.class_id)

        return [
            assignment_response(
                assignment,
                role=actor.role,
                submission_count=self.db.query(models.Submission).filter(
                    models.Submission.assignment_id == assignment.id,
                ).count(),
            )
            for assignment in query.all()
        ]

    def create_assignment(self, actor: models.User, request: AssignmentCreateRequest) -> AssignmentResponse:
        if actor.role != "teacher":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Only teachers can create assignments")
        self._teacher_class(actor, request.class_id)

        assignment = models.Assignment(
            title=request.title,
            description=request.description,
            subject=request.subject,
            class_id=request.class_id,
            teacher_id=actor.id,
            deadline=request.deadline,
            total_points=request.total_points,
            created_at=datetime.now().isoformat(),
        )
        with transaction(self.db):
            self.db.add(assignment)
            self.db.flush()
            for order_num, question in enumerate(request.questions):
                self.db.add(models.Question(
                    assignment_id=assignment.id,
                    order_num=order_num,
                    **question.model_dump(),
                ))
            self.db.flush()
            add_class_notifications(
                self.db,
                class_id=assignment.class_id,
                title=f"Bài tập mới: {assignment.title}",
                message=f"Môn {assignment.subject}. Hạn nộp: {assignment.deadline}.",
                notification_type="assignment",
                action_url=f"/student/assignment/{assignment.id}",
            )
            record_audit_event(
                self.db,
                actor=actor,
                action="assignment.created",
                resource_type="assignment",
                resource_id=assignment.id,
                details={"class_id": assignment.class_id},
            )

        return assignment_response(assignment, role=actor.role)

    def update_assignment(
        self,
        actor: models.User,
        assignment_id: int,
        request: AssignmentUpdateRequest,
    ) -> AssignmentResponse:
        if actor.role != "teacher":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Only teachers can update assignments")
        assignment = self._assignment(assignment_id)
        self._require_manager(actor, assignment, "Not authorized to update this assignment")
        self._teacher_class(actor, request.class_id)
        submission_count = self.db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment.id,
        ).count()

        with transaction(self.db):
            assignment.title = request.title
            assignment.description = request.description
            assignment.subject = request.subject
            assignment.class_id = request.class_id
            assignment.deadline = request.deadline
            assignment.total_points = request.total_points

            if submission_count == 0:
                self.db.query(models.Question).filter(
                    models.Question.assignment_id == assignment.id,
                ).delete(synchronize_session=False)
                for order_num, question in enumerate(request.questions):
                    self.db.add(models.Question(
                        assignment_id=assignment.id,
                        order_num=order_num,
                        **question.model_dump(),
                    ))
            record_audit_event(
                self.db,
                actor=actor,
                action="assignment.updated",
                resource_type="assignment",
                resource_id=assignment.id,
                details={"class_id": assignment.class_id, "questions_locked": submission_count > 0},
            )

        return assignment_response(
            assignment,
            role=actor.role,
            submission_count=submission_count,
        )

    def list_submissions(self, actor: models.User, assignment_id: int) -> list[SubmissionResponse]:
        if actor.role not in {"admin", "teacher"}:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này")
        assignment = self._assignment(assignment_id)
        if actor.role != "admin":
            self._require_manager(actor, assignment, "Bạn không có quyền truy cập tài nguyên này")

        submissions = self.db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment_id,
        ).all()
        return [
            submission_response(
                submission,
                student_name=submission.student.name if submission.student else "Unknown",
            )
            for submission in submissions
        ]

    def grade_submission(
        self,
        actor: models.User,
        submission_id: int,
        request: GradeRequest,
    ) -> GradeResponse:
        if actor.role != "teacher":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Only teachers can grade")
        submission = self.db.query(models.Submission).filter(models.Submission.id == submission_id).first()
        if submission is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Submission not found")
        assignment = self._assignment(submission.assignment_id)
        self._require_manager(actor, assignment, "Bạn không có quyền truy cập tài nguyên này")

        answers = {answer.id: answer for answer in submission.answers}
        questions = {
            question.id: question
            for question in self.db.query(models.Question).filter(
                models.Question.assignment_id == assignment.id,
            ).all()
        }
        total_score = 0.0
        with transaction(self.db):
            for grade in request.grades:
                answer = answers.get(grade.answer_id)
                if answer is None:
                    continue
                question = questions.get(answer.question_id)
                if question and not policy.is_valid_manual_grade(score=grade.score, maximum=question.points):
                    raise ApplicationError(
                        ErrorCode.UNPROCESSABLE,
                        "Điểm vượt quá điểm tối đa của câu hỏi",
                    )
                answer.score = grade.score
                answer.feedback = grade.feedback
                total_score += grade.score

            submission.total_score = total_score
            submission.status = "graded"
            submission.graded_at = datetime.now().isoformat()
            record_audit_event(
                self.db,
                actor=actor,
                action="assignment.submission_graded",
                resource_type="submission",
                resource_id=submission.id,
                details={"assignment_id": assignment.id, "total_score": total_score},
            )
        return GradeResponse(message="Graded successfully", total_score=total_score)

    def get_assignment(self, actor: models.User, assignment_id: int) -> AssignmentResponse:
        assignment = self._assignment(assignment_id)
        if not policy.can_view_assignment(
            role=actor.role,
            actor_id=actor.id,
            actor_class_id=actor.class_id,
            teacher_id=assignment.teacher_id,
            class_id=assignment.class_id,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Not authorized to view this assignment")
        submission_count = self.db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment.id,
        ).count()
        return assignment_response(
            assignment,
            role=actor.role,
            submission_count=submission_count,
        )

    def get_my_submission(self, actor: models.User, assignment_id: int) -> SubmissionResponse | None:
        if actor.role != "student":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này")
        assignment = self._assignment(assignment_id)
        if not policy.can_submit_assignment(
            role=actor.role,
            actor_class_id=actor.class_id,
            class_id=assignment.class_id,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Nội dung này không thuộc lớp của bạn")
        submission = self.db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment_id,
            models.Submission.student_id == actor.id,
        ).first()
        if submission is None:
            return None
        return submission_response(
            submission,
            student_name=actor.name,
        )

    def submit_assignment(
        self,
        actor: models.User,
        assignment_id: int,
        request: SubmissionCreateRequest,
    ) -> SubmissionResponse:
        if actor.role != "student":
            raise ApplicationError(ErrorCode.FORBIDDEN, "Only students can submit assignments")
        assignment = self._assignment(assignment_id)
        if not policy.can_submit_assignment(
            role=actor.role,
            actor_class_id=actor.class_id,
            class_id=assignment.class_id,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Nội dung này không thuộc lớp của bạn")
        if not policy.accepts_submissions(status=assignment.status):
            raise ApplicationError(ErrorCode.INVALID_REQUEST, "Bài tập hiện không nhận bài nộp")
        existing = self.db.query(models.Submission).filter(
            models.Submission.assignment_id == assignment_id,
            models.Submission.student_id == actor.id,
        ).first()
        if existing:
            raise ApplicationError(ErrorCode.INVALID_REQUEST, "Assignment already submitted")

        submission = models.Submission(
            assignment_id=assignment_id,
            student_id=actor.id,
            status="submitted",
            submitted_at=datetime.now().isoformat(),
            total_score=0,
        )
        total_score = 0.0
        with transaction(self.db):
            self.db.add(submission)
            self.db.flush()
            for submitted_answer in request.answers:
                question = self.db.query(models.Question).filter(
                    models.Question.id == submitted_answer.question_id,
                    models.Question.assignment_id == assignment_id,
                ).first()
                if question is None:
                    continue
                is_correct, score = policy.score_objective_answer(
                    question_type=question.question_type,
                    submitted_answer=submitted_answer.answer_text,
                    correct_answer=question.correct_answer,
                    points=question.points,
                )
                total_score += score
                self.db.add(models.Answer(
                    submission_id=submission.id,
                    question_id=submitted_answer.question_id,
                    answer_text=submitted_answer.answer_text,
                    is_correct=is_correct,
                    score=score,
                ))
            submission.total_score = total_score
            self.db.flush()
            record_audit_event(
                self.db,
                actor=actor,
                action="assignment.submitted",
                resource_type="submission",
                resource_id=submission.id,
                details={"assignment_id": assignment.id, "total_score": total_score},
            )
        return submission_response(
            submission,
            student_name=actor.name,
        )

    def delete_assignment(self, actor: models.User, assignment_id: int) -> MessageResponse:
        assignment = self._assignment(assignment_id)
        self._require_manager(actor, assignment)
        with transaction(self.db):
            submissions = self.db.query(models.Submission).filter(
                models.Submission.assignment_id == assignment_id,
            ).all()
            for submission in submissions:
                self.db.query(models.Answer).filter(
                    models.Answer.submission_id == submission.id,
                ).delete(synchronize_session=False)
            self.db.query(models.Submission).filter(
                models.Submission.assignment_id == assignment_id,
            ).delete(synchronize_session=False)
            self.db.query(models.Question).filter(
                models.Question.assignment_id == assignment_id,
            ).delete(synchronize_session=False)
            record_audit_event(
                self.db,
                actor=actor,
                action="assignment.deleted",
                resource_type="assignment",
                resource_id=assignment.id,
                details={"class_id": assignment.class_id},
            )
            self.db.delete(assignment)
        return MessageResponse(message="Deleted successfully")

    def close_assignment(self, actor: models.User, assignment_id: int) -> MessageResponse:
        assignment = self._assignment(assignment_id)
        self._require_manager(actor, assignment)
        with transaction(self.db):
            assignment.status = "closed"
            record_audit_event(
                self.db,
                actor=actor,
                action="assignment.closed",
                resource_type="assignment",
                resource_id=assignment.id,
            )
        return MessageResponse(message="Assignment closed successfully")
