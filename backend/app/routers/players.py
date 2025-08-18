from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.schemas.schemas import PlayerCreate, PlayerOut, PlayerStats
from app.models import Player, Game, GameParticipation
from app.database import get_db

router = APIRouter(prefix="/players", tags=["players"])

@router.post("/", response_model=PlayerOut)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    # Check if player with this name already exists
    existing_player = db.query(Player).filter(Player.name == player.name).first()
    if existing_player:
        raise HTTPException(status_code=400, detail="Player with this name already exists")
    
    db_player = Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.get("/", response_model=List[PlayerOut])
def list_players(db: Session = Depends(get_db)):
    players = db.query(Player).all()
    return players

@router.get("/{player_id}", response_model=PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.get("/{player_id}/stats", response_model=PlayerStats)
def get_player_stats(player_id: int, limit: int = 10, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get recent games for this player
    recent_games = (
        db.query(Game)
        .join(GameParticipation)
        .filter(GameParticipation.player_id == player_id)
        .order_by(Game.played_at.desc())
        .limit(limit)
        .all()
    )
    
    # Convert to GameSummary format
    from app.schemas.schemas import GameSummary
    game_summaries = []
    for game in recent_games:
        team1_players = db.query(Player).join(GameParticipation).filter(
            GameParticipation.game_id == game.id,
            GameParticipation.team_number == 1
        ).all()
        team2_players = db.query(Player).join(GameParticipation).filter(
            GameParticipation.game_id == game.id,
            GameParticipation.team_number == 2
        ).all()
        
        game_summaries.append(GameSummary(
            id=game.id,
            team1_score=game.team1_score,
            team2_score=game.team2_score,
            winner_team=game.winner_team,
            played_at=game.played_at,
            team1_player_names=[p.name for p in team1_players],
            team2_player_names=[p.name for p in team2_players]
        ))
    
    return PlayerStats(
        id=player.id,
        name=player.name,
        games_played=player.games_played,
        games_won=player.games_won,
        win_percentage=player.win_percentage,
        avg_win_margin=player.avg_win_margin,
        avg_loss_margin=player.avg_loss_margin,
        total_points_scored=player.total_points_scored,
        total_points_against=player.total_points_against,
        recent_games=game_summaries
    )
