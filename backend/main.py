import logging
from dotenv import load_dotenv

# Load .env FIRST before any other imports
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from models.db_models import User
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.journal import router as journal_router
from routes.mood import router as mood_router
from services.llm_chain import llm_chain_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pneuma")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(journal_router)
app.include_router(mood_router)


@app.get("/")
async def healthcheck():
    return {"status": "ok", "app": "Pneuma"}


@app.on_event("startup")
def startup_checks() -> None:
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting up Pneuma application...")
    logger.info(f"✓ LLM Service: {type(llm_chain_service.llm)}")
    logger.info(f"✓ LLM is initialized: {llm_chain_service.llm is not None}")
    if llm_chain_service.llm is None:
        logger.error("⚠️  WARNING: LLM is not initialized! Check your Groq API key in .env")
    
    # Seed default user
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "demo@safeai.local").first()
        if not existing:
            db.add(User(email="demo@safeai.local", password="demo"))
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def seed_default_user() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "demo@safeai.local").first()
        if not existing:
            db.add(User(email="demo@safeai.local", password="demo"))
            db.commit()
    finally:
        db.close()
