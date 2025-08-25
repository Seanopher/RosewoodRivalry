from sqlalchemy.orm import Session
from sqlalchemy import and_
from collections import defaultdict, Counter
from typing import List, Dict, Tuple
from app.models import Team, Game, GameParticipation, Player


def get_team_name(players: List[Player]) -> str:
    """Generate team name from player last names in format: LastName1/LastName2/LastName3"""
    last_names = []
    for player in sorted(players, key=lambda p: p.name):  # Sort for consistency
        # Extract last name (everything after the last space)
        name_parts = player.name.strip().split()
        last_name = name_parts[-1] if name_parts else player.name
        last_names.append(last_name)
    
    return "/".join(last_names)


def analyze_teams_from_games(db: Session) -> Dict[Tuple[int, int, int], List[int]]:
    """
    Analyze all games to find team combinations and their game IDs.
    Returns dict mapping (player1_id, player2_id, player3_id) -> [game_ids]
    """
    team_games = defaultdict(list)
    
    # Get all games
    games = db.query(Game).all()
    
    for game in games:
        # Get players for each team in this game
        team1_players = db.query(GameParticipation).filter(
            and_(GameParticipation.game_id == game.id, GameParticipation.team_number == 1)
        ).all()
        
        team2_players = db.query(GameParticipation).filter(
            and_(GameParticipation.game_id == game.id, GameParticipation.team_number == 2)
        ).all()
        
        # Process each team (should have exactly 3 players each)
        for team_players in [team1_players, team2_players]:
            if len(team_players) == 3:
                # Create sorted tuple of player IDs for consistent team identification
                player_ids = tuple(sorted([p.player_id for p in team_players]))
                team_games[player_ids].append(game.id)
    
    return team_games


def create_or_update_team(db: Session, player_ids: Tuple[int, int, int], game_ids: List[int]) -> Team:
    """
    Create or update a team with the given players and calculate their stats.
    Only creates/updates teams with 3+ games.
    """
    if len(game_ids) < 3:
        return None  # Don't create teams with less than 3 games
    
    # Check if team already exists
    existing_team = db.query(Team).filter(
        and_(
            Team.player1_id == player_ids[0],
            Team.player2_id == player_ids[1],
            Team.player3_id == player_ids[2]
        )
    ).first()
    
    # Get player objects for team name generation
    players = [db.get(Player, pid) for pid in player_ids]
    team_name = get_team_name(players)
    
    if existing_team:
        team = existing_team
    else:
        # Create new team
        team = Team(
            player1_id=player_ids[0],
            player2_id=player_ids[1], 
            player3_id=player_ids[2],
            team_name=team_name
        )
        db.add(team)
    
    # Calculate team stats from their games
    games_won = 0
    total_points_scored = 0
    total_points_against = 0
    win_margins = []
    loss_margins = []
    
    for game_id in game_ids:
        game = db.get(Game, game_id)
        if not game:
            continue
            
        # Determine which team number this team was in this game
        team_participations = db.query(GameParticipation).filter(
            and_(
                GameParticipation.game_id == game_id,
                GameParticipation.player_id.in_(player_ids)
            )
        ).all()
        
        if len(team_participations) != 3:
            continue  # Skip if not all 3 players found
            
        # All players should have the same team_number
        team_number = team_participations[0].team_number
        
        if team_number == 1:
            team_score = game.team1_score
            opponent_score = game.team2_score
        else:
            team_score = game.team2_score
            opponent_score = game.team1_score
        
        total_points_scored += team_score
        total_points_against += opponent_score
        
        if game.winner_team == team_number:
            games_won += 1
            win_margins.append(team_score - opponent_score)
        else:
            loss_margins.append(opponent_score - team_score)
    
    # Update team stats
    team.games_played = len(game_ids)
    team.games_won = games_won
    team.total_points_scored = total_points_scored
    team.total_points_against = total_points_against
    team.win_percentage = (games_won / len(game_ids) * 100) if len(game_ids) > 0 else 0.0
    team.avg_win_margin = sum(win_margins) / len(win_margins) if win_margins else 0.0
    team.avg_loss_margin = sum(loss_margins) / len(loss_margins) if loss_margins else 0.0
    team.team_name = team_name  # Update in case player names changed
    
    db.commit()
    return team


def rebuild_all_teams(db: Session) -> List[Team]:
    """
    Analyze all games and rebuild team statistics from scratch.
    Returns list of teams with 3+ games.
    """
    # Clear existing teams
    db.query(Team).delete()
    db.commit()
    
    # Analyze games to find team combinations
    team_games = analyze_teams_from_games(db)
    
    created_teams = []
    for player_ids, game_ids in team_games.items():
        team = create_or_update_team(db, player_ids, game_ids)
        if team:
            created_teams.append(team)
    
    return created_teams


def update_teams_for_game(db: Session, game: Game):
    """
    Update team stats when a new game is created or updated.
    Only updates teams that now have 3+ games.
    """
    # Get both teams from this game
    team1_players = db.query(GameParticipation).filter(
        and_(GameParticipation.game_id == game.id, GameParticipation.team_number == 1)
    ).all()
    
    team2_players = db.query(GameParticipation).filter(
        and_(GameParticipation.game_id == game.id, GameParticipation.team_number == 2)
    ).all()
    
    for team_players in [team1_players, team2_players]:
        if len(team_players) == 3:
            player_ids = tuple(sorted([p.player_id for p in team_players]))
            
            # Find all games this team combination has played
            team_games = analyze_teams_from_games(db)
            if player_ids in team_games:
                create_or_update_team(db, player_ids, team_games[player_ids])