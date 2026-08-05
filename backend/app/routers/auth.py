
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field
import jwt
from app.database import get_db
from app import models
from app import security
from app.config import get_settings
from app.authorization import get_accessible_class, require_roles, validate_role
from pathlib import Path
import secrets
import uuid
import json
from app.services.cache_service import redis_service

router = APIRouter()
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# --- Pydantic Schemas ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    
    # Notification fields
    email_enabled: bool = True
    notify_assignments: bool = True
    notify_activities: bool = True
    notify_surveys: bool = True
    
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: str
    class_id: Optional[int] = None

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    class_id: Optional[int] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    # Notification preferences
    email_enabled: Optional[bool] = None
    notify_assignments: Optional[bool] = None
    notify_activities: Optional[bool] = None
    notify_surveys: Optional[bool] = None

class ClassCreate(BaseModel):
    name: str
    grade: str
    teacher_id: Optional[int] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)

# --- Dependency ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Endpoints ---

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    # Bcrypt limit check (72 bytes)
    # If password is too long, it's definitely not the correct one if we used bcrypt
    if len(credentials.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    if not security.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    class_name = None
    if user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == user.class_id).first()
        if cls:
            class_name = cls.name
    
    if user.role == "teacher" and not class_name:
         teacher_classes = db.query(models.Class).filter(models.Class.teacher_id == user.id).all()
         if teacher_classes:
             class_name = ", ".join([c.name for c in teacher_classes])
    
    access_token = security.create_access_token(data={"sub": user.email, "id": user.id, "role": user.role})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            class_id=user.class_id,
            class_name=class_name
        )
    )

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    class_name = None
    if current_user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == current_user.class_id).first()
        if cls:
             class_name = cls.name
    
    if current_user.role == "teacher" and not class_name:
         teacher_classes = db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
         if teacher_classes:
             class_name = ", ".join([c.name for c in teacher_classes])

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        phone_number=current_user.phone_number,
        avatar_url=current_user.avatar_url,
        class_id=current_user.class_id,
        class_name=class_name,
        email_enabled=current_user.email_enabled if current_user.email_enabled is not None else True,
        notify_assignments=current_user.notify_assignments if current_user.notify_assignments is not None else True,
        notify_activities=current_user.notify_activities if current_user.notify_activities is not None else True,
        notify_surveys=current_user.notify_surveys if current_user.notify_surveys is not None else True
    )

