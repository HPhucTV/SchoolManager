
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, security
from app.routers.auth import get_current_user
import csv
from io import StringIO

router = APIRouter()


def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_classes = db.query(models.Class).count()
    total_quizzes = db.query(models.Quiz).count()

    recent_users = (
        db.query(models.User)
        .order_by(models.User.id.desc())
        .limit(5)
        .all()
    )

    return {
        "total_teachers": total_teachers or 0,
        "total_students": total_students or 0,
        "total_classes": total_classes or 0,
        "total_quizzes": total_quizzes or 0,
        "recent_users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "class_id": u.class_id,
            }
            for u in recent_users
        ],
    }


@router.get("/student-template")
async def download_student_template(
    current_user: models.User = Depends(require_admin),
):
    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["Họ tên", "Email", "Mật khẩu"])
    writer.writerow(["Nguyễn Văn A", "nguyenvana@example.edu", "MatKhau123"])
    return Response(
        content="\ufeff" + output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=mau_danh_sach_hoc_sinh.csv"},
    )


@router.post("/import-students")
async def import_students_from_csv(
    class_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    # Validate class exists
    target_class = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not target_class:
        raise HTTPException(status_code=404, detail="Lớp không tồn tại")

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="Chỉ chấp nhận file CSV")

    try:
        contents = await file.read(2 * 1024 * 1024 + 1)
        if len(contents) > 2 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File CSV không được vượt quá 2 MB")
        rows = list(csv.reader(StringIO(contents.decode("utf-8-sig"))))
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="File CSV phải dùng mã hóa UTF-8") from exc

    if not rows or [item.strip().lower() for item in rows[0][:3]] != ["họ tên", "email", "mật khẩu"]:
        raise HTTPException(status_code=400, detail="File CSV phải có ba cột: Họ tên, Email, Mật khẩu")

    results = {"success": 0, "errors": []}
    existing_emails = {
        email.lower()
        for email, in db.query(models.User.email).all()
        if email
    }

    for row_num, row in enumerate(rows[1:], start=2):
        if not row or not row[0]:
            continue

        name = row[0].strip() if row else ""
        email = row[1].strip().lower() if len(row) > 1 else ""
        password = row[2].strip() if len(row) > 2 else ""

        if not name or not email or not password:
            results["errors"].append(f"Dòng {row_num}: Thiếu thông tin (cần Họ tên, Email, Mật khẩu)")
            continue
        if "@" not in email:
            results["errors"].append(f"Dòng {row_num}: Email không hợp lệ")
            continue
        if len(password) < 8 or len(password.encode("utf-8")) > 72:
            results["errors"].append(f"Dòng {row_num}: Mật khẩu phải từ 8 đến 72 byte")
            continue

        if email in existing_emails:
            results["errors"].append(f"Dòng {row_num}: Email '{email}' đã tồn tại")
            continue

        db.add(models.User(
            name=name,
            email=email,
            hashed_password=security.get_password_hash(password),
            role="student",
            class_id=class_id,
        ))
        existing_emails.add(email)
        results["success"] += 1

    # Update student count
    count = db.query(models.User).filter(
        models.User.class_id == class_id, models.User.role == "student"
    ).count()
    target_class.student_count = count or 0

    db.commit()

    return {
        "message": f"Import thành công {results['success']} học sinh vào lớp {target_class.name}",
        "success_count": results["success"],
        "error_count": len(results["errors"]),
        "errors": results["errors"],
    }
