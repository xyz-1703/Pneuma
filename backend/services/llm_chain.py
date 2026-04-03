import json
import logging
import os
from typing import Dict, List
from datetime import datetime

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain.tools import Tool

from services.prompt_builder import (
    BASE_SYSTEM_RULES,
    build_chat_prompt_template,
    build_journal_prompt_template,
    build_reflective_prompt_template,
    get_emotion_tone,
    get_current_datetime_context,
)

logger = logging.getLogger(__name__)


def get_current_date() -> str:
    """Get the current date in a human-readable format."""
    return datetime.now().strftime("%A, %B %d, %Y")


def get_current_time() -> str:
    """Get the current time in HH:MM:SS format."""
    return datetime.now().strftime("%H:%M:%S")


def get_current_datetime() -> str:
    """Get the current date and time in full format."""
    return datetime.now().strftime("%A, %B %d, %Y at %H:%M:%S")


# Define tools for the agent
TOOLS = [
    Tool(
        name="get_current_date",
        func=get_current_date,
        description="Get today's date in a human-readable format (e.g., 'Monday, April 02, 2026')"
    ),
    Tool(
        name="get_current_time",
        func=get_current_time,
        description="Get the current time in HH:MM:SS format (e.g., '14:30:45')"
    ),
    Tool(
        name="get_current_datetime",
        func=get_current_datetime,
        description="Get the current date and time in full format (e.g., 'Monday, April 02, 2026 at 14:30:45')"
    ),
]


class LangChainGroqService:
    def __init__(self) -> None:
        api_key = os.getenv("GROQ_API_KEY", "")
        try:
            self.llm = (
                ChatGroq(
                    groq_api_key=api_key,
                    model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
                    temperature=0.6,
                    max_tokens=220,
                )
                if api_key
                else None
            )
            logger.info(f"LLM initialized successfully: {type(self.llm)}")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}", exc_info=True)
            self.llm = None
        
        # Define tools for date/time access
        self.tools = TOOLS
        logger.info("Date/time tools initialized and available to prompts")
        
        self.chat_prompt = build_chat_prompt_template()
        self.journal_prompt = build_journal_prompt_template()
        self.reflective_prompt = build_reflective_prompt_template()
        self.intent_prompt = PromptTemplate(
            input_variables=["history", "user_message"],
            template=(
                "You are a strict intent classifier for a mental wellness chat app.\n"
                "Choose exactly one label from this set:\n"
                "greeting, casual_talk, venting, seeking_advice, emotional_support\n\n"
                "Conversation history:\n{history}\n\n"
                "Current user message:\n{user_message}\n\n"
                "Return ONLY the label, no punctuation, no extra words."
            ),
        )

    @staticmethod
    def _limit_words(text: str, max_words: int = 100) -> str:
        words = text.split()
        return text if len(words) <= max_words else " ".join(words[:max_words])

    async def classify_intent(self, user_message: str, history_text: str) -> str:
        allowed: List[str] = [
            "greeting",
            "casual_talk",
            "venting",
            "seeking_advice",
            "emotional_support",
        ]

        if self.llm is None:
            return self._fallback_intent(user_message)

        try:
            chain = LLMChain(llm=self.llm, prompt=self.intent_prompt)
            raw = await chain.apredict(history=history_text, user_message=user_message)
            label = raw.strip().lower().replace(" ", "_")
            if label in allowed:
                return label
        except Exception:
            logger.exception("Intent classification failed; using fallback.")

        return self._fallback_intent(user_message)

    async def run_reflective_chain(self, user_message: str) -> str:
        """Handle philosophical/reflective questions about the bot."""
        if self.llm is None:
            return "I don't experience emotions like you do, but I'm here for you! 😊"

        try:
            chain = LLMChain(llm=self.llm, prompt=self.reflective_prompt)
            response = await chain.apredict(user_message=user_message)
            return self._limit_words(response.strip(), 50)
        except Exception:
            logger.exception("Reflective chain failed; using fallback.")
            return "I don't experience emotions like you do, but I'm here for you! 😊"

    async def run_chat_chain(
        self,
        user_message: str,
        emotion: str,
        emotion_confidence: float,
        intent: str,
        patterns: List[str],
        tone: str,
        history_text: str,
    ) -> str:
        if self.llm is None:
            logger.warning("LLM is None - returning fallback response")
            return "I am here with you. Share a little more, and we can take this one step at a time."

        logger.info(f"=== CHAT CHAIN DEBUG ===")
        logger.info(f"User Message: {user_message[:100]}")
        logger.info(f"Emotion: {emotion}")
        logger.info(f"History Text: {history_text[:200]}")
        
        chain = LLMChain(llm=self.llm, prompt=self.chat_prompt)
        logger.info(f"Prompt Template: {self.chat_prompt.template[:200]}")
        logger.info(f"Prompt Input Variables: {self.chat_prompt.input_variables}")
        
        response = await chain.apredict(
            system_rules=BASE_SYSTEM_RULES,
            datetime_context=get_current_datetime_context(),
            emotion=emotion,
            emotion_confidence=round(emotion_confidence, 3),
            intent=intent,
            patterns=", ".join(patterns) if patterns else "none",
            tone=tone,
            history=history_text,
            user_message=user_message,
        )
        logger.info(f"Raw LLM Response: {response[:200]}")
        result = self._limit_words(response.strip(), 100)
        logger.info(f"Final Response: {result[:200]}")
        logger.info(f"=== END CHAT CHAIN DEBUG ===")
        return result

    async def run_journal_chain(self, text: str, emotion: str) -> Dict[str, str]:
        fallback = {
            "summary": "You had an emotionally meaningful day with mixed feelings.",
            "insight": "Your entry suggests a need for self-kindness and emotional balance.",
            "suggestion": "Try a short grounding routine and one gentle action for yourself today.",
        }

        if self.llm is None:
            return fallback

        chain = LLMChain(llm=self.llm, prompt=self.journal_prompt)
        raw = await chain.apredict(
            system_rules=BASE_SYSTEM_RULES,
            emotion=emotion,
            tone=get_emotion_tone(emotion),
            text=text,
        )

        try:
            parsed = json.loads(raw)
            return {
                "summary": str(parsed.get("summary", fallback["summary"]))[:250],
                "insight": str(parsed.get("insight", fallback["insight"]))[:450],
                "suggestion": str(parsed.get("suggestion", fallback["suggestion"]))[:450],
            }
        except Exception:
            return fallback

    @staticmethod
    def _fallback_intent(user_message: str) -> str:
        lowered = user_message.lower()

        if any(word in lowered for word in ["hello", "hi", "hey", "good morning", "good evening"]):
            return "greeting"
        if any(word in lowered for word in ["what should i do", "advice", "suggest", "help me decide"]):
            return "seeking_advice"
        if any(word in lowered for word in ["i feel", "overwhelmed", "can't handle", "hopeless", "lonely"]):
            return "emotional_support"
        if any(word in lowered for word in ["always", "never", "fed up", "tired of", "annoyed", "angry"]):
            return "venting"
        return "casual_talk"


llm_chain_service = LangChainGroqService()
