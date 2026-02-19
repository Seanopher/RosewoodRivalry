from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, extract
from typing import List, Optional
from app.schemas.schemas import TeamOut, TeamStats, GameSummary, TeamsListResponse
from app.models import Team, Game, GameParticipation, Player
from app.database import get_db
from app.services.team_service import rebuild_all_teams
import math

router = APIRouter(prefix="/teams", tags=["teams"])


def _get_team_games(team: Team, db: Session, season: Optional[str] = None):
    """Return games where all 3 team players played on the same side, optionally by season."""
    player_ids = [team.player1_id, team.player2_id, team.player3_id]

    games_query = db.query(Game).join(GameParticipation).filter(
        GameParticipation.player_id.in_(player_ids)
    ).distinct()

    if season and season != 'all':
        games_query = games_query.filter(extract('year', Game.played_at) == int(season))

    games = games_query.order_by(Game.played_at.desc()).all()

    valid_games = []
    for game in games:
        participations = db.query(GameParticipation).filter(
            and_(
                GameParticipation.game_id == game.id,
                GameParticipation.player_id.in_(player_ids),
            )
        ).all()
        if len(participations) == 3:
            team_numbers = [p.team_number for p in participations]
            if len(set(team_numbers)) == 1:
                valid_games.append((game, team_numbers[0]))

    return valid_games


def _compute_team_season_stats(team: Team, db: Session, season: Optional[str] = None) -> dict:
    """Compute team stats dynamically for a given season."""
    valid_games = _get_team_games(team, db, season)

    games_played = 0
    games_won = 0
    total_scored = 0
    total_against = 0
    win_margins: list = []
    loss_margins: list = []

    for game, team_number in valid_games:
        games_played += 1
        t_score = game.team1_score if team_number == 1 else game.team2_score
        o_score = game.team2_score if team_number == 1 else game.team1_score
        total_scored += t_score
        total_against += o_score
        if game.winner_team == team_number:
            games_won += 1
            win_margins.append(t_score - o_score)
        else:
            loss_margins.append(o_score - t_score)

    return {
        'games_played': games_played,
        'games_won': games_won,
        'win_percentage': (games_won / games_played * 100) if games_played > 0 else 0.0,
        'avg_win_margin': sum(win_margins) / len(win_margins) if win_margins else 0.0,
        'avg_loss_margin': sum(loss_margins) / len(loss_margins) if loss_margins else 0.0,
        'total_points_scored': total_scored,
        'total_points_against': total_against,
    }


@router.get("/", response_model=TeamsListResponse)
def list_teams(
    season: Optional[str] = Query(None, description="Filter by season year (e.g. '2025', '2026') or 'all'"),
    db: Session = Depends(get_db),
):
    """Get teams, optionally filtered by season."""
    all_teams = db.query(Team).all()
    total_games = db.query(Game).count()

    if season and season != 'all':
        # Dynamic season stats — show teams with >= 1 game in this season, no threshold
        season_teams = []
        for team in all_teams:
            stats = _compute_team_season_stats(team, db, season)
            if stats['games_played'] == 0:
                continue

            season_teams.append(TeamOut(
                id=team.id,
                player1_id=team.player1_id,
                player2_id=team.player2_id,
                player3_id=team.player3_id,
                team_name=team.team_name,
                created_at=team.created_at,
                games_played=stats['games_played'],
                games_won=stats['games_won'],
                total_points_scored=stats['total_points_scored'],
                total_points_against=stats['total_points_against'],
                win_percentage=stats['win_percentage'],
                avg_loss_margin=stats['avg_loss_margin'],
                avg_win_margin=stats['avg_win_margin'],
                player1=team.player1,
                player2=team.player2,
                player3=team.player3,
            ))

        season_teams.sort(key=lambda t: (-t.win_percentage, -t.games_played))

        return TeamsListResponse(
            teams=season_teams,
            total_games=total_games,
            min_games_required=1,
            threshold_percentage=0.0,
        )
    else:
        # All-time: use cached values + threshold filter
        min_games_required = max(3, math.ceil(total_games * 0.1))
        teams = db.query(Team).filter(Team.games_played >= min_games_required).order_by(
            Team.win_percentage.desc(),
            Team.games_played.desc(),
            (Team.total_points_scored - Team.total_points_against).desc()
        ).all()

        return TeamsListResponse(
            teams=teams,
            total_games=total_games,
            min_games_required=min_games_required,
            threshold_percentage=10.0,
        )


@router.get("/rebuild")
def rebuild_teams(db: Session = Depends(get_db)):
    """Rebuild all team statistics from existing games."""
    created_teams = rebuild_all_teams(db)
    return {
        "message": f"Rebuilt {len(created_teams)} teams from existing games",
        "teams_created": len(created_teams),
    }


@router.get("/{team_id}", response_model=TeamStats)
def get_team_stats(
    team_id: int,
    season: Optional[str] = Query(None, description="Filter by season year (e.g. '2025', '2026') or 'all'"),
    db: Session = Depends(get_db),
):
    """Get detailed statistics for a specific team, optionally filtered by season."""
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if season and season != 'all':
        stats = _compute_team_season_stats(team, db, season)
    else:
        stats = {
            'games_played': team.games_played,
            'games_won': team.games_won,
            'win_percentage': team.win_percentage,
            'avg_win_margin': team.avg_win_margin,
            'avg_loss_margin': team.avg_loss_margin,
            'total_points_scored': team.total_points_scored,
            'total_points_against': team.total_points_against,
        }

    # Recent games — always last 5, no season filter
    valid_games = _get_team_games(team, db, season=None)
    player_ids = [team.player1_id, team.player2_id, team.player3_id]
    recent_game_summaries = []

    for game, _ in valid_games[:5]:
        team1_players = db.query(Player).join(GameParticipation).filter(
            GameParticipation.game_id == game.id,
            GameParticipation.team_number == 1,
        ).all()
        team2_players = db.query(Player).join(GameParticipation).filter(
            GameParticipation.game_id == game.id,
            GameParticipation.team_number == 2,
        ).all()
        recent_game_summaries.append(GameSummary(
            id=game.id,
            team1_score=game.team1_score,
            team2_score=game.team2_score,
            winner_team=game.winner_team,
            location=game.location,
            played_at=game.played_at,
            team1_player_names=[p.name for p in team1_players],
            team2_player_names=[p.name for p in team2_players],
        ))

    return TeamStats(
        id=team.id,
        team_name=team.team_name,
        players=[team.player1, team.player2, team.player3],
        recent_games=recent_game_summaries,
        **stats,
    )
