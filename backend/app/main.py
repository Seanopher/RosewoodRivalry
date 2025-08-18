from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, games

app = FastAPI(title="Rosewood Rivalry API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(players.router)
app.include_router(games.router)
# Teams router removed - teams are created per-game now
