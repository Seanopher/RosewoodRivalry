# Rosewood Rivalry

A full-stack sports tracking app built for University of South Carolina students to record and analyze competitive game results across multiple sports!

## Available sports:
- **Dice** — 3v3
- **Golf** — 2v2

## Features

- **Game Tracking** — Log dice game and golf match results with scores, teams, and locations
- **Golf Rounds** — Record match play golf rounds hole-by-hole with real course data via GolfCourseAPI
- **Player Stats** — Win rates, margins, scoring trends, and season breakdowns per player
- **Team Stats** — Track team combinations and their performance over time
- **Rivalry** — Head-to-head stats on The Rivalry! The Orchard vs Dreher Street
- **Leaderboards** — Season and all-time win rate rankings with participation thresholds
- **Season Filtering** — View stats filtered by year or across all time

## Tech Stack

- **Frontend** — React, TypeScript, Tailwind CSS
- **Backend** — FastAPI, SQLAlchemy, PostgreSQL
- **Deployment** — Render (backend + static frontend), NeonDB

## Project Structure

```
├── frontend/        # React/TypeScript app
├── backend/         # FastAPI app
│   ├── app/
│   │   ├── routers/ # API route handlers
│   │   ├── models.py
│   │   ├── schemas/
│   │   └── services/
└── render.yaml      # Render deployment config
```
