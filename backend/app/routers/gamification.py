from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app import models
from app.routers.auth import get_current_user
from datetime import datetime, date

router = APIRouter()

# --- Default Data ---

DEFAULT_BADGES = [
    {"name": "Người mới", "description": "Tham gia SchoolManager", "icon": "🌟", "category": "special", "requirement_type": "join", "requirement_value": 1, "xp_reward": 10, "coin_reward": 10},
    {"name": "Chăm chỉ 3 ngày", "description": "Đăng nhập 3 ngày liên tiếp", "icon": "🔥", "category": "streak", "requirement_type": "streak", "requirement_value": 3, "xp_reward": 20, "coin_reward": 15},
    {"name": "Kiên trì 7 ngày", "description": "Đăng nhập 7 ngày liên tiếp", "icon": "💪", "category": "streak", "requirement_type": "streak", "requirement_value": 7, "xp_reward": 50, "coin_reward": 30},
    {"name": "Siêu bền bỉ", "description": "Đăng nhập 30 ngày liên tiếp", "icon": "👑", "category": "streak", "requirement_type": "streak", "requirement_value": 30, "xp_reward": 200, "coin_reward": 100},
    {"name": "Học giỏi", "description": "Đạt 100% trong 1 bài kiểm tra", "icon": "🏆", "category": "academic", "requirement_type": "quiz_perfect", "requirement_value": 1, "xp_reward": 50, "coin_reward": 25},
    {"name": "Nộp bài đúng hạn", "description": "Nộp 5 bài tập đúng hạn", "icon": "📝", "category": "academic", "requirement_type": "on_time", "requirement_value": 5, "xp_reward": 30, "coin_reward": 20},
    {"name": "Nhà tâm lý", "description": "Ghi nhật ký cảm xúc 7 ngày", "icon": "💚", "category": "social", "requirement_type": "mood", "requirement_value": 7, "xp_reward": 30, "coin_reward": 20},
    {"name": "Gamer", "description": "Chơi 10 mini-game", "icon": "🎮", "category": "special", "requirement_type": "games", "requirement_value": 10, "xp_reward": 25, "coin_reward": 15},
    {"name": "Chiến binh Quiz", "description": "Tham gia 5 Quiz Battle", "icon": "⚔️", "category": "academic", "requirement_type": "battle", "requirement_value": 5, "xp_reward": 40, "coin_reward": 25},
    {"name": "Thần đồng", "description": "Đạt Level 10", "icon": "🧠", "category": "special", "requirement_type": "level", "requirement_value": 10, "xp_reward": 100, "coin_reward": 50},
]

DEFAULT_SHOP_ITEMS = [
    {"name": "Khung avatar Vàng", "description": "Khung avatar màu vàng sang trọng", "item_type": "avatar_frame", "icon": "🖼️", "price": 50},
    {"name": "Khung avatar Kim cương", "description": "Khung avatar kim cương lấp lánh", "item_type": "avatar_frame", "icon": "💎", "price": 150},
    {"name": "Danh hiệu: Học bá", "description": "Hiển thị danh hiệu 'Học bá' bên cạnh tên", "item_type": "title", "icon": "🎓", "price": 100},
    {"name": "Danh hiệu: Siêu sao", "description": "Hiển thị danh hiệu 'Siêu sao' bên cạnh tên", "item_type": "title", "icon": "⭐", "price": 80},
    {"name": "Theme: Đại dương", "description": "Giao diện màu xanh dương", "item_type": "theme", "icon": "🌊", "price": 120},
    {"name": "Theme: Hoàng hôn", "description": "Giao diện màu cam ấm áp", "item_type": "theme", "icon": "🌅", "price": 120},
    {"name": "Sticker Pack: Động vật", "description": "Bộ sticker động vật dễ thương", "item_type": "sticker", "icon": "🐱", "price": 30},
    {"name": "Sticker Pack: Vũ trụ", "description": "Bộ sticker chủ đề vũ trụ", "item_type": "sticker", "icon": "🚀", "price": 30},
]

def seed_gamification_data(db: Session):
    """Seed default badges and shop items if not exist."""
    if db.query(models.Badge).count() == 0:
        for b in DEFAULT_BADGES:
            db.add(models.Badge(**b))
        db.commit()
    
    if db.query(models.ShopItem).count() == 0:
        for item in DEFAULT_SHOP_ITEMS:
            db.add(models.ShopItem(**item))
        db.commit()

# --- Endpoints ---