@router.put("/users/me", response_model=UserResponse)
async def update_user_me(user_update: UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.name:
        current_user.name = user_update.name
    if user_update.email:
        # Check if email exists
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing and existing.id != current_user.id:
             raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    if user_update.phone:
        current_user.phone_number = user_update.phone
        
    # Update notification preferences
    if user_update.email_enabled is not None: current_user.email_enabled = user_update.email_enabled
    if user_update.notify_assignments is not None: current_user.notify_assignments = user_update.notify_assignments
    if user_update.notify_activities is not None: current_user.notify_activities = user_update.notify_activities
    if user_update.notify_surveys is not None: current_user.notify_surveys = user_update.notify_surveys
        
    db.commit()
    db.refresh(current_user)
    
    # Return full response
    return await read_users_me(current_user, db)

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify current password
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
         raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    
    # Update password
    current_user.hashed_password = security.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công"}

@router.post("/users/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed_types = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP")

    contents = await file.read(5 * 1024 * 1024 + 1)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ảnh không được vượt quá 5 MB")

    upload_dir = Path("static/avatars")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{current_user.id}_{uuid.uuid4().hex}.{allowed_types[file.content_type]}"
    (upload_dir / file_name).write_bytes(contents)
        
    # Update DB
    # URL should be absolute or relative depending on frontend needs. 
    # Let's return relative path that frontend can prepend API_URL to if needed, 
    # or just served via static mount.
    # Frontend seems to expect /static/...
    avatar_url = f"/static/avatars/{file_name}"
    current_user.avatar_url = avatar_url
    db.commit()
    
    return {"avatar_url": avatar_url}

# ... (Keep existing admin endpoints but upgrade get_users to include phone/avatar if needed)
# For brevity, assuming typical admin endpoints remain mostly same or implicitly handled by model update.
# But let's verify get_users
@router.get("/users", response_model=List[UserResponse])
async def get_users(role: Optional[str] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    if role is not None:
        validate_role(role)

    # Try cache first
    cache_key = f"users:{role}" if role else "users:all"
    cached_data = redis_service.get(cache_key)
    if cached_data:
        try:
             # Deserialize list of dicts and convert to UserResponse
             data_list = json.loads(cached_data)
             return [UserResponse(**item) for item in data_list]
        except Exception as e:
            print(f"Cache miss error: {e}")
            pass

    query = db.query(models.User).options(
        joinedload(models.User.student_class),
        joinedload(models.User.teacher_class)
    )
    if role:
        query = query.filter(models.User.role == role)
    users = query.all()
    
    response = []
    for user in users:
        class_name = None
        if user.student_class:
            class_name = user.student_class.name
        elif user.teacher_class:
            class_name = ", ".join([c.name for c in user.teacher_class])
        
        response.append(UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            phone_number=user.phone_number,
            avatar_url=user.avatar_url,
            class_id=user.class_id,
            class_name=class_name
        ))
    
    # Set cache
    try:
        # Pydantic v2 use model_dump(), v1 use dict()
        # Ensure we serialize correctly
        to_cache = [item.model_dump() for item in response]
        redis_service.set(cache_key, json.dumps(to_cache), expire=300) # Cache 5 mins
    except Exception as e:
        print(f"Failed to set cache: {e}")
        
    return response

@router.get("/classes")
async def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)): 
    require_roles(current_user, "admin", "teacher")
    query = db.query(models.Class)
    if current_user.role == "teacher":
        query = query.filter(models.Class.teacher_id == current_user.id)
    
    classes = query.all()
    result = []
    for c in classes:
        teacher_name = None
        if c.teacher_id:
            teacher = db.query(models.User).filter(models.User.id == c.teacher_id).first()
            if teacher: teacher_name = teacher.name
            
        result.append({
            "id": c.id,
            "name": c.name,
            "grade": c.grade,
            "teacher_id": c.teacher_id,
            "teacher_name": teacher_name,
            "student_count": c.student_count
        })
    return result

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    validate_role(user.role)

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user.role == "student":
        if user.class_id is None:
            raise HTTPException(status_code=422, detail="Học sinh phải được gán vào một lớp")
        get_accessible_class(db, current_user, user.class_id)
    elif user.class_id is not None:
        raise HTTPException(status_code=422, detail="Chỉ học sinh mới có class_id")
    
    try:
        hashed_pw = security.get_password_hash(user.password)
        new_user = models.User(
            email=user.email,
            hashed_password=hashed_pw,
            name=user.name,
            role=user.role,
            class_id=user.class_id if user.role == "student" else None
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Không thể tạo người dùng")
    
    if user.role == 'student' and user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == user.class_id).first()
        if cls:
            cls.student_count += 1
            db.commit()
            
    class_name = None
    if new_user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == new_user.class_id).first()
        if cls:
             class_name = cls.name

    # Invalidate cache
    redis_service.invalidate_pattern("users:*")

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        class_id=new_user.class_id,
        class_name=class_name
    )

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể xóa chính tài khoản đang đăng nhập")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "admin" and db.query(models.User).filter(models.User.role == "admin").count() <= 1:
        raise HTTPException(status_code=400, detail="Không thể xóa quản trị viên cuối cùng")
    
    if user.role == 'student' and user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == user.class_id).first()
        if cls:
             cls.student_count = max(0, cls.student_count - 1)
             
    db.delete(user)
    db.commit()
    
    # Invalidate cache
    redis_service.invalidate_pattern("users:*")
    
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    temporary_password = secrets.token_urlsafe(12)
    user.hashed_password = security.get_password_hash(temporary_password)
    db.commit()
    
    return {
        "message": f"Mật khẩu tạm thời của {user.name}: {temporary_password}",
        "requires_password_change": True,
    }

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: AdminUserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.email is not None:
        existing = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != user_id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

    old_class_id = user.class_id
    new_class_id = user_update.class_id if user_update.class_id is not None else old_class_id

    if user.role == "student" and new_class_id is not None:
        get_accessible_class(db, current_user, new_class_id)
    elif user.role != "student" and user_update.class_id is not None:
        raise HTTPException(status_code=422, detail="Chỉ học sinh mới có class_id")

    if user_update.name is not None:
        user.name = user_update.name
    if user_update.email is not None:
        user.email = user_update.email
    if user.role == "student":
        user.class_id = new_class_id
    
    if user.role == 'student' and old_class_id != new_class_id:
        if old_class_id:
             old_cls = db.query(models.Class).filter(models.Class.id == old_class_id).first()
             if old_cls: old_cls.student_count = max(0, old_cls.student_count - 1)
        if new_class_id:
             new_cls = db.query(models.Class).filter(models.Class.id == new_class_id).first()
             if new_cls: new_cls.student_count += 1
    
    db.commit()
    db.refresh(user)

    # Invalidate cache
    redis_service.invalidate_pattern("users:*")

    class_name = None
    if user.class_id:
        cls = db.query(models.Class).filter(models.Class.id == user.class_id).first()
        if cls:
             class_name = cls.name
             
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        class_id=user.class_id,
        class_name=class_name
    )

