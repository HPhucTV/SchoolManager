
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String) # admin, teacher, student
    phone_number = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Student specific fields
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    happiness_score = Column(Float, default=100)
    engagement_score = Column(Float, default=100)
    mental_health_score = Column(Float, default=100)
    status = Column(String, default="excellent") # excellent, good, attention, warning
    
    # Notification Preferences
    email_enabled = Column(Boolean, default=True)
    notify_assignments = Column(Boolean, default=True)
    notify_activities = Column(Boolean, default=True)
    notify_surveys = Column(Boolean, default=True)

    student_class = relationship("Class", back_populates="students", foreign_keys=[class_id])
    teacher_class = relationship("Class", back_populates="teacher", uselist=False, foreign_keys="Class.teacher_id")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    grade = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    student_count = Column(Integer, default=0)
    meeting_link = Column(String, nullable=True)
    online_enabled = Column(Boolean, default=False)
    created_at = Column(String, default=None)

    teacher = relationship("User", back_populates="teacher_class", foreign_keys=[teacher_id])
    students = relationship("User", back_populates="student_class", foreign_keys=[User.class_id])


class Activity(Base) :
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    title = Column(String, index=True)
    type = Column(String)
    description = Column(String, nullable=True)
    scheduled_date = Column(String)
    status = Column(String, default="scheduled")
    participants_count = Column(Integer, default=0)
    progress = Column(Integer, default=0)
    created_at = Column(String, nullable=True)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    deadline = Column(String, nullable=True)
    status = Column(String, default="active") # active, closed, draft
    total_points = Column(Integer, default=10)
    created_at = Column(String)

    questions = relationship("Question", back_populates="assignment", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    question_type = Column(String) # multiple_choice, essay
    question_text = Column(String)
    points = Column(Integer, default=1)
    option_a = Column(String, nullable=True)
    option_b = Column(String, nullable=True)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_answer = Column(String, nullable=True) # A, B, C, D
    order_num = Column(Integer, default=0)

    assignment = relationship("Assignment", back_populates="questions")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="submitted") # submitted, graded
    total_score = Column(Float, default=0)
    submitted_at = Column(String)
    graded_at = Column(String, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer_text = Column(String)
    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, default=0)
    feedback = Column(String, nullable=True)

    submission = relationship("Submission", back_populates="answers")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    subject = Column(String)
    topic = Column(String)
    class_id = Column(Integer, ForeignKey("classes.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    easy_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    hard_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    deadline = Column(String, nullable=True)
    allow_retake = Column(Boolean, default=False)
    status = Column(String, default="draft") # draft, active, closed
    created_at = Column(String)

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    # Add submissions if needed later

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(String)
    difficulty = Column(String) # easy, medium, hard
    option_a = Column(String)
    option_b = Column(String)
    option_c = Column(String)
    option_d = Column(String)
    correct_answer = Column(String) # A, B, C, D
    order_num = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")
