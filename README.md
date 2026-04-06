# Pneuma: Safe AI Emotional Chat and Journal Platform

A full-stack mental wellness application with emotion-aware AI chat, journaling insights, mood analytics, and a premium glassmorphic UI.

## Pneuma Architecture & Workflow

This breaks down the end-to-end user journey and internal features of the Pneuma Mental Wellness Application.

### 1. Authentication & Onboarding
Users begin by registering or logging in via the glassmorphic Auth screen. Authentication generates secure token pairings in the backend database allowing the frontend to make authenticated requests to private APIs on behalf of the user.

### 2. The Chat Experience
The primary conversational interface involves a cycle of emotion detection and contextual AI response.
1. **Input:** The user types a message in the Chat.
2. **Safety Check & Crisis Protocols:** The backend router first screens the incoming text for crisis keywords (self-harm, suicide). If detected, it immediately short-circuits the LLM and returns emergency resources. Additionally, there is an immediate visual "Crisis Help" integration linking to primary Indian mental health helplines alongside emergency protocol triggers.
3. **Emotion Classification:** The message is passed through an open-source Hugging Face Transformers model (`j-hartmann/emotion-english-distilroberta-base`) to accurately tag the user's current emotional state.
4. **Context Retrieval:** The `memory.py` service retrieves the last 10 messages along with their vector embeddings from the database to ensure conversational continuity.
5. **AI Generation:** The context, current message, and detected emotion are bundled via LangChain into a strict prompt and sent to the Groq API (LLaMA inference).
6. **Delivery:** The empathetic response is rendered on the frontend using dynamic theme-aware chat bubbles.

### 3. Deep Reflection (Journaling)
The Journal provides a place for long-form private reflection.
1. **Submission:** A user writes an entry and submits the form.
2. **Tri-fold Analysis:** The backend LLM is prompted differently than chat. It structurally dissects the journal entry into three keys:
   - *Summary*: What the user wrote.
   - *Insight*: The underlying psychological patterns.
   - *Suggestion*: Actionable, realistic advice.
3. **Storage:** The overarching emotion extracted from the entry is sent to the centralized `mood_logs` table to impact analytics.

### 4. Emotional Analytics (Dashboard)
Every valid interaction (chat or journal) deposits emotional metadata into the user's timeline.
1. **Aggregation:** The `/mood` API gathers all logs for the authenticated user.
2. **Visualization:** 
   - A **7-Day Mood Tracker** visualizes short-term trajectory using color-coded severity blocks.
   - **Line & Pie Charts** (powered by Recharts) visualize emotional distributions and long-term mood scores.
3. **Weekly Insight:** Groq computes a generalized assessment of the user's emotional data for the week to give concluding advice.

### 5. UI/UX Theming System
- **Four Premium UI Themes**: Instantly switchable color modes (Midnight Gold, Ocean Glow, Sunset Aura, Aurora Neon).
- The entire application relies on a React context + CSS variable bridge. By selecting a theme, the root `data-theme` is injected into the DOM, instantly dynamically rewriting all background gradients, chart colors, box shadows, and text colors without full page reloads.

## Backend Setup

1. Create and activate a virtual environment from the project root:

```bash
python -m venv venv
venv\Scripts\activate
```

2. Open terminal in backend directory.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

This installs FastAPI, Uvicorn, SQLAlchemy, psycopg2, Transformers, Torch, LangChain, LangChain Community, LangChain Groq, and Groq SDK.

4. Copy environment file and add your Groq key:

```bash
copy .env.example .env
```

5. Start backend server:

```bash
uvicorn main:app --reload --port 8000
```

Backend runs on http://127.0.0.1:8000.

## Frontend Setup

1. Open terminal in frontend directory.
2. Install dependencies:

```bash
npm install
```

This installs React (Vite), axios, tailwindcss, and recharts.

3. Copy environment file:

```bash
copy .env.example .env
```

4. Start frontend:

```bash
npm run dev
```

Frontend runs on http://127.0.0.1:5173.

## API Endpoints

- POST /chat
  - Input: { user_id, message }
  - Output: { response, emotion, assistant_emotion }
- GET /chat/history?user_id=1
  - Output: list of stored chat messages
- POST /journal
  - Input: { user_id, text }
  - Output: { emotion, summary, insight, suggestion }
- GET /mood?user_id=1
  - Output: timeline, distribution, weekly_summary

## Notes

- If GROQ_API_KEY is missing, fallback supportive responses are used.
- SQLite file is created automatically when the backend starts.
- To use PostgreSQL, set DATABASE_URL, for example:

```text
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/safe_ai
```
