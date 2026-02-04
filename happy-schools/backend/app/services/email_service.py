import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings
import logging

settings = get_settings()

def send_email(to_email: str, subject: str, content: str, is_html: bool = False):
    """
    Sends an email using the configured SMTP server.
    """
    try:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logging.warning("SMTP credentials not configured. Email sending skipped.")
            print(f"--- MOCK EMAIL TO {to_email} ---\nSubject: {subject}\nContent:\n{content}\n-----------------------------")
            return False

        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject

        if is_html:
            msg.attach(MIMEText(content, 'html'))
        else:
            msg.attach(MIMEText(content, 'plain'))

        # Connect to SMTP server
        # For Gmail: 587 (TLS)
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logging.info(f"Email sent to {to_email}")
        return True

    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {e}")
        return False

def send_notification_email(to_email: str, student_name: str, title: str, message: str, action_url: str = None):
    """
    Sends a formatted notification email.
    """
    subject = f"Thông báo mới: {title}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
                <h2 style="color: #6366f1;">Xin chào {student_name},</h2>
                <p>Bạn có một thông báo mới từ Happy Schools:</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">{title}</h3>
                    <p style="margin-bottom: 0;">{message}</p>
                </div>
                
                {f'<p><a href="{action_url}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xem chi tiết</a></p>' if action_url else ''}
                
                <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                    Bạn nhận được email này vì bạn đã đăng ký nhận thông báo từ Happy Schools.<br>
                    Để thay đổi cài đặt, vui lòng truy cập trang Cài đặt.
                </p>
            </div>
        </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content, is_html=True)
