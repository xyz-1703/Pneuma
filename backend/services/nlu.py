from __future__ import annotations

import re
from typing import Dict, List, Tuple

from transformers import pipeline

# Lightweight sentiment model with negative/neutral/positive labels.
sentiment_classifier = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
)


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

    def detect_sentiment(self, text: str) -> Dict[str, object]:
        if not text.strip():
            return {"label": "neutral", "confidence": 0.5, "intensity": "low"}

        try:
            result = sentiment_classifier(text)[0]
            label = str(result.get("label", "neutral")).lower()
            score = float(result.get("score", 0.5))

            # Normalize a few possible model label formats.
            if label in {"label_0", "negative"}:
                sentiment = "negative"
            elif label in {"label_1", "neutral"}:
                sentiment = "neutral"
            else:
                sentiment = "positive"

            return {
                "label": sentiment,
                "confidence": round(score, 3),
                "intensity": self._confidence_to_intensity(score),
            }
        except Exception:
            return self._heuristic_sentiment(text)

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

    def detect_contradiction(self, emotion: str, sentiment_label: str) -> Dict[str, object]:
        positive_emotions = {
            "joy",
            "love",
            "gratitude",
            "admiration",
            "approval",
            "excitement",
            "amusement",
            "optimism",
            "pride",
            "relief",
            "caring",
        }
        negative_emotions = {
            "sadness",
            "disappointment",
            "grief",
            "remorse",
            "embarrassment",
            "anger",
            "annoyance",
            "disapproval",
            "disgust",
            "fear",
            "nervousness",
            "shame",
        }

        mismatch = (
            (emotion in positive_emotions and sentiment_label == "negative")
            or (emotion in negative_emotions and sentiment_label == "positive")
        )

        note = (
            "Potential mismatch between sentiment and emotion. Prefer gentle clarification."
            if mismatch
            else "No major sentiment-emotion mismatch detected."
        )

        return {"mismatch": mismatch, "note": note}

    @staticmethod
    def _confidence_to_intensity(score: float) -> str:
        if score >= 0.8:
            return "high"
        if score >= 0.6:
            return "medium"
        return "low"

    def _heuristic_sentiment(self, text: str) -> Dict[str, object]:
        lowered = text.lower()

        positive_tokens = ["good", "great", "grateful", "better", "happy", "hopeful", "love"]
        negative_tokens = ["bad", "sad", "angry", "tired", "hopeless", "worried", "anxious"]

        pos_hits = sum(1 for token in positive_tokens if token in lowered)
        neg_hits = sum(1 for token in negative_tokens if token in lowered)

        if pos_hits > neg_hits:
            label = "positive"
            confidence = 0.62
        elif neg_hits > pos_hits:
            label = "negative"
            confidence = 0.62
        else:
            label = "neutral"
            confidence = 0.55

        return {
            "label": label,
            "confidence": confidence,
            "intensity": self._confidence_to_intensity(confidence),
        }


nlu_service = NLUService()
