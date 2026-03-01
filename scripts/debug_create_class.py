
import asyncio
import sys
import os

# Ensure backend directory is in python path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import async_session_factory
from app.models import User, Class
from app.routers.classes import create_class
from app.schemas import ClassCreate
from sqlalchemy import select

async def debug_create_class():
    print("--- Starting Debug ---")
    async with async_session_factory() as db:
        # 1. Get a teacher
        result = await db.execute(select(User).where(User.role == 'teacher').limit(1))
        teacher = result.scalar_one_or_none()
        
        if not teacher:
            print("ERROR: No teacher found in DB. Cannot test create class.")
            return

        print(f"Using Teacher: {teacher.name} (ID: {teacher.id})")

        # 2. Simulate Create Class
        new_class_data = ClassCreate(name="Debug Class 101", grade="10", teacher_id=teacher.id)
        
        try:
            print("Attempting to create class via function logic...")
            # Replicating logic from routers/classes.py
            new_class = Class(
                name=new_class_data.name,
                grade=new_class_data.grade,
                teacher_id=teacher.id
            )
            db.add(new_class)
            await db.commit()
            await db.refresh(new_class)
            print(f"SUCCESS: Class Created! ID: {new_class.id}, Name: {new_class.name}")
            
            # 3. Verify it shows up in queries
            print("Verifying visibility...")
            result = await db.execute(select(Class).where(Class.teacher_id == teacher.id))
            classes = result.scalars().all()
            print(f"Teacher now has {len(classes)} classes.")
            found = any(c.id == new_class.id for c in classes)
            if found:
                print("VERIFIED: New class is visible in query.")
            else:
                print("ERROR: New class NOT found in query.")
                
        except Exception as e:
            print(f"EXCEPTION: {e}")
            await db.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(debug_create_class())
