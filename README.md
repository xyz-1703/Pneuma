# Pneuma: Safe AI Emotional Chat and Journal Platform

A full-stack mental wellness application with emotion-aware AI chat, journaling insights, mood analytics, and a premium glassmorphic UI.

> **Read the detailed technical workflow and data flow of this project in [PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md)**

## Stack

- Frontend: React (Vite), Tailwind CSS, Recharts (with Custom Glassmorphism & Theme Engine)
- Backend: FastAPI
- AI/ML: Hugging Face Transformers (emotion detection), LangChain + Groq API (LLM responses)
- Database: SQLite by default (switchable to PostgreSQL)

## Project Structure

- backend/
  - main.py
  - database.py
  - models/db_models.py
  - routes/chat.py
  - routes/journal.py
  - routes/mood.py
  - services/emotion.py
  - services/prompt_builder.py
  - services/llm_chain.py
  - services/memory.py
- frontend/
  - src/pages/Chat.jsx
  - src/pages/Journal.jsx
  - src/pages/Dashboard.jsx
  - src/components/ChatBubble.jsx
  - src/components/MessageInput.jsx
  - src/components/JournalForm.jsx
  - src/components/MoodChart.jsx

## Features

- **Four Premium UI Themes**: Instantly switchable color modes (Midnight Gold, Ocean Glow, Sunset Aura, Aurora Neon).
- **Emotion-Aware Chat**: Pneuma contextually remembers the last 10 messages and tailors its responses based on the AI-detected core emotion.
- **Journal Analysis**: Deep reflection AI-generated summary, insight, and actionable suggestions.
- **Advanced Dashboard**: Features a 7-day mood severity tracker, distribution pie chart, timeline, and weekly AI insights.
- **Crisis Protocols**: 
  - Immediate visual "Crisis Help" integration linking to primary Indian mental health helplines alongside emergency protocol triggers.
  - LLM Safety algorithmic override for dangerous language.

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
