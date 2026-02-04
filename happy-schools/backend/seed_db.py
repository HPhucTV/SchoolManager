
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from datetime import datetime
import random

def seed_data():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if data exists
    if db.query(models.User).count() > 0:
        print("Data already seeded.")
        return

    print("Seeding data...")

    # 1. Classes
    classes = [
        models.Class(name="Lớp 10A", grade="10", student_count=0),
        models.Class(name="Lớp 11B", grade="11", student_count=0),
        models.Class(name="Lớp 12A", grade="12", student_count=0),
    ]
    db.add_all(classes)
    db.commit()
    
    # Refresh to get IDs
    for c in classes: db.refresh(c)

    # 2. Users (Admin & Teachers)
    admin = models.User(
        email="admin@happyschools.vn",
        hashed_password="test123", # Plaintext for simplicity
        name="Quản Trị Viên",
        role="admin"
    )
    
    teacher = models.User(
        email="teacher@happyschools.vn",
        hashed_password="test123",
        name="Cô Giáo Thảo",
        role="teacher",
        class_id=classes[0].id # Assign to 10A
    )
    classes[0].teacher_id = 2 # Assuming id 2 (1 will be admin) - wait, commit first to get IDs

    db.add(admin)
    db.add(teacher)
    db.commit()
    
    # Refresh teacher to get ID
    db.refresh(teacher)
    classes[0].teacher_id = teacher.id
    db.commit()

    # 3. Students
    student_names = [
        "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Minh", "Phạm Thu Hà", 
        "Hoàng Văn Nam", "Đỗ Thị Lan", "Vũ Minh Đức", "Bùi Thị Mai"
    ]
    
    for i, name in enumerate(student_names):
        status = random.choice(["excellent", "good", "attention", "warning"])
        scores = {
            "excellent": (80, 100),
            "good": (65, 80),
            "attention": (50, 65),
            "warning": (30, 50)
        }
        score_range = scores[status]
        
        student = models.User(
            email=f"student{i+1}@test.com",
            hashed_password="test123",
            name=name,
            role="student",
            class_id=classes[0].id, # All in 10A
            status=status,
            happiness_score=random.randint(*score_range),
            engagement_score=random.randint(*score_range),
            mental_health_score=random.randint(*score_range)
        )
        db.add(student)
        classes[0].student_count += 1
    
    db.commit()

    # 4. Activities
    activities = [
        models.Activity(
            title="Hội trại Xuân 2024",
            type="Hoạt động",
            description="Hội trại thường niên chào mừng xuân mới",
            scheduled_date="2024-02-15",
            status="upcoming",
            participants_count=45,
            progress=0
        ),
        models.Activity(
            title="Thi đua Hoa điểm 10",
            type="Sự kiện",
            description="Phong trào thi đua giành nhiều điểm 10",
            scheduled_date="2024-03-08",
            status="in-progress",
            participants_count=120,
            progress=65
        )
    ]
    db.add_all(activities)
    db.commit()

    print("Seeding complete!")
    db.close()

if __name__ == "__main__":
    seed_data()
