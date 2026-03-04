"""
SchoolManager — Comprehensive Demo Seed Script
Populates ALL features with realistic Vietnamese data for demo presentation.

Usage:  cd SchoolManager && python scripts/seed_db.py
Login:  admin@happyschools.vn / test123
        gv.thao@happyschools.vn / test123
        gv.minh@happyschools.vn / test123
        hs.an@happyschools.vn / test123  (or any student)
"""

import sys, os, random, json, string
from datetime import datetime, timedelta

# Fix Windows console encoding for Vietnamese/emoji
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, security

# ─── Helpers ─────────────────────────────────────────────────────

now = datetime.utcnow()

def ts(days_ago: int = 0, hours_ago: int = 0) -> str:
    """Return ISO timestamp N days/hours ago."""
    return (now - timedelta(days=days_ago, hours=hours_ago)).isoformat()

def future_ts(days_ahead: int = 0) -> str:
    return (now + timedelta(days=days_ahead)).isoformat()

def rand_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))

PW = security.get_password_hash("test123")

# ─── Main ────────────────────────────────────────────────────────

def seed_data():
    models.Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    if db.query(models.User).count() > 0:
        print("⚠️  Database already has data. Drop tables first or use a fresh DB.")
        print("   To reset: delete backend/sql_app.db and re-run this script.")
        db.close()
        return

    print("🌱 Seeding demo data...\n")

    # ═══════════════════════════════════════════════════════════════
    # 1. CLASSES
    # ═══════════════════════════════════════════════════════════════
    classes_data = [
        ("Lớp 10A1", "10", rand_code()),
        ("Lớp 10A2", "10", rand_code()),
        ("Lớp 11B1", "11", rand_code()),
        ("Lớp 12A1", "12", rand_code()),
    ]
    classes = []
    for name, grade, code in classes_data:
        c = models.Class(
            name=name, grade=grade, class_code=code,
            student_count=0, created_at=ts(60),
        )
        db.add(c)
        classes.append(c)
    db.commit()
    for c in classes:
        db.refresh(c)
    print(f"  ✅ {len(classes)} lớp học")

    # ═══════════════════════════════════════════════════════════════
    # 2. USERS — Admin + Teachers + Students
    # ═══════════════════════════════════════════════════════════════
    admin = models.User(
        email="admin@happyschools.vn", hashed_password=PW,
        name="Quản Trị Viên", role="admin",
    )
    db.add(admin)

    teachers_info = [
        ("Cô Giáo Thảo", "gv.thao@happyschools.vn", "0987654321", classes[0]),
        ("Thầy Giáo Minh", "gv.minh@happyschools.vn", "0912345678", classes[1]),
        ("Cô Giáo Hạnh", "gv.hanh@happyschools.vn", "0909876543", classes[2]),
        ("Thầy Giáo Long", "gv.long@happyschools.vn", "0978123456", classes[3]),
    ]
    teachers = []
    for name, email, phone, cls in teachers_info:
        t = models.User(
            email=email, hashed_password=PW, name=name, role="teacher",
            phone_number=phone,
            avatar_url=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=0D8ABC&color=fff",
        )
        db.add(t)
        teachers.append((t, cls))
    db.commit()

    for t, cls in teachers:
        db.refresh(t)
        cls.teacher_id = t.id
    db.commit()

    # Students — 8 per class (32 total)
    student_names = [
        "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Minh", "Phạm Thu Hà",
        "Hoàng Văn Nam", "Đỗ Thị Lan", "Vũ Minh Đức", "Bùi Thị Mai",
        "Ngô Quang Huy", "Đinh Thị Ngọc", "Trịnh Đình Khôi", "Lý Thị Hương",
        "Dương Văn Tùng", "Phan Thị Yến", "Hồ Thanh Sơn", "Tạ Thị Kim",
        "Đặng Minh Tuấn", "Chu Thị Phương", "Lương Văn Bảo", "Mai Thị Oanh",
        "Trương Quốc Việt", "Nguyễn Thị Ánh", "Cao Đức Trung", "Võ Thị Thảo",
        "Bạch Văn Dũng", "Phùng Thị Liên", "Lê Quang Hiếu", "Trần Thị Diệu",
        "Nguyễn Hữu Phát", "Đàm Thị Thanh", "Vương Đình Lộc", "Huỳnh Thị Mỹ",
    ]
    statuses = ["excellent", "good", "attention", "warning"]
    score_ranges = {
        "excellent": (82, 98), "good": (65, 82),
        "attention": (48, 65), "warning": (30, 48),
    }

    all_students = []
    for i, name in enumerate(student_names):
        cls = classes[i // 8]
        status = statuses[i % 4]
        sr = score_ranges[status]
        s = models.User(
            email=f"hs.{name.split()[-1].lower()}{i}@happyschools.vn",
            hashed_password=PW, name=name, role="student",
            class_id=cls.id, status=status,
            happiness_score=random.randint(*sr),
            engagement_score=random.randint(*sr),
            mental_health_score=random.randint(*sr),
            xp_points=random.randint(0, 500),
            level=random.randint(1, 6),
            coins=random.randint(10, 200),
            streak_days=random.randint(0, 15),
            last_active_date=ts(random.randint(0, 3)),
        )
        db.add(s)
        all_students.append(s)
        cls.student_count += 1

    db.commit()
    for s in all_students:
        db.refresh(s)
    print(f"  ✅ 1 admin + {len(teachers)} giáo viên + {len(all_students)} học sinh")

    teacher_10a1 = teachers[0][0]
    teacher_10a2 = teachers[1][0]

    # ═══════════════════════════════════════════════════════════════
    # 3. SCHEDULES (Thời khoá biểu)
    # ═══════════════════════════════════════════════════════════════
    subjects = ["Toán", "Văn", "Anh", "Lý", "Hoá", "Sinh", "Sử", "Địa", "GDCD", "Tin học"]
    days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"]
    time_slots = [
        ("07:00", "07:45"), ("07:45", "08:30"), ("08:45", "09:30"),
        ("09:30", "10:15"), ("10:30", "11:15"),
        ("13:30", "14:15"), ("14:15", "15:00"),
    ]
    rooms = ["Phòng A1", "Phòng A2", "Phòng B1", "Phòng B2", "Phòng Lab", "Phòng Tin"]

    schedule_count = 0
    for cls in classes:
        teacher_obj = db.query(models.User).filter(models.User.id == cls.teacher_id).first()
        for day in days:
            n_periods = random.randint(4, 6)
            used_slots = random.sample(range(len(time_slots)), n_periods)
            for slot_idx in used_slots:
                start, end = time_slots[slot_idx]
                db.add(models.Schedule(
                    class_id=cls.id, subject=random.choice(subjects),
                    teacher_id=teacher_obj.id if teacher_obj else None,
                    day_of_week=day, start_time=start, end_time=end,
                    room=random.choice(rooms),
                    semester="HK2", year="2025-2026",
                ))
                schedule_count += 1
    db.commit()
    print(f"  ✅ {schedule_count} tiết học")

    # ═══════════════════════════════════════════════════════════════
    # 4. ACTIVITIES (Hoạt động)
    # ═══════════════════════════════════════════════════════════════
    activities_data = [
        ("Hội trại Xuân 2026", "Hoạt động ngoại khoá", "Hội trại chào mừng xuân mới với các trò chơi thi đua giữa các lớp", "completed", 85),
        ("Thi đua Hoa điểm 10", "Sự kiện", "Phong trào thi đua giành nhiều điểm 10 trong học kỳ 2", "in-progress", 65),
        ("Ngày hội STEM", "Workshop", "Triển lãm các dự án khoa học sáng tạo của học sinh", "scheduled", 0),
        ("Câu lạc bộ Tiếng Anh", "CLB", "Buổi sinh hoạt câu lạc bộ Tiếng Anh giao lưu với trường bạn", "in-progress", 40),
        ("Thi Hùng biện", "Sự kiện", "Cuộc thi hùng biện chủ đề 'Tuổi trẻ và Tương lai'", "upcoming", 0),
        ("Thể thao Mùa xuân", "Thể dục thể thao", "Giải bóng đá, cầu lông, bóng bàn giữa các lớp", "in-progress", 50),
        ("Ngày Nhà giáo 20/11", "Sự kiện", "Chương trình văn nghệ chào mừng ngày Nhà giáo Việt Nam", "completed", 100),
        ("Tham quan dã ngoại", "Hoạt động ngoại khoá", "Chuyến tham quan học tập tại Đà Lạt", "scheduled", 0),
    ]
    for i, (title, act_type, desc, status, progress) in enumerate(activities_data):
        db.add(models.Activity(
            class_id=classes[i % len(classes)].id,
            title=title, type=act_type, description=desc,
            scheduled_date=ts(30 - i * 5) if status == "completed" else future_ts(i * 7),
            status=status, participants_count=random.randint(20, 120),
            progress=progress, created_at=ts(45 - i * 3),
        ))
    db.commit()
    print(f"  ✅ {len(activities_data)} hoạt động")

    # ═══════════════════════════════════════════════════════════════
    # 5. ASSIGNMENTS + QUESTIONS + SUBMISSIONS + ANSWERS
    # ═══════════════════════════════════════════════════════════════
    assignments_data = [
        ("Bài tập Toán chương 3", "Toán", "Giải bài tập phương trình bậc hai", classes[0], teacher_10a1, "active", 7),
        ("Bài tập Văn - Phân tích thơ", "Ngữ văn", "Phân tích bài thơ 'Đây thôn Vĩ Dạ' của Hàn Mặc Tử", classes[0], teacher_10a1, "active", 5),
        ("English Homework Unit 6", "Tiếng Anh", "Complete exercises in Unit 6: The Environment", classes[0], teacher_10a1, "closed", -3),
        ("Bài tập Vật Lý - Điện học", "Vật Lý", "Bài tập về định luật Ohm và mạch điện", classes[1], teacher_10a2, "active", 10),
        ("Bài tập Hoá - Axit Bazơ", "Hoá Học", "Cân bằng phương trình phản ứng hoá học", classes[1], teacher_10a2, "active", 3),
        ("Bài tập Sinh học - Tế bào", "Sinh Học", "Vẽ và mô tả cấu trúc tế bào thực vật", classes[1], teacher_10a2, "closed", -7),
    ]

    all_assignments = []
    for title, subject, desc, cls, teacher, status, deadline_days in assignments_data:
        a = models.Assignment(
            title=title, subject=subject, description=desc,
            class_id=cls.id, teacher_id=teacher.id,
            status=status, total_points=10,
            deadline=future_ts(deadline_days) if deadline_days > 0 else ts(-deadline_days),
            created_at=ts(15),
        )
        db.add(a)
        all_assignments.append(a)
    db.commit()
    for a in all_assignments:
        db.refresh(a)

    # Questions for each assignment (3 multiple_choice + 1 essay)
    question_templates = {
        "Toán": [
            ("Phương trình x² - 5x + 6 = 0 có nghiệm là:", "x = 2 và x = 3", "x = 1 và x = 6", "x = -2 và x = -3", "x = 2 và x = -3", "A"),
            ("Đạo hàm của hàm số f(x) = 3x² + 2x - 1 là:", "6x + 2", "3x + 2", "6x - 1", "6x² + 2", "A"),
            ("Giá trị của sin(30°) là:", "1/2", "√2/2", "√3/2", "1", "A"),
        ],
        "Ngữ văn": [
            ("Tác giả bài thơ 'Đây thôn Vĩ Dạ' là ai?", "Hàn Mặc Tử", "Xuân Diệu", "Huy Cận", "Chế Lan Viên", "A"),
            ("Bài thơ 'Đây thôn Vĩ Dạ' thuộc phong trào nào?", "Thơ mới", "Thơ cổ điển", "Thơ chiến tranh", "Thơ dân gian", "A"),
            ("Phong cách sáng tác của Hàn Mặc Tử là gì?", "Lãng mạn pha huyền ảo", "Hiện thực phê phán", "Sử thi anh hùng", "Châm biếm trào phúng", "A"),
        ],
        "Tiếng Anh": [
            ("Choose the correct form: She ___ to school every day.", "goes", "go", "going", "gone", "A"),
            ("What is the past tense of 'write'?", "wrote", "writed", "wroten", "writing", "A"),
            ("Which word means 'environment' in Vietnamese?", "Môi trường", "Thời tiết", "Khí hậu", "Thiên nhiên", "A"),
        ],
    }

    for a in all_assignments:
        subj_key = a.subject.split()[0] if a.subject else "Toán"
        qs = question_templates.get(subj_key, question_templates["Toán"])
        for i, (qt, oa, ob, oc, od, correct) in enumerate(qs):
            db.add(models.Question(
                assignment_id=a.id, question_type="multiple_choice",
                question_text=qt, points=2,
                option_a=oa, option_b=ob, option_c=oc, option_d=od,
                correct_answer=correct, order_num=i + 1,
            ))
        # 1 essay question
        db.add(models.Question(
            assignment_id=a.id, question_type="essay",
            question_text=f"Hãy trình bày hiểu biết của em về chủ đề {a.subject}.",
            points=4, order_num=4,
        ))
    db.commit()

    # Submissions (some students submit, some don't)
    questions_by_assignment = {}
    for a in all_assignments:
        questions_by_assignment[a.id] = (
            db.query(models.Question).filter(models.Question.assignment_id == a.id).all()
        )

    submission_count = 0
    for a in all_assignments:
        class_students = [s for s in all_students if s.class_id == a.class_id]
        submitters = random.sample(class_students, k=min(len(class_students), random.randint(4, 7)))
        for student in submitters:
            score = round(random.uniform(4, 10), 1)
            sub = models.Submission(
                assignment_id=a.id, student_id=student.id,
                status=random.choice(["submitted", "graded"]),
                total_score=score,
                submitted_at=ts(random.randint(0, 10)),
                graded_at=ts(random.randint(0, 5)) if random.random() > 0.3 else None,
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)

            for q in questions_by_assignment[a.id]:
                if q.question_type == "multiple_choice":
                    chosen = random.choice(["A", "B", "C", "D"])
                    correct = chosen == q.correct_answer
                    db.add(models.Answer(
                        submission_id=sub.id, question_id=q.id,
                        answer_text=chosen, is_correct=correct,
                        score=q.points if correct else 0,
                    ))
                else:
                    db.add(models.Answer(
                        submission_id=sub.id, question_id=q.id,
                        answer_text="Em nghĩ rằng chủ đề này rất quan trọng vì nó giúp chúng ta hiểu sâu hơn về kiến thức.",
                        is_correct=None, score=round(random.uniform(1, q.points), 1),
                        feedback="Bài làm tốt, cần bổ sung thêm ví dụ minh hoạ." if random.random() > 0.5 else None,
                    ))
            submission_count += 1
    db.commit()
    print(f"  ✅ {len(all_assignments)} bài tập + câu hỏi + {submission_count} bài nộp")

    # ═══════════════════════════════════════════════════════════════
    # 6. QUIZZES + QUIZ QUESTIONS + QUIZ RESULTS
    # ═══════════════════════════════════════════════════════════════
    quizzes_data = [
        ("Kiểm tra 15 phút - Toán", "Toán", "Phương trình bậc hai", classes[0], teacher_10a1, "active"),
        ("Kiểm tra 1 tiết - Văn", "Ngữ văn", "Thơ ca hiện đại", classes[0], teacher_10a1, "active"),
        ("English Quiz - Unit 5-6", "Tiếng Anh", "Grammar & Vocabulary", classes[0], teacher_10a1, "closed"),
        ("Kiểm tra Vật Lý chương 4", "Vật Lý", "Dòng điện xoay chiều", classes[1], teacher_10a2, "active"),
        ("Hoá Học - Bazơ và Muối", "Hoá Học", "Phản ứng hoá học", classes[1], teacher_10a2, "draft"),
    ]

    quiz_questions_pool = [
        ("Nghiệm của phương trình 2x + 4 = 0 là gì?", "easy", "x = -2", "x = 2", "x = -4", "x = 4", "A"),
        ("Tính diện tích hình tròn bán kính 5cm:", "medium", "25π cm²", "10π cm²", "50π cm²", "5π cm²", "A"),
        ("Tích phân ∫x dx từ 0 đến 2 bằng:", "hard", "2", "4", "1", "8", "A"),
        ("Tác phẩm 'Chí Phèo' do ai sáng tác?", "easy", "Nam Cao", "Ngô Tất Tố", "Vũ Trọng Phụng", "Kim Lân", "A"),
        ("Thể loại của tác phẩm 'Số đỏ' là gì?", "medium", "Tiểu thuyết", "Truyện ngắn", "Thơ", "Kịch", "A"),
        ("Choose: I ___ a student.", "easy", "am", "is", "are", "be", "A"),
        ("Past participle of 'go':", "medium", "gone", "went", "goed", "going", "A"),
        ("Đơn vị đo cường độ dòng điện là:", "easy", "Ampe (A)", "Vôn (V)", "Ôm (Ω)", "Watt (W)", "A"),
        ("Công thức định luật Ohm:", "medium", "U = I × R", "I = U × R", "R = U × I", "P = U × I", "A"),
        ("Nguyên tố nào có kí hiệu Fe?", "easy", "Sắt", "Đồng", "Nhôm", "Kẽm", "A"),
    ]

    all_quizzes = []
    for title, subject, topic, cls, teacher, status in quizzes_data:
        n_q = random.randint(5, 8)
        easy = n_q // 3
        medium = n_q // 3
        hard = n_q - easy - medium
        q = models.Quiz(
            title=title, subject=subject, topic=topic,
            class_id=cls.id, teacher_id=teacher.id,
            easy_count=easy, medium_count=medium, hard_count=hard,
            total_questions=n_q,
            deadline=future_ts(random.randint(1, 14)) if status == "active" else ts(5),
            allow_retake=random.choice([True, False]),
            status=status, created_at=ts(random.randint(5, 30)),
        )
        db.add(q)
        all_quizzes.append(q)
    db.commit()
    for q in all_quizzes:
        db.refresh(q)

    for quiz in all_quizzes:
        selected = random.sample(quiz_questions_pool, min(quiz.total_questions, len(quiz_questions_pool)))
        for i, (qt, diff, oa, ob, oc, od, correct) in enumerate(selected):
            db.add(models.QuizQuestion(
                quiz_id=quiz.id, question_text=qt, difficulty=diff,
                option_a=oa, option_b=ob, option_c=oc, option_d=od,
                correct_answer=correct, order_num=i + 1,
            ))
    db.commit()

    # Quiz Results
    result_count = 0
    for quiz in all_quizzes:
        if quiz.status == "draft":
            continue
        class_students = [s for s in all_students if s.class_id == quiz.class_id]
        takers = random.sample(class_students, k=min(len(class_students), random.randint(3, 7)))
        for student in takers:
            correct = random.randint(1, quiz.total_questions)
            pct = round((correct / quiz.total_questions) * 100, 1)
            answers_json = json.dumps({str(i): random.choice(["A", "B", "C", "D"]) for i in range(quiz.total_questions)})
            db.add(models.QuizResult(
                quiz_id=quiz.id, student_id=student.id,
                score=correct, total_questions=quiz.total_questions,
                percentage=pct, answers=answers_json,
                completed_at=ts(random.randint(0, 10)),
            ))
            result_count += 1
    db.commit()
    print(f"  ✅ {len(all_quizzes)} bài kiểm tra + {result_count} kết quả")

    # ═══════════════════════════════════════════════════════════════
    # 7. NOTIFICATIONS
    # ═══════════════════════════════════════════════════════════════
    notif_templates = [
        ("📝 Bài tập mới", "Cô Thảo vừa giao bài tập Toán chương 3", "assignment"),
        ("📋 Kiểm tra sắp tới", "Kiểm tra 15 phút Toán vào thứ 5 tuần này", "quiz"),
        ("🎯 Hoạt động mới", "Ngày hội STEM sẽ diễn ra vào tuần sau", "activity"),
        ("⚡ Điểm danh hàng ngày", "Đừng quên điểm danh hôm nay để giữ streak!", "system"),
        ("🏆 Chúc mừng!", "Bạn đã đạt Level 3! Nhận 20 xu thưởng", "system"),
        ("📊 Kết quả kiểm tra", "Kết quả kiểm tra Tiếng Anh đã được công bố", "quiz"),
        ("💚 Sức khoẻ tinh thần", "Hãy dành ít phút ghi lại cảm xúc của bạn hôm nay", "system"),
        ("🎮 Quiz Battle", "Thầy Minh vừa tạo phòng Quiz Battle mới!", "event"),
    ]

    notif_count = 0
    for student in all_students:
        n_notifs = random.randint(3, 6)
        selected_notifs = random.sample(notif_templates, n_notifs)
        for i, (title, message, ntype) in enumerate(selected_notifs):
            db.add(models.Notification(
                user_id=student.id, title=title, message=message,
                type=ntype, is_read=random.random() > 0.5,
                created_at=ts(i),
            ))
            notif_count += 1
    # Notifications for teachers too
    for t, _ in teachers:
        db.add(models.Notification(
            user_id=t.id, title="📊 Báo cáo tuần", message="Xem tổng kết hoạt động lớp học tuần này",
            type="system", is_read=False, created_at=ts(0),
        ))
        db.add(models.Notification(
            user_id=t.id, title="🆘 Cảnh báo SOS", message="Có học sinh gửi tin nhắn cần hỗ trợ",
            type="system", is_read=False, created_at=ts(1),
        ))
        notif_count += 2
    db.commit()
    print(f"  ✅ {notif_count} thông báo")

    # ═══════════════════════════════════════════════════════════════
    # 8. MOOD ENTRIES (Nhật ký cảm xúc)
    # ═══════════════════════════════════════════════════════════════
    moods = [(1, "😢"), (2, "😟"), (3, "😐"), (4, "🙂"), (5, "😄")]
    mood_notes = [
        "Hôm nay em cảm thấy vui vì được điểm cao",
        "Hơi mệt sau buổi tập thể dục",
        "Bình thường, không có gì đặc biệt",
        "Lo lắng vì sắp thi giữa kỳ",
        "Rất vui vì được bạn bè giúp đỡ",
        "Buồn vì không hiểu bài Toán",
        "Hào hứng chuẩn bị cho ngày hội STEM",
        None,
    ]

    mood_count = 0
    for student in all_students:
        n_entries = random.randint(5, 14)
        for d in range(n_entries):
            level, emoji = random.choice(moods)
            db.add(models.MoodEntry(
                student_id=student.id,
                mood_level=level, mood_emoji=emoji,
                note=random.choice(mood_notes),
                created_at=ts(d),
            ))
            mood_count += 1
    db.commit()
    print(f"  ✅ {mood_count} nhật ký cảm xúc")

    # ═══════════════════════════════════════════════════════════════
    # 9. SOS ALERTS
    # ═══════════════════════════════════════════════════════════════
    sos_messages = [
        "Em cảm thấy rất áp lực với việc học, không biết nói với ai.",
        "Em bị bạn trong lớp trêu chọc và cảm thấy buồn.",
        "Em gặp vấn đề ở nhà, không tập trung học được.",
    ]
    sos_students = random.sample(all_students, 3)
    for i, student in enumerate(sos_students):
        status = ["pending", "reviewing", "resolved"][i]
        db.add(models.SOSAlert(
            student_id=student.id, message=sos_messages[i],
            is_anonymous=random.choice([True, False]),
            status=status,
            reviewed_by=teacher_10a1.id if status != "pending" else None,
            reviewer_note="Đã liên hệ phụ huynh và tư vấn tâm lý cho học sinh." if status == "resolved" else None,
            created_at=ts(5 - i),
            resolved_at=ts(1) if status == "resolved" else None,
        ))
    db.commit()
    print(f"  ✅ {len(sos_students)} cảnh báo SOS")

    # ═══════════════════════════════════════════════════════════════
    # 10. GAMIFICATION — Badges + Shop Items + UserBadges
    # ═══════════════════════════════════════════════════════════════
    from app.routers.gamification import DEFAULT_BADGES, DEFAULT_SHOP_ITEMS

    badge_objs = []
    for bd in DEFAULT_BADGES:
        b = models.Badge(**bd)
        db.add(b)
        badge_objs.append(b)
    db.commit()
    for b in badge_objs:
        db.refresh(b)

    for item_data in DEFAULT_SHOP_ITEMS:
        db.add(models.ShopItem(**item_data))
    db.commit()

    # Award some badges to students
    badge_count = 0
    for student in all_students:
        n_badges = random.randint(1, 4)
        selected_badges = random.sample(badge_objs, n_badges)
        for badge in selected_badges:
            db.add(models.UserBadge(
                user_id=student.id, badge_id=badge.id,
                earned_at=ts(random.randint(1, 30)),
            ))
            badge_count += 1
    db.commit()
    print(f"  ✅ {len(DEFAULT_BADGES)} huy hiệu + {len(DEFAULT_SHOP_ITEMS)} vật phẩm + {badge_count} huy hiệu đã nhận")

    # ═══════════════════════════════════════════════════════════════
    # 11. TEACHER REPORTS
    # ═══════════════════════════════════════════════════════════════
    reports_data = [
        ("học lực", "Nhìn chung lớp 10A1 có kết quả học tập ổn định. 60% học sinh đạt loại Giỏi, 30% Khá, 10% Trung bình. Cần chú ý hỗ trợ thêm cho nhóm học sinh yếu môn Toán."),
        ("vắng mặt", "Trong tháng 2/2026, lớp có 5 lượt vắng. Học sinh Nguyễn Văn An vắng 2 buổi có phép (ốm). Hoàng Văn Nam vắng 3 buổi không phép - đã liên hệ phụ huynh."),
        ("kỷ luật", "Lớp chấp hành tốt nội quy. Có 1 trường hợp vi phạm nói chuyện trong giờ học, đã nhắc nhở."),
    ]
    for rtype, content in reports_data:
        db.add(models.TeacherReport(
            teacher_id=teacher_10a1.id, class_id=classes[0].id,
            report_type=rtype, content=content,
            created_at=ts(random.randint(1, 15)),
        ))
    db.commit()
    print(f"  ✅ {len(reports_data)} báo cáo giáo viên")

    # ═══════════════════════════════════════════════════════════════
    # 12. SEARCH HISTORY (sample)
    # ═══════════════════════════════════════════════════════════════
    search_queries = ["Toán", "Nguyễn Văn An", "10A1", "kiểm tra", "bài tập"]
    for q_text in search_queries:
        db.add(models.SearchHistory(
            user_id=teacher_10a1.id, query=q_text,
            searched_at=ts(random.randint(0, 5)),
        ))
    db.commit()
    print(f"  ✅ {len(search_queries)} lịch sử tìm kiếm")

    # ═══════════════════════════════════════════════════════════════
    # DONE
    # ═══════════════════════════════════════════════════════════════
    db.close()
    print("\n" + "=" * 55)
    print("🎉 SEEDING COMPLETE! Tài khoản demo:")
    print("=" * 55)
    print(f"  👑 Admin:    admin@happyschools.vn / test123")
    print(f"  👩‍🏫 Giáo viên: gv.thao@happyschools.vn / test123")
    print(f"  👨‍🏫 Giáo viên: gv.minh@happyschools.vn / test123")
    print(f"  👧 Học sinh:  hs.an0@happyschools.vn / test123")
    print(f"  👦 Học sinh:  hs.binh1@happyschools.vn / test123")
    print("=" * 55)
    print(f"\n📊 Tổng kết dữ liệu:")
    print(f"   • {len(classes)} lớp học, {len(teachers)} giáo viên, {len(all_students)} học sinh")
    print(f"   • {schedule_count} tiết trong thời khoá biểu")
    print(f"   • {len(all_assignments)} bài tập + {submission_count} bài nộp")
    print(f"   • {len(all_quizzes)} bài kiểm tra + {result_count} kết quả")
    print(f"   • {len(activities_data)} hoạt động ngoại khoá")
    print(f"   • {notif_count} thông báo")
    print(f"   • {mood_count} nhật ký cảm xúc + {len(sos_students)} cảnh báo SOS")
    print(f"   • {len(DEFAULT_BADGES)} huy hiệu + {len(DEFAULT_SHOP_ITEMS)} vật phẩm shop")
    print(f"   • {len(reports_data)} báo cáo giáo viên")


if __name__ == "__main__":
    seed_data()
