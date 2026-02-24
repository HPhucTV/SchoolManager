"""
Migration script to add new feature tables and columns to existing database.
Run: docker compose exec backend python migrate_new_features.py
"""
import sys
import os
sys.path.append(os.path.join(os.getcwd()))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app import models

def migrate():
    db = SessionLocal()
    
    print("🔄 Starting migration for new features...")
    
    # ============================================
    # 1. Add missing columns to 'users' table
    # ============================================
    new_user_columns = [
        ("xp_points", "INTEGER DEFAULT 0"),
        ("level", "INTEGER DEFAULT 1"),
        ("coins", "INTEGER DEFAULT 50"),
        ("streak_days", "INTEGER DEFAULT 0"),
        ("last_active_date", "VARCHAR"),
        ("equipped_title", "VARCHAR"),
    ]
    
    for col_name, col_type in new_user_columns:
        try:
            db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
            db.commit()
            print(f"  ✅ Added column users.{col_name}")
        except Exception as e:
            db.rollback()
            if "already exists" in str(e) or "duplicate column" in str(e).lower():
                print(f"  ⏭️  Column users.{col_name} already exists, skipping")
            else:
                print(f"  ❌ Error adding users.{col_name}: {e}")
    
    # ============================================
    # 2. Create all new tables (if not exist)
    # ============================================
    # This will only create tables that don't already exist
    models.Base.metadata.create_all(bind=engine)
    print("  ✅ Created all new tables (mood_entries, sos_alerts, badges, user_badges, shop_items, purchases, parent_students, parent_messages, quiz_battles, battle_participants, battle_answers)")
    
    # ============================================
    # 3. Seed default badges and shop items
    # ============================================
    from app.routers.gamification import DEFAULT_BADGES, DEFAULT_SHOP_ITEMS
    
    badge_count = db.execute(text("SELECT count(*) FROM badges")).scalar()
    if badge_count == 0:
        for badge_data in DEFAULT_BADGES:
            db.add(models.Badge(**badge_data))
        db.commit()
        print(f"  ✅ Seeded {len(DEFAULT_BADGES)} badges")
    else:
        print(f"  ⏭️  Badges already exist ({badge_count}), skipping")
    
    shop_count = db.execute(text("SELECT count(*) FROM shop_items")).scalar()
    if shop_count == 0:
        for item_data in DEFAULT_SHOP_ITEMS:
            db.add(models.ShopItem(**item_data))
        db.commit()
        print(f"  ✅ Seeded {len(DEFAULT_SHOP_ITEMS)} shop items")
    else:
        print(f"  ⏭️  Shop items already exist ({shop_count}), skipping")
    
    print("\n🎉 Migration complete!")
    db.close()

if __name__ == "__main__":
    migrate()