@router.post("/check-in")
async def daily_check_in(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    seed_gamification_data(db)
    
    today = date.today().isoformat()
    
    if current_user.last_active_date == today:
        return {"message": "Bạn đã điểm danh hôm nay rồi!", "already_checked": True, "streak": current_user.streak_days}
    
    yesterday = (date.today() - __import__('datetime').timedelta(days=1)).isoformat()
    
    if current_user.last_active_date == yesterday:
        current_user.streak_days += 1
    else:
        current_user.streak_days = 1
    
    current_user.last_active_date = today
    
    # XP and coins for check-in
    xp_earned = 5 + min(current_user.streak_days, 10)  # Bonus XP for longer streaks
    coins_earned = 2 + (current_user.streak_days // 3)
    
    current_user.xp_points += xp_earned
    current_user.coins += coins_earned
    
    # Level up check (100 XP per level)
    new_level = (current_user.xp_points // 100) + 1
    leveled_up = new_level > current_user.level
    if leveled_up:
        current_user.level = new_level
        current_user.coins += 20  # Bonus coins for leveling up
    
    # Check streak badges
    _check_streak_badges(db, current_user)
    
    db.commit()
    
    return {
        "message": f"Điểm danh thành công! Streak: {current_user.streak_days} ngày 🔥",
        "already_checked": False,
        "streak": current_user.streak_days,
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "total_xp": current_user.xp_points,
        "total_coins": current_user.coins,
        "level": current_user.level,
        "leveled_up": leveled_up
    }

def _check_streak_badges(db: Session, user: models.User):
    """Check and award streak-based badges."""
    streak_badges = db.query(models.Badge).filter(
        models.Badge.requirement_type == "streak"
    ).all()
    
    for badge in streak_badges:
        if user.streak_days >= badge.requirement_value:
            existing = db.query(models.UserBadge).filter(
                models.UserBadge.user_id == user.id,
                models.UserBadge.badge_id == badge.id
            ).first()
            if not existing:
                db.add(models.UserBadge(
                    user_id=user.id,
                    badge_id=badge.id,
                    earned_at=datetime.now().isoformat()
                ))
                user.xp_points += badge.xp_reward
                user.coins += badge.coin_reward

@router.get("/badges")
async def get_all_badges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    seed_gamification_data(db)
    
    badges = db.query(models.Badge).all()
    user_badges = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == current_user.id
    ).all()
    earned_ids = {ub.badge_id for ub in user_badges}
    
    return [{
        "id": b.id,
        "name": b.name,
        "description": b.description,
        "icon": b.icon,
        "category": b.category,
        "xp_reward": b.xp_reward,
        "coin_reward": b.coin_reward,
        "earned": b.id in earned_ids,
        "earned_at": next((ub.earned_at for ub in user_badges if ub.badge_id == b.id), None)
    } for b in badges]

@router.get("/my-stats")
async def get_my_gamification_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    seed_gamification_data(db)
    
    badges_earned = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == current_user.id
    ).count()
    total_badges = db.query(models.Badge).count()
    
    return {
        "xp": current_user.xp_points,
        "level": current_user.level,
        "coins": current_user.coins,
        "streak": current_user.streak_days,
        "badges_earned": badges_earned,
        "total_badges": total_badges,
        "xp_to_next_level": ((current_user.level) * 100) - current_user.xp_points,
        "xp_progress": (current_user.xp_points % 100),
        "equipped_title": current_user.equipped_title
    }

@router.get("/leaderboard")
async def get_leaderboard(
    scope: str = "class",  # class or school
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.User).filter(models.User.role == "student")
    
    if scope == "class" and current_user.class_id:
        query = query.filter(models.User.class_id == current_user.class_id)
    
    students = query.order_by(desc(models.User.xp_points)).limit(20).all()
    
    leaderboard = []
    for rank, s in enumerate(students, 1):
        leaderboard.append({
            "rank": rank,
            "id": s.id,
            "name": s.name,
            "avatar_url": s.avatar_url,
            "xp": s.xp_points,
            "level": s.level,
            "streak": s.streak_days,
            "is_me": s.id == current_user.id,
            "equipped_title": s.equipped_title
        })
    
    # Find current user's rank if not in top 20
    my_rank = next((item["rank"] for item in leaderboard if item["is_me"]), None)
    if not my_rank:
        higher = query.filter(models.User.xp_points > current_user.xp_points).count()
        my_rank = higher + 1
    
    return {
        "leaderboard": leaderboard,
        "my_rank": my_rank,
        "scope": scope
    }

@router.get("/shop")
async def get_shop_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    seed_gamification_data(db)
    
    items = db.query(models.ShopItem).filter(models.ShopItem.is_active == True).all()
    purchases = db.query(models.Purchase).filter(
        models.Purchase.user_id == current_user.id
    ).all()
    owned_ids = {p.item_id for p in purchases}
    
    return {
        "coins": current_user.coins,
        "items": [{
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "item_type": item.item_type,
            "icon": item.icon,
            "price": item.price,
            "owned": item.id in owned_ids
        } for item in items]
    }

@router.post("/shop/buy/{item_id}")
async def buy_shop_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.ShopItem).filter(models.ShopItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật phẩm")
    
    # Check if already owned
    existing = db.query(models.Purchase).filter(
        models.Purchase.user_id == current_user.id,
        models.Purchase.item_id == item_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã sở hữu vật phẩm này")
    
    if current_user.coins < item.price:
        raise HTTPException(status_code=400, detail=f"Không đủ xu. Cần {item.price} xu, hiện có {current_user.coins} xu")
    
    current_user.coins -= item.price
    purchase = models.Purchase(
        user_id=current_user.id,
        item_id=item_id,
        purchased_at=datetime.now().isoformat()
    )
    db.add(purchase)
    
    # Auto-equip title
    if item.item_type == "title":
        current_user.equipped_title = item.name.replace("Danh hiệu: ", "")
    
    db.commit()
    
    return {
        "message": f"Đã mua '{item.name}' thành công!",
        "coins_remaining": current_user.coins,
        "item": {"id": item.id, "name": item.name, "item_type": item.item_type}
    }
