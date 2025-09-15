from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Tuple
from app.models import Game, GameParticipation, Player
from sqlalchemy import and_

# Define team rosters
ORCHARD_PLAYERS = ["Sean Nary", "Tyler Pendleton", "Reid Silverman"]
DREHER_PLAYERS = ["Jeremy Cortazzo", "Danny Wersching", "AJ Partridge", "Brendan Meagher"]

def is_rivalry_game(game: Game, db: Session) -> Optional[Dict]:
    """
    Check if a game is a rivalry game between The Orchard and Dreher.
    Returns rivalry info if it's a rivalry game, None otherwise.
    """
    # Get all participations for this game
    participations = db.query(GameParticipation).filter(
        GameParticipation.game_id == game.id
    ).all()
    
    # Get player names for each team
    team1_players = []
    team2_players = []
    
    for participation in participations:
        player = db.query(Player).filter(Player.id == participation.player_id).first()
        if player:
            if participation.team_number == 1:
                team1_players.append(player.name)
            else:
                team2_players.append(player.name)
    
    # Check if team1 is Orchard and team2 is Dreher (or vice versa)
    team1_is_orchard = all(player in ORCHARD_PLAYERS for player in team1_players) and len(team1_players) == 3 and set(team1_players) == set(ORCHARD_PLAYERS)
    team1_is_dreher = all(player in DREHER_PLAYERS for player in team1_players) and len(team1_players) == 3
    
    team2_is_orchard = all(player in ORCHARD_PLAYERS for player in team2_players) and len(team2_players) == 3 and set(team2_players) == set(ORCHARD_PLAYERS)
    team2_is_dreher = all(player in DREHER_PLAYERS for player in team2_players) and len(team2_players) == 3
    
    # Determine if it's a rivalry game
    if team1_is_orchard and team2_is_dreher:
        return {
            "orchard_team": 1,
            "dreher_team": 2,
            "orchard_players": team1_players,
            "dreher_players": team2_players,
            "orchard_score": game.team1_score,
            "dreher_score": game.team2_score,
            "winner": "Orchard" if game.winner_team == 1 else "Dreher"
        }
    elif team1_is_dreher and team2_is_orchard:
        return {
            "orchard_team": 2,
            "dreher_team": 1,
            "orchard_players": team2_players,
            "dreher_players": team1_players,
            "orchard_score": game.team2_score,
            "dreher_score": game.team1_score,
            "winner": "Orchard" if game.winner_team == 2 else "Dreher"
        }
    
    return None

def get_rivalry_games(db: Session) -> Dict:
    """
    Get all rivalry games and calculate rivalry stats.
    """
    # Get all games
    games = db.query(Game).order_by(Game.played_at.desc()).all()
    
    rivalry_games = []
    orchard_wins = 0
    dreher_wins = 0
    total_orchard_points = 0
    total_dreher_points = 0
    
    for game in games:
        rivalry_info = is_rivalry_game(game, db)
        if rivalry_info:
            # Add game info to rivalry data
            rivalry_game = {
                "id": game.id,
                "played_at": game.played_at,
                "location": game.location,
                **rivalry_info
            }
            rivalry_games.append(rivalry_game)
            
            # Update stats
            if rivalry_info["winner"] == "Orchard":
                orchard_wins += 1
            else:
                dreher_wins += 1
            
            total_orchard_points += rivalry_info["orchard_score"]
            total_dreher_points += rivalry_info["dreher_score"]
    
    # Calculate additional stats
    total_games = len(rivalry_games)
    orchard_win_percentage = (orchard_wins / total_games * 100) if total_games > 0 else 0
    dreher_win_percentage = (dreher_wins / total_games * 100) if total_games > 0 else 0
    point_differential = total_orchard_points - total_dreher_points
    
    return {
        "total_games": total_games,
        "orchard_wins": orchard_wins,
        "dreher_wins": dreher_wins,
        "orchard_win_percentage": orchard_win_percentage,
        "dreher_win_percentage": dreher_win_percentage,
        "total_orchard_points": total_orchard_points,
        "total_dreher_points": total_dreher_points,
        "point_differential": point_differential,
        "recent_games": rivalry_games[:5]  # Last 5 rivalry games
    }