import os
import logging
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import players, games, teams, rivalry, golf
from app.database import engine, Base
from app import models

logger = logging.getLogger("rosewood")

# Create database tables (creates new tables, but won't add columns to existing ones)
Base.metadata.create_all(bind=engine)

# Migration helper: add new golf columns to existing players table
# Uses try/except per column to skip columns that already exist (avoids inspect() which can hang on Neon)
def _run_migrations():
    golf_columns = {
        'golf_rounds_played': "INTEGER DEFAULT 0",
        'golf_rounds_won': "INTEGER DEFAULT 0",
        'golf_rounds_lost': "INTEGER DEFAULT 0",
        'golf_rounds_drawn': "INTEGER DEFAULT 0",
        'golf_holes_won': "INTEGER DEFAULT 0",
        'golf_holes_lost': "INTEGER DEFAULT 0",
        'golf_win_percentage': "FLOAT DEFAULT 0.0",
    }
    # New columns for golf course integration
    golf_round_columns = {
        'course_id': "INTEGER REFERENCES golf_courses(id)",
        'tee_id': "INTEGER REFERENCES golf_course_tees(id)",
    }
    golf_hole_result_columns = {
        'par': "INTEGER",
        'yardage': "INTEGER",
    }
    with engine.connect() as conn:
        for col_name, col_type in golf_columns.items():
            try:
                conn.execute(text(f"ALTER TABLE players ADD COLUMN {col_name} {col_type}"))
            except Exception:
                conn.rollback()
                continue
        for col_name, col_type in golf_round_columns.items():
            try:
                conn.execute(text(f"ALTER TABLE golf_rounds ADD COLUMN {col_name} {col_type}"))
            except Exception:
                conn.rollback()
                continue
        for col_name, col_type in golf_hole_result_columns.items():
            try:
                conn.execute(text(f"ALTER TABLE golf_hole_results ADD COLUMN {col_name} {col_type}"))
            except Exception:
                conn.rollback()
                continue
        conn.commit()

try:
    _run_migrations()
except Exception as e:
    print(f"Migration warning (non-fatal): {e}")

app = FastAPI(title="Rosewood Rivalry API")


@app.exception_handler(OperationalError)
async def db_operational_error_handler(request: Request, exc: OperationalError):
    logger.error("[DB_CONNECTION_ERROR] %s %s — %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=503, content={"detail": "Database unavailable. Please try again."})


@app.exception_handler(SQLAlchemyError)
async def db_generic_error_handler(request: Request, exc: SQLAlchemyError):
    logger.error("[DB_ERROR] %s %s — %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=503, content={"detail": "Database error. Please try again."})


# CORS origins based on environment
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL if in production
if os.getenv("RENDER"):
    origins.extend([
        "https://rosewood-rivalry-frontend.onrender.com",
        "https://rosewood-rivalry.onrender.com"
    ])

# Also check for any .onrender.com domain (more flexible)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(players.router)
app.include_router(games.router)
app.include_router(teams.router)  # Teams API for team statistics
app.include_router(rivalry.router)  # Rivalry API for Orchard vs Dreher
app.include_router(golf.router)  # Golf match play tracking
