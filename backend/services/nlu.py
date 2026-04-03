from __future__ import annotations

import re
from typing import Dict, List, Tuple


class NLUService:
    def __init__(self):
        self.reflective_keywords = [
            "do you feel",
            "do you ever feel",
            "are you lonely",
            "do you have emotions",
            "do you think",
            "what do you think about",
            "do you experience",
            "do you get",
            "can you feel",
        ]

    def is_reflective_question(self, text: str) -> bool:
        """Detect philosophical or reflective questions about the bot."""
        lowered = text.lower().strip()
        return any(keyword in lowered for keyword in self.reflective_keywords)



    def detect_patterns(self, text: str) -> List[str]:
        lowered = text.lower()
        patterns: List[str] = []

        if re.search(r"\bi\s*(am|'m)\s*fine\b", lowered):
            patterns.append("possible_suppression")

        if re.search(r"\b(always|never)\b", lowered):
            patterns.append("cognitive_distortion")

        if "tired of everything" in lowered:
            patterns.append("emotional_exhaustion")

        return patterns

    def detect_safety_risk(self, text: str) -> Tuple[bool, List[str]]:
        lowered = text.lower()
        keywords = [
            "suicide",
            "self-harm",
            "kill myself",
            "end my life",
            "hurt myself",
            "hopeless",
        ]
        hits = [word for word in keywords if word in lowered]
        return len(hits) > 0, hits


nlu_service = NLUService()
