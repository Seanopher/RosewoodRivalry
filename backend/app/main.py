import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, games, teams, rivalry
from app.database import engine, Base
from app import models

# Create database tables
Base.metadata.create_all(bind=engine)

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
