"""Parse teacher-authored DOCX files into quiz questions."""

import io
from typing import Any

import docx


def parse_quiz_docx(contents: bytes) -> list[dict[str, Any]]:
    document = docx.Document(io.BytesIO(contents))
    questions: list[dict[str, Any]] = []
    current: dict[str, Any] = {}

    def append_complete_question() -> None:
        if not current.get("question_text"):
            return
        if not all(key in current for key in ("option_a", "option_b", "option_c", "option_d")):
            return
        current["correct_answer"] = current.get("correct_answer") or "A"
        questions.append(dict(current))

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        text_lower = text.lower()

        if text_lower.startswith("câu"):
            append_complete_question()
            parts = text.split(":", 1)
            current = {
                "question_text": parts[1].strip() if len(parts) > 1 else text,
                "difficulty": "medium",
                "correct_answer": None,
            }
        elif text.startswith(("A.", "A ")) and current:
            current["option_a"] = text[2:].strip()
        elif text.startswith(("B.", "B ")) and current:
            current["option_b"] = text[2:].strip()
        elif text.startswith(("C.", "C ")) and current:
            current["option_c"] = text[2:].strip()
        elif text.startswith(("D.", "D ")) and current:
            current["option_d"] = text[2:].strip()
        elif text_lower.startswith(("đáp án:", "đáp án ")) and current:
            answer = text.split(":", 1)[1].strip().upper() if ":" in text else text.split()[2].strip().upper()
            if answer in {"A", "B", "C", "D"}:
                current["correct_answer"] = answer

    append_complete_question()
    return questions
