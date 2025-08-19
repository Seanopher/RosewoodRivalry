# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
# Start the FastAPI server
cd backend
python -m uvicorn app.main:app --reload

# Start the React frontend (in separate terminal)
cd frontend
npm start

# Initialize the database (creates tables)
cd backend
python init_db.py
```

### Database Setup
- PostgreSQL database required
- Default connection: `postgresql+psycopg://postgres:7%40Chatham@localhost:5432/rosewoodrivalry`
- Override with `DATABASE_URL` environment variable
- Models use SQLAlchemy 2.0+ syntax

### Dependencies
```bash
# Install Python dependencies (from root directory)
pip install -r requirements.txt
```

### Process Management (Windows)
```bash
# Find processes using a specific port
netstat -ano | findstr :3000

# Kill process by PID (use double slashes for Windows)
taskkill //PID <process_id> //F

# Example: Kill process using port 3000
# First find PID: netstat -ano | findstr :3000
# Then kill: taskkill //PID <found_pid> //F
```

## Deployment

### Hosting Setup
- **Platform**: Render.com (free tier)
- **Backend**: Web Service with Docker
- **Frontend**: Static Site
- **Database**: Neon PostgreSQL (free tier)

### Deploy to Render
1. Connect GitHub repository to Render
2. Create PostgreSQL database on Neon.tech
3. Set environment variables in Render dashboard:
   - `DATABASE_URL`: Connection string from Neon
   - `REACT_APP_API_URL`: Backend service URL
4. Deploy using `render.yaml` configuration

### Files for Deployment
- `backend/Dockerfile`: Docker configuration for FastAPI
- `render.yaml`: Render service configuration
- Environment variables handled automatically

### Production URLs
- Backend API: `https://rosewood-rivalry-backend.onrender.com`
- Frontend: `https://rosewood-rivalry-frontend.onrender.com`
```

## Architecture Overview

### Die Game Tracking System
This is a web application for tracking "Die" games - typically played to any score with 3 players per team. The system tracks player statistics, game history, and team compositions dynamically.

### Backend Structure
- **FastAPI Application**: Main application in `backend/app/main.py`
- **Database Models**: `backend/app/models.py` (Player, Game, GameParticipation)
- **API Routers**: `backend/app/routers/` (players.py, games.py)
- **Schemas**: Pydantic models in `backend/app/schemas/schemas.py`
- **Database**: SQLAlchemy configuration in `backend/app/database.py`

### Key Database Design
- **Players**: Persistent entities with cached statistics (games_played, games_won, win_percentage, etc.)
- **Games**: Records game results with team1_score, team2_score, winner_team, played_at
- **GameParticipations**: Junction table tracking which players were on which team (team_number 1 or 2)
- **No persistent teams**: Teams are formed per-game by selecting 3 players each

### Player Statistics (Cached)
Player stats are automatically recalculated and cached whenever a game is recorded:
- games_played, games_won, win_percentage
- total_points_scored, total_points_against  
- avg_win_margin, avg_loss_margin

### API Endpoints
- `POST /players/` - Create new player
- `GET /players/` - List all players with stats
- `GET /players/{id}/stats` - Detailed player stats with recent games
- `POST /games/` - Create game (requires 3 players per team, auto-calculates winner)
- `GET /games/` - List recent games with team rosters
- `GET /games/{id}` - Get detailed game information

### Game Creation Rules
- Exactly 3 players per team (validated)
- Players cannot be on both teams
- Winner determined by higher score
- All player statistics automatically updated after game creation

### Current State  
- Backend fully functional with comprehensive Die game tracking
- Database schema optimized for player statistics and game history
- Frontend directory exists but empty - ready for React implementation
- API tested and working with player/game creation and statistics