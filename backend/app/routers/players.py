from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional
from app.schemas.schemas import PlayerCreate, PlayerOut, PlayerStats, GameSummary
from app.models import Player, Game, GameParticipation
from app.database import get_db

router = APIRouter(prefix="/players", tags=["players"])


def _compute_player_season_stats(player: Player, db: Session, season: Optional[str] = None) -> dict:
    """Compute player stats dynamically, optionally filtered to a specific year."""
    participations = db.query(GameParticipation).filter(
        GameParticipation.player_id == player.id
    ).all()

    game_ids = [p.game_id for p in participations]
    if not game_ids:
        return {
            'games_played': 0, 'games_won': 0, 'win_percentage': 0.0,
            'avg_win_margin': 0.0, 'avg_loss_margin': 0.0,
            'total_points_scored': 0, 'total_points_against': 0,
        }

    games_query = db.query(Game).filter(Game.id.in_(game_ids))
    if season and season != 'all':
        games_query = games_query.filter(extract('year', Game.played_at) == int(season))
    games = {g.id: g for g in games_query.all()}

    games_played = 0
    games_won = 0
    total_scored = 0
    total_against = 0
    win_margins: list = []
    loss_margins: list = []

    for p in participations:
        game = games.get(p.game_id)
        if not game:
            continue
        games_played += 1
        is_team1 = p.team_number == 1
        p_score = game.team1_score if is_team1 else game.team2_score
        o_score = game.team2_score if is_team1 else game.team1_score
        total_scored += p_score
        total_against += o_score
        if game.winner_team == p.team_number:
            games_won += 1
            win_margins.append(p_score - o_score)
        else:
            loss_margins.append(o_score - p_score)

    return {
        'games_played': games_played,
        'games_won': games_won,
        'win_percentage': (games_won / games_played * 100) if games_played > 0 else 0.0,
        'avg_win_margin': sum(win_margins) / len(win_margins) if win_margins else 0.0,
        'avg_loss_margin': sum(loss_margins) / len(loss_margins) if loss_margins else 0.0,
        'total_points_scored': total_scored,
        'total_points_against': total_against,
    }


@router.post("/", response_model=PlayerOut)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
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


@router.get("/leaderboard", response_model=List[PlayerStats])
def get_leaderboard(
    season: Optional[str] = Query(None, description="Filter by season year (e.g. '2025', '2026') or 'all'"),
    db: Session = Depends(get_db),
):
    """Get all players ranked by win percentage, optionally filtered by season."""
    players = db.query(Player).all()
    results = []

    for player in players:
        if season and season != 'all':
            stats = _compute_player_season_stats(player, db, season)
        else:
            # Use cached all-time values
            stats = {
                'games_played': player.games_played,
                'games_won': player.games_won,
                'win_percentage': player.win_percentage,
                'avg_win_margin': player.avg_win_margin,
                'avg_loss_margin': player.avg_loss_margin,
                'total_points_scored': player.total_points_scored,
                'total_points_against': player.total_points_against,
            }

        if stats['games_played'] == 0 and (season and season != 'all'):
            continue  # Skip players with no games in this season

        results.append(PlayerStats(
            id=player.id,
            name=player.name,
            recent_games=[],
            **stats,
        ))

    results.sort(key=lambda p: (-p.win_percentage, -p.games_played))
    return results


@router.get("/{player_id}", response_model=PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/{player_id}/stats", response_model=PlayerStats)
def get_player_stats(
    player_id: int,
    limit: int = 10,
    season: Optional[str] = Query(None, description="Filter by season year (e.g. '2025', '2026') or 'all'"),
    db: Session = Depends(get_db),
):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Compute stats (season-filtered or cached all-time)
    if season and season != 'all':
        stats = _compute_player_season_stats(player, db, season)
    else:
        stats = {
            'games_played': player.games_played,
            'games_won': player.games_won,
            'win_percentage': player.win_percentage,
            'avg_win_margin': player.avg_win_margin,
            'avg_loss_margin': player.avg_loss_margin,
            'total_points_scored': player.total_points_scored,
            'total_points_against': player.total_points_against,
        }

    # Recent games — always last 3, no season filter
    recent_games = (
        db.query(Game)
        .join(GameParticipation)
        .filter(GameParticipation.player_id == player_id)
        .order_by(Game.played_at.desc())
        .limit(3)
        .all()
    )

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
            location=game.location,
            played_at=game.played_at,
            team1_player_names=[p.name for p in team1_players],
            team2_player_names=[p.name for p in team2_players],
        ))

    return PlayerStats(
        id=player.id,
        name=player.name,
        recent_games=game_summaries,
        **stats,
    )
