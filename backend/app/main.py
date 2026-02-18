import os
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, games, teams, rivalry, golf
from app.database import engine, Base
from app import models

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
    allow_origins=["*"],  # Temporarily allow all origins for testing
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
