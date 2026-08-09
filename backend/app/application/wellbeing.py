"""Privacy-first wellbeing use cases."""

from datetime import datetime, timedelta

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app import models
from app.application.audit import record_audit_event
from app.application.errors import ApplicationError, ErrorCode
from app.application.transactions import transaction
from app.domain import wellbeing as policy
from app.schemas.wellbeing import (
    ClassWellnessResponse,
    MessageResponse,
    MoodAnalyticsResponse,
    MoodCreateRequest,
    MoodPointResponse,
    MoodResponse,
    SOSAlertResponse,
    SOSCreateRequest,
    SOSCreatedResponse,
    SOSUpdateRequest,
    StudentWellnessSummary,
)


class Wellbeing:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _require_role(actor: models.User, *roles: str) -> None:
        if actor.role not in roles:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này")

    def _school_class(self, class_id: int) -> models.Class:
        school_class = self.db.query(models.Class).filter(models.Class.id == class_id).first()
        if school_class is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Không tìm thấy lớp học")
        return school_class

    def _require_class_access(self, actor: models.User, class_id: int) -> models.Class:
        school_class = self._school_class(class_id)
        if not policy.can_review_student(
            role=actor.role,
            actor_id=actor.id,
            class_teacher_id=school_class.teacher_id,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền xem dữ liệu wellbeing của lớp này")
        return school_class

    def create_mood(self, actor: models.User, request: MoodCreateRequest) -> MoodResponse:
        self._require_role(actor, "student")
        entry = models.MoodEntry(
            student_id=actor.id,
            mood_level=request.mood_level,
            mood_emoji=request.mood_emoji,
            note=request.note.strip() if request.note and request.note.strip() else None,
            created_at=datetime.now().isoformat(),
        )
        with transaction(self.db):
            self.db.add(entry)
            self.db.flush()
            record_audit_event(
                self.db,
                actor=actor,
                action="wellbeing.mood_recorded",
                resource_type="mood_entry",
                resource_id=entry.id,
                details={"mood_level": request.mood_level},
            )
        return MoodResponse.model_validate(entry)

    def mood_history(self, actor: models.User, *, days: int) -> list[MoodResponse]:
        self._require_role(actor, "student")
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        entries = self.db.query(models.MoodEntry).filter(
            models.MoodEntry.student_id == actor.id,
            models.MoodEntry.created_at >= cutoff,
        ).order_by(desc(models.MoodEntry.created_at)).all()
        return [MoodResponse.model_validate(entry) for entry in entries]

    def mood_analytics(self, actor: models.User) -> MoodAnalyticsResponse:
        self._require_role(actor, "student")
        now = datetime.now()
        recent = self.db.query(models.MoodEntry).filter(
            models.MoodEntry.student_id == actor.id,
            models.MoodEntry.created_at >= (now - timedelta(days=7)).isoformat(),
        ).all()
        month = self.db.query(models.MoodEntry).filter(
            models.MoodEntry.student_id == actor.id,
            models.MoodEntry.created_at >= (now - timedelta(days=30)).isoformat(),
        ).all()
        average_week = sum(entry.mood_level for entry in recent) / len(recent) if recent else 0
        average_month = sum(entry.mood_level for entry in month) / len(month) if month else 0
        distribution = {level: 0 for level in range(1, 6)}
        for entry in month:
            distribution[entry.mood_level] += 1
        trend = "stable"
        if average_week > average_month + 0.5:
            trend = "improving"
        elif average_week < average_month - 0.5:
            trend = "declining"
        return MoodAnalyticsResponse(
            avg_week=round(average_week, 1),
            avg_month=round(average_month, 1),
            trend=trend,
            total_entries=len(month),
            distribution=distribution,
            recent_entries=[MoodPointResponse.model_validate(entry, from_attributes=True) for entry in recent],
        )

    def create_sos(self, actor: models.User, request: SOSCreateRequest) -> SOSCreatedResponse:
        self._require_role(actor, "student")
        alert = models.SOSAlert(
            student_id=actor.id,
            message=request.message.strip(),
            is_anonymous=request.is_anonymous,
            created_at=datetime.now().isoformat(),
        )
        with transaction(self.db):
            self.db.add(alert)
            self.db.flush()
            if actor.class_id:
                school_class = self.db.query(models.Class).filter(models.Class.id == actor.class_id).first()
                if school_class and school_class.teacher_id:
                    self.db.add(models.Notification(
                        user_id=school_class.teacher_id,
                        title="Tín hiệu hỗ trợ từ học sinh",
                        message="Một học sinh ẩn danh cần được hỗ trợ." if request.is_anonymous else f"{actor.name} cần được hỗ trợ.",
                        type="sos",
                        action_url="/teacher/suc-khoe",
                        created_at=datetime.now().isoformat(),
                    ))
            record_audit_event(
                self.db,
                actor=actor,
                action="wellbeing.sos_created",
                resource_type="sos_alert",
                resource_id=alert.id,
                details={"is_anonymous": request.is_anonymous},
            )
        return SOSCreatedResponse(
            message="Tín hiệu SOS đã được gửi. Giáo viên sẽ liên hệ hỗ trợ bạn.",
            id=alert.id,
        )

    def list_sos(self, actor: models.User, *, status: str | None = None) -> list[SOSAlertResponse]:
        self._require_role(actor, "teacher", "admin")
        query = self.db.query(models.SOSAlert)
        if actor.role == "teacher":
            class_ids = [
                school_class.id
                for school_class in self.db.query(models.Class).filter(models.Class.teacher_id == actor.id).all()
            ]
            student_ids = [
                student.id
                for student in self.db.query(models.User).filter(
                    models.User.role == "student",
                    models.User.class_id.in_(class_ids),
                ).all()
            ] if class_ids else []
            query = query.filter(models.SOSAlert.student_id.in_(student_ids))
        if status:
            query = query.filter(models.SOSAlert.status == status)

        responses: list[SOSAlertResponse] = []
        for alert in query.order_by(desc(models.SOSAlert.created_at)).all():
            student = alert.student
            identity = policy.visible_sos_identity(
                is_anonymous=alert.is_anonymous,
                student_id=alert.student_id,
                student_name=student.name if student else "Không xác định",
            )
            responses.append(SOSAlertResponse(
                id=alert.id,
                student_id=identity.student_id,
                student_name=identity.student_name,
                message=alert.message,
                is_anonymous=alert.is_anonymous,
                status=alert.status,
                reviewer_note=alert.reviewer_note,
                created_at=alert.created_at,
                resolved_at=alert.resolved_at,
            ))
        return responses

    def update_sos(
        self,
        actor: models.User,
        alert_id: int,
        request: SOSUpdateRequest,
    ) -> MessageResponse:
        self._require_role(actor, "teacher", "admin")
        alert = self.db.query(models.SOSAlert).filter(models.SOSAlert.id == alert_id).first()
        if alert is None:
            raise ApplicationError(ErrorCode.NOT_FOUND, "Không tìm thấy SOS")
        student = alert.student
        if student is None or student.class_id is None:
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền xử lý SOS này")
        school_class = self._school_class(student.class_id)
        if not policy.can_review_student(
            role=actor.role,
            actor_id=actor.id,
            class_teacher_id=school_class.teacher_id,
        ):
            raise ApplicationError(ErrorCode.FORBIDDEN, "Bạn không có quyền xử lý SOS này")
        if not policy.can_transition_sos(current_status=alert.status, next_status=request.status):
            raise ApplicationError(ErrorCode.INVALID_REQUEST, "Không thể mở lại SOS đã giải quyết")

        with transaction(self.db):
            alert.status = request.status
            alert.reviewed_by = actor.id
            if request.reviewer_note is not None:
                alert.reviewer_note = request.reviewer_note.strip() or None
            if request.status == "resolved" and alert.resolved_at is None:
                alert.resolved_at = datetime.now().isoformat()
            record_audit_event(
                self.db,
                actor=actor,
                action="wellbeing.sos_updated",
                resource_type="sos_alert",
                resource_id=alert.id,
                details={"status": request.status},
            )
        return MessageResponse(message="Cập nhật SOS thành công")

    def class_summary(self, actor: models.User, class_id: int) -> ClassWellnessResponse:
        self._require_role(actor, "teacher", "admin")
        self._require_class_access(actor, class_id)
        students = self.db.query(models.User).filter(
            models.User.class_id == class_id,
            models.User.role == "student",
        ).all()
        cutoff = (datetime.now() - timedelta(days=7)).isoformat()
        summaries: list[StudentWellnessSummary] = []
        mood_averages: list[float] = []
        status_counts = {"stable": 0, "attention": 0, "warning": 0, "no_data": 0}
        for student in students:
            moods = self.db.query(models.MoodEntry).filter(
                models.MoodEntry.student_id == student.id,
                models.MoodEntry.created_at >= cutoff,
            ).order_by(desc(models.MoodEntry.created_at)).limit(5).all()
            average = sum(mood.mood_level for mood in moods) / len(moods) if moods else 0
            if moods:
                mood_averages.append(average)
            status = policy.mood_checkin_status(average=average, has_recent_checkin=bool(moods))
            status_counts[status] += 1
            summaries.append(StudentWellnessSummary(
                id=student.id,
                name=student.name,
                status=status,
                avg_mood=round(average, 1),
                has_recent_checkin=bool(moods),
            ))
        student_ids = [student.id for student in students]
        active_sos = self.db.query(models.SOSAlert).filter(
            models.SOSAlert.student_id.in_(student_ids),
            models.SOSAlert.status.in_(["pending", "reviewing"]),
        ).count() if student_ids else 0
        return ClassWellnessResponse(
            total_students=len(students),
            avg_mood=round(sum(mood_averages) / len(mood_averages), 1) if mood_averages else 0,
            status_counts=status_counts,
            active_sos_count=active_sos,
            students=summaries,
        )
