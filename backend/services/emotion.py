from typing import Tuple, Dict, List, Optional

from transformers import pipeline

# Load model once (important for performance)
classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True,
)

# Map 27 HuggingFace emotions to 5 core emotions
EMOTION_MAPPING = {
    # Positive → happy
    "joy": "happy",
    "love": "happy",
    "gratitude": "happy",
    "admiration": "happy",
    "approval": "happy",
    "excitement": "happy",
    "amusement": "happy",
    "optimism": "happy",
    "pride": "happy",
    "relief": "happy",
    "caring": "happy",
    "enthusiasm": "happy",
    "helpfulness": "happy",
    
    # Negative → sad/angry
    "sadness": "sad",
    "disappointment": "sad",
    "grief": "sad",
    "remorse": "sad",
    
    "anger": "angry",
    "annoyance": "angry",
    "disapproval": "angry",
    "disgust": "angry",
    
    # Anxious
    "fear": "anxious",
    "nervousness": "anxious",
    
    # Neutral/other
    "embarrassment": "neutral",
    "shame": "neutral",
    "guilt": "neutral",
    "confusion": "neutral",
    "surprise": "neutral",
    "realization": "neutral",
    "amazement": "neutral",
    "curiosity": "neutral",
    "tease": "neutral",
    "improvement": "neutral",
    "hope": "neutral",
    "neutral": "neutral",
}

SHORT_MSG_THRESHOLD = 3  # words
CONFIDENCE_THRESHOLD = 0.55


class EmotionService:
    def __init__(self) -> None:
        self.model = classifier

    def _build_context_window(self, current_msg: str, history: Optional[List[Dict]] = None) -> str:
        """
        Build a sliding context window from recent messages for better emotion detection.
        For short messages, uses the last 2-3 messages for context.
        """
        word_count = len(current_msg.strip().split())
        
        # If message is long enough, use it alone
        if word_count > SHORT_MSG_THRESHOLD:
            return current_msg
        
        # For short messages, build context from history
        context_parts = []
        if history:
            # Get last 2 user messages for context
            user_messages = [m.get("message", "") for m in history if m.get("role") == "user"]
            context_parts.extend(user_messages[-2:])
        
        context_parts.append(current_msg)
        return " ".join(filter(None, context_parts))

    def _map_emotion(self, raw_label: str) -> str:
        """Map 27 HuggingFace emotions to 5 core emotions."""
        return EMOTION_MAPPING.get(raw_label.lower(), "neutral")

    def detect_emotion(self, text: str, history: Optional[List[Dict]] = None, 
                      prev_emotion: Optional[str] = None) -> Tuple[str, float]:
        """
        Detect emotion from text with context awareness.
        
        Args:
            text: Current message
            history: Previous messages for context window
            prev_emotion: Previous detected emotion (for confidence threshold fallback)
        
        Returns: (emotion, confidence)
        """
        if not text.strip():
            return prev_emotion or "neutral", 0.5

        try:
            # Build context window for better detection on short messages
            context_text = self._build_context_window(text, history)
            
            results = self.model(context_text)[0]
            top_result = max(results, key=lambda x: x["score"])

            raw_emotion = top_result["label"].lower()
            confidence = float(top_result["score"])
            
            # Map to core emotion
            mapped_emotion = self._map_emotion(raw_emotion)
            
            # Confidence threshold: if below 55% and we have previous emotion, inherit it
            if confidence < CONFIDENCE_THRESHOLD and prev_emotion and prev_emotion != "neutral":
                return prev_emotion, confidence
            
            return mapped_emotion, confidence
        except Exception:
            return prev_emotion or "neutral", 0.5

    def detect_emotion_detailed(self, text: str, history: Optional[List[Dict]] = None,
                               prev_emotion: Optional[str] = None) -> Dict:
        """
        Detect emotion with full details including all scores and mapping.
        """
        if not text.strip():
            return {
                "emotion": prev_emotion or "neutral",
                "confidence": 0.5,
                "all_emotions": {},
                "raw_emotion": "neutral",
                "confidence_threshold_applied": False,
            }

        try:
            # Build context window for better detection on short messages
            context_text = self._build_context_window(text, history)
            
            results = self.model(context_text)[0]
            top_result = max(results, key=lambda x: x["score"])

            raw_emotion = top_result["label"].lower()
            confidence = float(top_result["score"])
            
            # Map to core emotion
            mapped_emotion = self._map_emotion(raw_emotion)
            
            # Check if confidence threshold applies
            confidence_threshold_applied = False
            if confidence < CONFIDENCE_THRESHOLD and prev_emotion and prev_emotion != "neutral":
                mapped_emotion = prev_emotion
                confidence_threshold_applied = True

            # Build dict of all emotions with scores
            all_emotions = {
                self._map_emotion(item["label"].lower()): round(float(item["score"]), 3)
                for item in results
            }

            return {
                "emotion": mapped_emotion,
                "confidence": round(confidence, 3),
                "raw_emotion": raw_emotion,
                "confidence_threshold_applied": confidence_threshold_applied,
                "all_emotions": all_emotions
            }
        except Exception:
            return {
                "emotion": prev_emotion or "neutral",
                "confidence": 0.5,
                "all_emotions": {},
                "raw_emotion": "neutral",
                "confidence_threshold_applied": False,
            }


emotion_service = EmotionService()
