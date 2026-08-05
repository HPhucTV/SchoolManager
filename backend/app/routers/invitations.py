
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.authorization import get_accessible_class, require_roles
from app.routers.auth import get_current_user
from app.config import get_settings
from datetime import timedelta
from html import escape
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()
settings = get_settings()

class InvitationRequest(BaseModel):
    email: EmailStr
    class_id: int
    student_name: Optional[str] = None

def send_email(to_email: str, subject: str, html_content: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("SMTP credentials not configured. Skipping email.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@router.post("/send")
async def send_invitation(
    invitation: InvitationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Endpoint to send an invitation to a student.
    """
    require_roles(current_user, "admin", "teacher")
    target_class = get_accessible_class(db, current_user, invitation.class_id)
    
    existing_user = db.query(models.User).filter(models.User.email == invitation.email).first()
    if existing_user:
        if existing_user.class_id == invitation.class_id:
             return {"message": "Học sinh đã ở trong lớp này rồi"}
    
    # Generate Invite Token (simulated or real JWT)
    # Using a simple JWT with invite data for now
    from app import security
    invite_token = security.create_access_token(
        data={"sub": invitation.email, "type": "invite", "class_id": invitation.class_id},
        expires_delta=timedelta(hours=48),
    )
    join_link = f"{settings.FRONTEND_URL.rstrip('/')}/join?token={invite_token}"
    
    # Send Email with Rich HTML Template
    subject = f"Lời mời tham gia lớp {target_class.name} - Happy Schools"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }}
            .header {{ background-color: #22c55e; padding: 40px 20px; text-align: center; color: white; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .header p {{ margin: 5px 0 0; opacity: 0.9; }}
            .content {{ padding: 40px 30px; background-color: #ffffff; }}
            .card {{ background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }}
            .card h2 {{ color: #16a34a; margin: 0 0 5px; font-size: 20px; }}
            .btn {{ display: inline-block; background-color: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; margin-top: 20px; }}
            .footer {{ padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #f3f4f6; background-color: #f9fafb; }}
            .link {{ color: #22c55e; word-break: break-all; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Happy Schools</h1>
                <p>Nền tảng theo dõi hạnh phúc học đường</p>
            </div>
            <div class="content">
                <p>Xin chào! 👋</p>
                <p>Bạn đã được mời tham gia vào lớp học trên Happy Schools.</p>
                
                <div class="card">
                    <h2>{escape(target_class.name)}</h2>
                    <p style="margin: 0; color: #666;">Giáo viên phụ trách</p>
                    <p style="margin: 5px 0 0; font-weight: 600;">{escape(invitation.student_name or current_user.name)}</p>
                </div>
                
                <p style="text-align: center; color: #4b5563;">Nhấn nút bên dưới để tham gia lớp học ngay:</p>
                
                <div style="text-align: center;">
                    <a href="{join_link}" class="btn">Tham gia ngay</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 13px; color: #9ca3af;">
                    Hoặc copy link này vào trình duyệt:<br>
                    <a href="{join_link}" class="link">{join_link}</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2024 Happy Schools. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    sent = send_email(invitation.email, subject, html_content)
    
    status_msg = "Invitation sent successfully" if sent else "Invitation simulated (SMTP not configured)"

    return {
        "message": status_msg,
        "email": invitation.email,
        "class_id": invitation.class_id,
        "class_name": target_class.name,
        "join_link": join_link
    }
