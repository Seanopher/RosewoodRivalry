from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.schemas import TeamOut, TeamStats, GameSummary, TeamsListResponse
from app.models import Team, Game, GameParticipation, Player
from app.database import get_db
from app.services.team_service import rebuild_all_teams
from sqlalchemy import and_

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/", response_model=TeamsListResponse)
def list_teams(db: Session = Depends(get_db)):
    """Get all teams with at least 10% of total games played"""
    # Calculate total number of games
    total_games = db.query(Game).count()
    
    # Calculate minimum games required (10% of total, rounded up)
    import math
    min_games_required = max(3, math.ceil(total_games * 0.1))  # Minimum 3 games
    
    teams = db.query(Team).filter(Team.games_played >= min_games_required).order_by(
        Team.win_percentage.desc(),
        Team.games_played.desc(), 
        (Team.total_points_scored - Team.total_points_against).desc()
    ).all()
    
    return TeamsListResponse(
        teams=teams,
        total_games=total_games,
        min_games_required=min_games_required,
        threshold_percentage=10.0
    )


@router.get("/rebuild")
def rebuild_teams(db: Session = Depends(get_db)):
    """Rebuild all team statistics from existing games"""
    created_teams = rebuild_all_teams(db)
    return {
        "message": f"Rebuilt {len(created_teams)} teams from existing games",
        "teams_created": len(created_teams)
    }


@router.get("/{team_id}", response_model=TeamStats)
def get_team_stats(team_id: int, db: Session = Depends(get_db)):
    """Get detailed statistics for a specific team"""
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get recent games for this team
    # Find games where all 3 players from this team played on the same side
    player_ids = [team.player1_id, team.player2_id, team.player3_id]
    
    # Get all games where these 3 players participated
    games_with_team = db.query(Game).join(GameParticipation).filter(
        GameParticipation.player_id.in_(player_ids)
    ).distinct().order_by(Game.played_at.desc()).limit(10).all()
    
    # Filter to games where all 3 played on same team
    recent_games = []
    for game in games_with_team:
        # Get participations for this game
        participations = db.query(GameParticipation).filter(
            and_(
                GameParticipation.game_id == game.id,
                GameParticipation.player_id.in_(player_ids)
            )
        ).all()
        
        if len(participations) == 3:
            # Check if all have same team_number
            team_numbers = [p.team_number for p in participations]
            if len(set(team_numbers)) == 1:  # All same team number
                # Get team player names
                team1_players = db.query(Player).join(GameParticipation).filter(
                    GameParticipation.game_id == game.id,
                    GameParticipation.team_number == 1
                ).all()
                team2_players = db.query(Player).join(GameParticipation).filter(
                    GameParticipation.game_id == game.id,
                    GameParticipation.team_number == 2
                ).all()
                
                recent_games.append(GameSummary(
                    id=game.id,
                    team1_score=game.team1_score,
                    team2_score=game.team2_score,
                    winner_team=game.winner_team,
                    location=game.location,
                    played_at=game.played_at,
                    team1_player_names=[p.name for p in team1_players],
                    team2_player_names=[p.name for p in team2_players]
                ))
    
    # Get player objects
    players = [team.player1, team.player2, team.player3]
    
    return TeamStats(
        id=team.id,
        team_name=team.team_name,
        games_played=team.games_played,
        games_won=team.games_won,
        win_percentage=team.win_percentage,
        avg_win_margin=team.avg_win_margin,
        avg_loss_margin=team.avg_loss_margin,
        total_points_scored=team.total_points_scored,
        total_points_against=team.total_points_against,
        players=players,
        recent_games=recent_games[:5]  # Limit to 5 most recent
    )