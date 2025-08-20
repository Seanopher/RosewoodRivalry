from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.schemas import GameCreate, GameOut, GameSummary, GameUpdate
from app.models import Game, Player, GameParticipation
from app.database import get_db

router = APIRouter(prefix="/games", tags=["games"])

def _update_single_player_stats(db: Session, player_id: int):
    """Update cached player statistics for a single player"""
    player = db.get(Player, player_id)
    if not player:
        return
        
    # Recalculate all stats from scratch
    all_participations = db.query(GameParticipation).filter(
        GameParticipation.player_id == player.id
    ).all()
    
    games_played = len(all_participations)
    games_won = 0
    total_points_scored = 0
    total_points_against = 0
    win_margins = []
    loss_margins = []
    
    for p in all_participations:
        game_record = db.get(Game, p.game_id)
        if not game_record:
            continue
            
        if p.team_number == 1:
            player_score = game_record.team1_score
            opponent_score = game_record.team2_score
        else:
            player_score = game_record.team2_score
            opponent_score = game_record.team1_score
        
        total_points_scored += player_score
        total_points_against += opponent_score
        
        if game_record.winner_team == p.team_number:
            games_won += 1
            win_margins.append(player_score - opponent_score)
        else:
            loss_margins.append(opponent_score - player_score)
    
    # Update player stats
    player.games_played = games_played
    player.games_won = games_won
    player.total_points_scored = total_points_scored
    player.total_points_against = total_points_against
    player.win_percentage = (games_won / games_played * 100) if games_played > 0 else 0.0
    player.avg_win_margin = sum(win_margins) / len(win_margins) if win_margins else 0.0
    player.avg_loss_margin = sum(loss_margins) / len(loss_margins) if loss_margins else 0.0
    
    db.add(player)

def _update_player_stats(db: Session, game: Game):
    """Update cached player statistics after a game is recorded"""
    # Get all players in this game
    participations = db.query(GameParticipation).filter(GameParticipation.game_id == game.id).all()
    
    for participation in participations:
        _update_single_player_stats(db, participation.player_id)
    
    db.commit()

@router.post("/", response_model=GameOut)
def create_game(game: GameCreate, db: Session = Depends(get_db)):
    # Validate all players exist
    all_player_ids = game.team1_players + game.team2_players
    players = db.query(Player).filter(Player.id.in_(all_player_ids)).all()
    if len(players) != 6:
        raise HTTPException(status_code=400, detail="One or more players not found")
    
    # Determine winner
    winner_team = 1 if game.team1_score > game.team2_score else 2
    
    # Create game record
    db_game = Game(
        team1_score=game.team1_score,
        team2_score=game.team2_score,
        winner_team=winner_team
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    # Create participation records
    for player_id in game.team1_players:
        participation = GameParticipation(
            game_id=db_game.id,
            player_id=player_id,
            team_number=1
        )
        db.add(participation)
    
    for player_id in game.team2_players:
        participation = GameParticipation(
            game_id=db_game.id,
            player_id=player_id,
            team_number=2
        )
        db.add(participation)
    
    db.commit()
    
    # Update player statistics
    _update_player_stats(db, db_game)
    
    # Return full game data
    return get_game(db_game.id, db)

@router.get("/", response_model=List[GameSummary])
def list_games(limit: int = 50, db: Session = Depends(get_db)):
    games = db.query(Game).order_by(Game.played_at.desc()).limit(limit).all()
    
    game_summaries = []
    for game in games:
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
    
    return game_summaries

@router.get("/{game_id}", response_model=GameOut)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get team players
    team1_players = db.query(Player).join(GameParticipation).filter(
        GameParticipation.game_id == game.id,
        GameParticipation.team_number == 1
    ).all()
    team2_players = db.query(Player).join(GameParticipation).filter(
        GameParticipation.game_id == game.id,
        GameParticipation.team_number == 2
    ).all()
    
    return GameOut(
        id=game.id,
        team1_score=game.team1_score,
        team2_score=game.team2_score,
        winner_team=game.winner_team,
        played_at=game.played_at,
        team1_players=team1_players,
        team2_players=team2_players
    )

@router.put("/{game_id}", response_model=GameOut)
def update_game(game_id: int, game_update: GameUpdate, db: Session = Depends(get_db)):
    # Get existing game
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update scores if provided
    if game_update.team1_score is not None:
        game.team1_score = game_update.team1_score
    if game_update.team2_score is not None:
        game.team2_score = game_update.team2_score
    
    # Recalculate winner
    game.winner_team = 1 if game.team1_score > game.team2_score else 2
    
    # Get all players that need stats updates (both old and new)
    all_affected_player_ids = set()
    
    # Update team players if provided
    if game_update.team1_players is not None or game_update.team2_players is not None:
        # Get existing players in this game before we delete them
        existing_participations = db.query(GameParticipation).filter(GameParticipation.game_id == game.id).all()
        for participation in existing_participations:
            all_affected_player_ids.add(participation.player_id)
        
        # Validate all players exist
        all_player_ids = []
        if game_update.team1_players is not None:
            all_player_ids.extend(game_update.team1_players)
            all_affected_player_ids.update(game_update.team1_players)
        if game_update.team2_players is not None:
            all_player_ids.extend(game_update.team2_players)
            all_affected_player_ids.update(game_update.team2_players)
        
        if all_player_ids:
            players = db.query(Player).filter(Player.id.in_(all_player_ids)).all()
            if len(players) != len(all_player_ids):
                raise HTTPException(status_code=400, detail="One or more players not found")
        
        # Remove existing participations
        db.query(GameParticipation).filter(GameParticipation.game_id == game.id).delete()
        
        # Add new participations
        if game_update.team1_players is not None:
            for player_id in game_update.team1_players:
                participation = GameParticipation(
                    game_id=game.id,
                    player_id=player_id,
                    team_number=1
                )
                db.add(participation)
        
        if game_update.team2_players is not None:
            for player_id in game_update.team2_players:
                participation = GameParticipation(
                    game_id=game.id,
                    player_id=player_id,
                    team_number=2
                )
                db.add(participation)
    
    db.add(game)
    db.commit()
    db.refresh(game)
    
    # Update player statistics for all affected players (including removed players)
    if game_update.team1_players is not None or game_update.team2_players is not None:
        # Update stats for all players who were affected by this game change
        for player_id in all_affected_player_ids:
            _update_single_player_stats(db, player_id)
        db.commit()
    else:
        # If only scores changed, update current players
        _update_player_stats(db, game)
    
    # Return updated game data
    return get_game(game.id, db)

@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db)):
    # Get existing game
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get all players who were in this game for stats updates
    existing_participations = db.query(GameParticipation).filter(GameParticipation.game_id == game.id).all()
    affected_player_ids = [p.player_id for p in existing_participations]
    
    # Delete game participations first (foreign key constraint)
    db.query(GameParticipation).filter(GameParticipation.game_id == game.id).delete()
    
    # Delete the game
    db.delete(game)
    db.commit()
    
    # Update player statistics for all affected players
    for player_id in affected_player_ids:
        _update_single_player_stats(db, player_id)
    db.commit()
    
    return {"message": "Game deleted successfully"}
