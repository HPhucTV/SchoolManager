
import json
import os
import random
import unicodedata

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
DATA_FILE = os.path.join(BACKEND_DIR, "data", "riddles.json")

class RiddleService:
    def __init__(self):
        self.riddles = []
        self.load_riddles()

    def normalize_text(self, text: str) -> str:
        if not text: return ""
        return unicodedata.normalize('NFC', text).lower().strip()

    def load_riddles(self):
        if not os.path.exists(DATA_FILE):
            print(f"[WARNING] Riddles file not found: {DATA_FILE}")
            return
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                self.riddles = json.load(f)
            print(f"[SUCCESS] Loaded {len(self.riddles)} riddles.")
        except Exception as e:
            print(f"[ERROR] Error loading riddles: {e}")

    def get_next_riddle(self, history_ids: list[int]):
        available = [r for r in self.riddles if r['id'] not in history_ids]
        if not available:
            return None
        return random.choice(available)

    def check_answer(self, riddle_id: int, user_answer: str):
        riddle = next((r for r in self.riddles if r['id'] == riddle_id), None)
        if not riddle:
            return {"correct": False, "correct_answer": None}
        
        normalized_user = self.normalize_text(user_answer)
        normalized_correct = self.normalize_text(riddle['answer'])
        
        # Simple match
        is_correct = normalized_user == normalized_correct
        
        return {
            "correct": is_correct,
            "correct_answer": riddle['answer']
        }

    def get_riddle_by_id(self, riddle_id: int):
        return next((r for r in self.riddles if r['id'] == riddle_id), None)

riddle_service = RiddleService()
