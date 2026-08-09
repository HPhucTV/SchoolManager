
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Request, Response
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

router = APIRouter()
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)

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

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)

# --- Dependency ---

async def get_current_user(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = bearer_token or request.cookies.get(settings.AUTH_COOKIE_NAME)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        # Chỉ chấp nhận access token. Token mời (invite) có hạn 48h nên không
        # được phép dùng để đăng nhập.
        if payload.get("type") != "access":
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Endpoints ---

@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
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
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path="/",
    )
    
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


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    """Clear the browser session cookie; Bearer clients remain stateless."""
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        path="/",
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
    if "phone" in user_update.model_fields_set:
        current_user.phone_number = user_update.phone or None
        
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

    return response

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
