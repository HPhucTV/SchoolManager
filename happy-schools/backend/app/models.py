
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String) # admin, teacher, student, parent
    phone_number = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Student specific fields
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    happiness_score = Column(Float, default=100)
    engagement_score = Column(Float, default=100)
    mental_health_score = Column(Float, default=100)
    status = Column(String, default="excellent") # excellent, good, attention, warning
    
    # Gamification fields
    xp_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    coins = Column(Integer, default=50)
    streak_days = Column(Integer, default=0)
    last_active_date = Column(String, nullable=True)
    equipped_title = Column(String, nullable=True)
    
    # Notification Preferences
    email_enabled = Column(Boolean, default=True)
    notify_assignments = Column(Boolean, default=True)
    notify_activities = Column(Boolean, default=True)
    notify_surveys = Column(Boolean, default=True)

    student_class = relationship("Class", back_populates="students", foreign_keys=[class_id])
    teacher_class = relationship("Class", back_populates="teacher", foreign_keys="Class.teacher_id")

    # reports written by this user (when role == 'teacher')
    reports = relationship("TeacherReport", back_populates="teacher", cascade="all, delete-orphan")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    grade = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_count = Column(Integer, default=0)
    meeting_link = Column(String, nullable=True)
    class_code = Column(String, unique=True, index=True)
    online_enabled = Column(Boolean, default=False)
    created_at = Column(String, default=None)

    teacher = relationship("User", back_populates="teacher_class", foreign_keys=[teacher_id])
    students = relationship("User", back_populates="student_class", foreign_keys="[User.class_id]")
    schedules = relationship("Schedule", back_populates="class_info", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject = Column(String)                
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    day_of_week = Column(String)            
    start_time = Column(String)             
    end_time = Column(String)               
    room = Column(String, nullable=True)    
    semester = Column(String, default="HK1")
    year = Column(String, default="2025-2026")

    class_info = relationship("Class", back_populates="schedules")
    teacher = relationship("User", foreign_keys=[teacher_id])


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
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")

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

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String)
    message = Column(String)
    type = Column(String, default="system")  # quiz, activity, assignment, survey, system, event
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    action_label = Column(String, nullable=True)
    created_at = Column(String)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)

    user = relationship("User", foreign_keys=[user_id])

# Teacher reports allow instructors to create free‑form notes or analyses about their class.
class TeacherReport(Base):
    __tablename__ = "teacher_reports"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), index=True)
    report_type = Column(String)   # e.g. 'học lực', 'vắng mặt', 'kỷ luật', etc.
    content = Column(Text)
    created_at = Column(String)

    teacher = relationship("User", back_populates="reports", foreign_keys=[teacher_id])
    class_info = relationship("Class")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    total_questions = Column(Integer)
    percentage = Column(Float)
    answers = Column(String) # JSON string of answers
    completed_at = Column(String)

    quiz = relationship("Quiz", back_populates="results")
    student = relationship("User", foreign_keys=[student_id], back_populates="quiz_results")

# Add relationships to User
User.quiz_results = relationship("QuizResult", back_populates="student", cascade="all, delete-orphan")

# ========================
# Feature 1: Mental Health
# ========================

class MoodEntry(Base):
    __tablename__ = "mood_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True)
    mood_level = Column(Integer) # 1-5 (1=very sad, 5=very happy)
    mood_emoji = Column(String) # 😢😟😐🙂😄
    note = Column(Text, nullable=True)
    created_at = Column(String)
    
    student = relationship("User", foreign_keys=[student_id])

class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True)
    message = Column(Text)
    is_anonymous = Column(Boolean, default=True)
    status = Column(String, default="pending") # pending, reviewing, resolved
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_note = Column(Text, nullable=True)
    created_at = Column(String)
    resolved_at = Column(String, nullable=True)
    
    student = relationship("User", foreign_keys=[student_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

# ========================
# Feature 3: Gamification
# ========================

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(String)
    icon = Column(String) # emoji or icon name
    category = Column(String) # academic, social, streak, special
    requirement_type = Column(String) # quiz_score, streak, assignment, mood
    requirement_value = Column(Integer) # e.g. 7 for 7-day streak
    xp_reward = Column(Integer, default=10)
    coin_reward = Column(Integer, default=5)

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(String)
    
    user = relationship("User", foreign_keys=[user_id])
    badge = relationship("Badge")

class ShopItem(Base):
    __tablename__ = "shop_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    item_type = Column(String) # avatar_frame, title, theme, sticker
    icon = Column(String)
    price = Column(Integer) # in coins
    is_active = Column(Boolean, default=True)

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(Integer, primary_key=True, index=True) 
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    item_id = Column(Integer, ForeignKey("shop_items.id"))
    purchased_at = Column(String)
    
    user = relationship("User", foreign_keys=[user_id])
    item = relationship("ShopItem")

# ========================
# Feature 5: Parent Portal
# ========================

class ParentStudent(Base):
    __tablename__ = "parent_students"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), index=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    parent = relationship("User", foreign_keys=[parent_id])
    student = relationship("User", foreign_keys=[student_id])

class ParentMessage(Base):
    __tablename__ = "parent_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), index=True)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(String)
    
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

# ========================
# Feature 7: Quiz Battle
# ========================

class QuizBattle(Base):
    __tablename__ = "quiz_battles"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="waiting") # waiting, active, finished
    current_question = Column(Integer, default=0)
    time_per_question = Column(Integer, default=30) # seconds
    battle_code = Column(String, unique=True, index=True)
    started_at = Column(String, nullable=True)
    finished_at = Column(String, nullable=True)
    created_at = Column(String)
    
    quiz = relationship("Quiz")
    creator = relationship("User", foreign_keys=[created_by])

class BattleParticipant(Base):
    __tablename__ = "battle_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("quiz_battles.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    score = Column(Integer, default=0)
    answers_correct = Column(Integer, default=0)
    answers_total = Column(Integer, default=0)
    joined_at = Column(String)
    
    battle = relationship("QuizBattle")
    user = relationship("User", foreign_keys=[user_id])

class BattleAnswer(Base):
    __tablename__ = "battle_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("quiz_battles.id"), index=True)
    participant_id = Column(Integer, ForeignKey("battle_participants.id"), index=True)
    question_index = Column(Integer)
    answer = Column(String)
    is_correct = Column(Boolean)
    time_taken = Column(Float) # seconds
    points_earned = Column(Integer, default=0)
    answered_at = Column(String)
    
    battle = relationship("QuizBattle")
    participant = relationship("BattleParticipant")
