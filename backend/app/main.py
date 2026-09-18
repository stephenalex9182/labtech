import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.database import Base, engine
import app.models
from app.api import auth, reports, dashboard, notifications, activity, analytics, clinical

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("labtriage")

app = FastAPI(title="LabTriage AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # For a hackathon prototype we create tables directly; use Alembic migrations in production.
    Base.metadata.create_all(bind=engine)
    from sqlalchemy import text
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN file_path VARCHAR"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN unique_id VARCHAR(6)"))
        except Exception:
            pass
    try:
        from app.seed import run as seed_run
        seed_run()
    except Exception as e:
        logger.warning("Auto-seed error: %s", e)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak raw stack traces to the UI.
    logger.exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})


app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(activity.router)
app.include_router(analytics.router)
app.include_router(clinical.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
