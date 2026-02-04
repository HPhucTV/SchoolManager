
import os
import json
import urllib.request
import ssl

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # scripts/
BACKEND_DIR = os.path.join(BASE_DIR, '..', 'backend')
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
DATASET_FILE = os.path.join(DATA_DIR, 'word_chain_dataset.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

URL = "https://raw.githubusercontent.com/duyet/vietnamese-wordlist/master/Viet74K.txt"

def normalize_text(text):
    return text.strip().lower()

def main():
    print(f"Downloading dataset from {URL}...")
    
    # Bypass SSL verification if needed (for some dev environments)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(URL, context=ctx) as response:
            content = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error downloading: {e}")
        return

    raw_words = content.splitlines()
    print(f"Total raw lines: {len(raw_words)}")

    processed_data = []
    seen = set()

    print("Filtering for 2-syllable words...")
    
    for line in raw_words:
        word = normalize_text(line)
        if not word:
            continue
            
        parts = word.split()
        
        # Word Chain Rule: Must be exactly 2 syllables
        if len(parts) != 2:
            continue
            
        # Optional: Check for valid characters (Vietnamese alphabet)
        # For now, we assume the list is clean enough or allow common chars
        
        if word in seen:
            continue
            
        seen.add(word)
        
        processed_data.append({
            "word": word,
            "first_syllable": parts[0],
            "last_syllable": parts[1]
        })

    print(f"Filtered count: {len(processed_data)}")
    
    # Save to JSON
    with open(DATASET_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved to {DATASET_FILE}")
    
    # Validation
    if 35000 <= len(processed_data) <= 38000:
        print("MATCH: Count is within the expected range (~36,000).")
    else:
        print(f"WARNING: Count {len(processed_data)} differs from expected ~36,000.")

if __name__ == "__main__":
    main()