@router.post("/classes")
async def create_class(class_data: ClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    db_class = db.query(models.Class).filter(models.Class.name == class_data.name).first()
    if db_class:
         raise HTTPException(status_code=400, detail="Class name already exists")
    if class_data.teacher_id is not None:
        teacher = db.query(models.User).filter(
            models.User.id == class_data.teacher_id,
            models.User.role == "teacher",
        ).first()
        if not teacher:
            raise HTTPException(status_code=422, detail="Giáo viên phụ trách không hợp lệ")

    new_class = models.Class(
        name=class_data.name,
        grade=class_data.grade,
        teacher_id=class_data.teacher_id,
        student_count=0
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    teacher_name = None
    if new_class.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == new_class.teacher_id).first()
        if teacher: teacher_name = teacher.name

    return {
        "id": new_class.id,
        "name": new_class.name,
        "grade": new_class.grade,
        "teacher_id": new_class.teacher_id,
        "teacher_name": teacher_name,
        "student_count": 0
    }

@router.put("/classes/{class_id}")
async def update_class(class_id: int, class_data: ClassCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_roles(current_user, "admin")
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    duplicate = db.query(models.Class).filter(
        models.Class.name == class_data.name,
        models.Class.id != class_id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Class name already exists")
    if class_data.teacher_id is not None:
        teacher = db.query(models.User).filter(
            models.User.id == class_data.teacher_id,
            models.User.role == "teacher",
        ).first()
        if not teacher:
            raise HTTPException(status_code=422, detail="Giáo viên phụ trách không hợp lệ")
        
    cls.name = class_data.name
    cls.grade = class_data.grade
    cls.teacher_id = class_data.teacher_id
    
    db.commit()
    db.refresh(cls)
    
    teacher_name = None
    if cls.teacher_id:
        teacher = db.query(models.User).filter(models.User.id == cls.teacher_id).first()
        if teacher: teacher_name = teacher.name

    return {
        "id": cls.id,
        "name": cls.name,
        "grade": cls.grade,
        "teacher_id": cls.teacher_id,
        "teacher_name": teacher_name,
        "student_count": cls.student_count
    }
