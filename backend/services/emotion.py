from typing import Tuple, Dict

from transformers import pipeline

# Load model once (important for performance)
classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True,
)


class EmotionService:
    def __init__(self) -> None:
        self.model = classifier

    def detect_emotion(self, text: str) -> Tuple[str, float]:
        """
        Detect emotion from text using the 27-emotion model.
        Returns: (emotion, confidence)
        where emotion is one of the 27 emotions from j-hartmann model:
        joy, love, surprise, fear, anger, sadness, disgust, shame, guilt, 
        pride, relief, hope, improvement, gratitude, admiration, confusion, 
        realization, amazement, approval, disapproval, annoyance, caring, 
        excitement, helpfulness, tease, curiosity, enthusiasm, nervousness
        """
        if not text.strip():
            return "neutral", 0.5

        try:
            results = self.model(text)[0]
            
            # Get highest scoring emotion (raw 27-emotion label from model)
            top_result = max(results, key=lambda x: x["score"])
            
            emotion_label = top_result["label"].lower()
            confidence = float(top_result["score"])
            
            return emotion_label, confidence
        except Exception:
            return "neutral", 0.5

    def detect_emotion_detailed(self, text: str) -> Dict:
        """
        Detect emotion with full details including all scores.
        Returns:
        {
            "emotion": predicted emotion label (one of 27 emotions),
            "confidence": float (0-1),
            "all_emotions": dict of all 27 emotions with their scores
        }
        """
        if not text.strip():
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "all_emotions": {}
            }

        try:
            results = self.model(text)[0]
            
            # Get highest scoring emotion
            top_result = max(results, key=lambda x: x["score"])
            
            emotion_label = top_result["label"].lower()
            confidence = float(top_result["score"])
            
            # Build dict of all emotions with scores
            all_emotions = {item["label"].lower(): round(float(item["score"]), 3) for item in results}
            
            return {
                "emotion": emotion_label,
                "confidence": round(confidence, 3),
                "all_emotions": all_emotions
            }
        except Exception:
            return {
                "emotion": "neutral",
                "confidence": 0.5,
                "all_emotions": {}
            }


emotion_service = EmotionService()
