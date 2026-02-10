
from .database import SessionLocal, engine
from . import models, security
from sqlalchemy.orm import Session

def get_password_hash(password: str):
    return security.get_password_hash(password)

def seed_data():
    db: Session = SessionLocal()
    try:
        # Create tables
        models.Base.metadata.create_all(bind=engine)

        # 1. Create Class 10A
        class_10a = db.query(models.Class).filter(models.Class.name == "Lớp 10A").first()
        if not class_10a:
            print("Creating Class 10A...")
            class_10a = models.Class(name="Lớp 10A", grade="10", student_count=0)
            db.add(class_10a)
            db.commit()
            db.refresh(class_10a)

        # 2. Create Admin
        admin_email = "admin@happyschools.vn"
        if not db.query(models.User).filter(models.User.email == admin_email).first():
            print(f"Creating Admin: {admin_email}")
            admin = models.User(
                email=admin_email,
                hashed_password=get_password_hash("test123"),
                name="System Administrator",
                role="admin"
            )
            db.add(admin)

        # 3. Create Teacher
        teacher_email = "gv.10a@happyschools.vn"
        teacher = db.query(models.User).filter(models.User.email == teacher_email).first()
        if not teacher:
            print(f"Creating Teacher: {teacher_email}")
            teacher = models.User(
                email=teacher_email,
                hashed_password=get_password_hash("test123"),
                name="Nguyễn Thị Giáo Viên",
                role="teacher",
                class_id=class_10a.id
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
            class_10a.teacher_id = teacher.id

        # 4. Create Student
        student_email = "hs.an@happyschools.vn"
        if not db.query(models.User).filter(models.User.email == student_email).first():
            print(f"Creating Student: {student_email}")
            student = models.User(
                email=student_email,
                hashed_password=get_password_hash("test123"),
                name="Nguyễn Văn An",
                role="student",
                class_id=class_10a.id,
                status="excellent"
            )
            db.add(student)

        db.commit()
        print("Success: Demo accounts are ready!")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
