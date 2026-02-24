
import sys
import os
import random
import string
import unicodedata
import re
from datetime import datetime

# Add /app to path so we can import 'app' module correctly
sys.path.append("/app")

from app.database import SessionLocal
from app import models
from sqlalchemy.orm import Session

def test_create_online_class():
    print("--- START DEBUGGING ONLINE CLASS CREATION ---")
    db = SessionLocal()
    try:
        # Mock input data
        class_name = "Lớp Test Online 101"
        online_enabled = True
        
        print(f"Attempting to create class: {class_name} (Online: {online_enabled})")

        # 1. Generate Link Logic (Copied from classes.py)
        meeting_link = None
        if online_enabled:
            print("  Generating meeting link...")
            try:
                # Sanitize name for URL
                safe_name = "".join(c for c in unicodedata.normalize('NFD', class_name) if unicodedata.category(c) != 'Mn')
                safe_name = re.sub(r'[^a-zA-Z0-9]', '', safe_name)
                random_suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
                meeting_link = f"https://meet.jit.si/HappySchools_{safe_name}_{random_suffix}"
                print(f"  Generated Link: {meeting_link}")
            except Exception as e:
                print(f"  ERROR generating link: {e}")
                raise e

        # 2. Database Insertion
        print("  Creating DB object...")
        try:
            # check for existing teacher (User ID 1 is usually admin/teacher from seed)
            teacher = db.query(models.User).filter(models.User.role.in_(['teacher', 'admin'])).first()
            if not teacher:
                print("  WARNING: No teacher found. Using ID 1.")
                teacher_id = 1
            else:
                teacher_id = teacher.id
                print(f"  Using Teacher ID: {teacher_id}")

            new_class = models.Class(
                name=class_name + "_" + ''.join(random.choices(string.ascii_lowercase, k=4)), # unique name
                grade="10",
                teacher_id=teacher_id, 
                student_count=0,
                meeting_link=meeting_link,
                online_enabled=online_enabled,
                created_at=datetime.now().isoformat()
            )
            print("  Adding to session...")
            db.add(new_class)
            
            print("  Committing...")
            db.commit()
            
            print("  Refreshing...")
            db.refresh(new_class)
            
            print(f"SUCCESS! Created class ID: {new_class.id}")
            print(f"  Meeting Link: {new_class.meeting_link}")

        except Exception as e:
            print(f"  ERROR in DB operation: {e}")
            db.rollback()
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"General Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("\n--- END DEBUGGING ---")

if __name__ == "__main__":
    test_create_online_class()
