# Pneuma: Project Workflow Architecture

This document breaks down the end-to-end user journey and internal data flow of the Pneuma Mental Wellness Application.

## 1. Authentication & Onboarding
Users begin by registering or logging in via the glassmorphic Auth screen. Authentication generates secure token pairings in the backend database allowing the frontend to make authenticated requests to private APIs on behalf of the user.

## 2. The Chat Experience
The primary conversational interface involves a cycle of emotion detection and contextual AI response.

1. **Input:** The user types a message or clicks a "Suggested Reply" pill in the Chat.
2. **Safety Check:** The backend router first screens the incoming text for crisis keywords (self-harm, suicide). If detected, it immediately short-circuits the LLM and returns emergency resources.
3. **Emotion Classification:** The message is passed through an open-source Hugging Face Transformers model (`j-hartmann/emotion-english-distilroberta-base`) to accurately tag the user's current emotional state.
4. **Context Retrieval:** The `memory.py` service retrieves the last 10 messages along with their vector embeddings from the database to ensure conversational continuity.
5. **AI Generation:** The context, current message, and detected emotion are bundled via LangChain into a strict prompt and sent to the Groq API (LLaMA inference).
6. **Delivery:** The empathetic response is rendered on the frontend using dynamic theme-aware chat bubbles.

## 3. Deep Reflection (Journaling)
The Journal provides a place for long-form private reflection.

1. **Submission:** A user writes an entry and submits the form.
2. **Tri-fold Analysis:** The backend LLM is prompted differently than chat. It structurally dissects the journal entry into three keys:
   - *Summary*: What the user wrote.
   - *Insight*: The underlying psychological patterns.
   - *Suggestion*: Actionable, realistic advice.
3. **Storage:** The overarching emotion extracted from the entry is sent to the centralized `mood_logs` table to impact analytics.

## 4. Emotional Analytics (Dashboard)
Every valid interaction (chat or journal) deposits emotional metadata into the user's timeline.

1. **Aggregation:** The `/mood` API gathers all logs for the authenticated user.
2. **Visualization:** 
   - A **7-Day Mood Tracker** visualizes short-term trajectory using color-coded severity blocks.
   - **Line & Pie Charts** (powered by Recharts) visualize emotional distributions and long-term mood scores.
3. **Weekly Insight:** Groq computes a generalized assessment of the user's emotional data for the week to give concluding advice.

## 5. UI/UX Theming System
The entire application relies on a React context + CSS variable bridge. 
By selecting a theme from the navigation drop-down (Midnight Gold, Ocean Glow, Sunset Aura, Aurora Neon), the root `data-theme` is injected into the DOM, instantly dynamically rewriting all background gradients, chart colors, box shadows, and text colors without full page reloads.
