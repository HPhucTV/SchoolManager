
import json
import os
import random
import unicodedata
from app.config import get_settings

settings = get_settings()

# Use relative path to dataset (relative to this file's location)
# This way it works regardless of where Python is executed from
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))  # Go up to backend/ folder
DATA_FILE = os.path.join(BACKEND_DIR, "data", "word_chain_dataset.json")

class WordService:
    def __init__(self):
        print(f"[INIT] WordService initializing...")
        self.words = set()
        self.words_list = []
        self.word_objects = []  # Store full word objects for reference
        self.index = {} # Map last syllable to list of words
        self.load_dictionary()
        print(f"[INIT] WordService initialized with {len(self.words)} words")
    
    def normalize_text(self, text: str) -> str:
        """Normalize Unicode characters to NFC and strip whitespace."""
        if not text:
            return ""
        return unicodedata.normalize('NFC', text).lower().strip()

    def load_dictionary(self):
        if not os.path.exists(DATA_FILE):
            print(f"[WARNING] Dictionary file not found: {DATA_FILE}")
            print(f"[DEBUG] Looking for: {DATA_FILE}")
            return

        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Handle both list of strings and list of objects
                if data and isinstance(data[0], dict):
                    # New format with objects containing word, first_syllable, last_syllable
                    self.word_objects = data
                    
                    # Normalize all words in the dataset
                    self.words_list = [self.normalize_text(item['word']) for item in data]
                    self.words = set(self.words_list)
                    
                    # Build index: key is FIRST_SYLLABLE, value is list of words starting with that syllable
                    # This is used to find words that START with a given syllable
                    for item in data:
                        first_syl = self.normalize_text(item['first_syllable'])
                        word_norm = self.normalize_text(item['word'])
                        
                        if first_syl not in self.index:
                            self.index[first_syl] = []
                        self.index[first_syl].append(word_norm)
                else:
                    # Old format with plain strings
                    self.words_list = [self.normalize_text(w) for w in data]
                    self.words = set(self.words_list)
                    
                    # Build index for fast lookup
                    for word in self.words_list:
                        first_syllable = word.split()[0] # normalize_text already handled lower/strip
                        if first_syllable not in self.index:
                            self.index[first_syllable] = []
                        self.index[first_syllable].append(word)
                    
            print(f"[SUCCESS] Loaded {len(self.words)} words into dictionary.")
            print(f"[DEBUG] Index keys: {list(self.index.keys())[:20]}...")  # Show first 20 keys
        except Exception as e:
            print(f"[ERROR] Error loading dictionary: {e}")

    def is_valid_word(self, word: str) -> bool:
        return self.normalize_text(word) in self.words

    def get_response(self, user_word: str, history: list[str]) -> dict:
        user_word = self.normalize_text(user_word)
        
        # 0. Check length (2-4 syllables)
        syllables = user_word.split()
        if len(syllables) < 2 or len(syllables) > 4:
            return {
                "valid": False,
                "message": "Từ phải có độ dài từ 2 đến 4 tiếng (ví dụ: 'mèo mun', 'công nghệ').",
                "next_word": None
            }

        # 1. Check if user word is valid
        if not self.is_valid_word(user_word):
            return {
                "valid": False,
                "message": f"Từ '{user_word}' không có trong từ điển tiếng Việt của hệ thống.",
                "next_word": None
            }

        # 2. Check used words
        # Normalize history too just in case
        normalized_history = [self.normalize_text(h) for h in history]
        if user_word in normalized_history:
            return {
                "valid": False,
                "message": f"Từ '{user_word}' đã được sử dụng rồi!",
                "next_word": None
            }
        
        # Get last syllable of user's word
        last_syllable = user_word.split()[-1]
        print(f"\n[CHAIN] User word: '{user_word}' → Last syllable: '{last_syllable}'")
        print(f"[CHAIN] History so far (len): {len(history)}")
        print(f"[CHAIN] Total words in index: {len(self.index)}")
        print(f"[CHAIN] Index has '{last_syllable}': {last_syllable in self.index}")
        
        # 3. Find response - words that start with the last syllable of user's word
        candidates = self.index.get(last_syllable, [])
        print(f"[CHAIN] Raw candidates (words starting with '{last_syllable}'): {len(candidates)} words")
        if len(candidates) <= 5:
            print(f"[CHAIN] Candidates: {candidates}")
        
        # Filter out used words
        valid_candidates = []
        for w in candidates:
            if w not in normalized_history and w != user_word:
                # Extra safety check: No dots, no ellipsis
                if "..." in w or "…" in w:
                    print(f"[CHAIN] REJECTED (has ellipsis): {w}")
                    continue
                valid_candidates.append(w)
        
        print(f"[CHAIN] Valid unused candidates: {len(valid_candidates)} words")
        if len(valid_candidates) <= 5:
            print(f"[CHAIN] Final candidates: {valid_candidates}")
        
        if not valid_candidates:
            print(f"[CHAIN] ❌ NO CANDIDATES - System loses!")
            return {
                "valid": True,
                "next_word": None, 
                "message": "Hệ thống chịu thua! Bạn đã thắng!"
            }
        
        next_word = random.choice(valid_candidates)
        print(f"[CHAIN] ✅ Selected: '{next_word}'")
        
        return {
            "valid": True,
            "next_word": next_word,
            "message": None
        }

# Global instance
word_service = WordService()
