from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

# ---------------------------
# Player Schemas
# ---------------------------
class PlayerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class PlayerOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    games_played: int
    games_won: int
    total_points_scored: int
    total_points_against: int
    win_percentage: float
    avg_loss_margin: float
    avg_win_margin: float

    model_config = {
        "from_attributes": True
    }

# ---------------------------
# Game Schemas
# ---------------------------
class GameCreate(BaseModel):
    team1_score: int = Field(..., ge=0)
    team2_score: int = Field(..., ge=0)
    team1_players: List[int] = Field(..., min_items=3, max_items=3)
    team2_players: List[int] = Field(..., min_items=3, max_items=3)
    location: Optional[str] = Field(None, max_length=100)
    
    @validator('team2_players')
    def validate_unique_players(cls, v, values):
        if 'team1_players' in values:
            team1 = set(values['team1_players'])
            team2 = set(v)
            if team1.intersection(team2):
                raise ValueError('Players cannot be on both teams')
        return v

class GameUpdate(BaseModel):
    team1_score: Optional[int] = Field(None, ge=0)
    team2_score: Optional[int] = Field(None, ge=0)
    team1_players: Optional[List[int]] = Field(None, min_items=3, max_items=3)
    team2_players: Optional[List[int]] = Field(None, min_items=3, max_items=3)
    location: Optional[str] = Field(None, max_length=100)
    
    @validator('team2_players')
    def validate_unique_players(cls, v, values):
        if v is not None and 'team1_players' in values and values['team1_players'] is not None:
            team1 = set(values['team1_players'])
            team2 = set(v)
            if team1.intersection(team2):
                raise ValueError('Players cannot be on both teams')
        return v

class GameOut(BaseModel):
    id: int
    team1_score: int
    team2_score: int
    winner_team: int
    location: Optional[str]
    played_at: datetime
    team1_players: List['PlayerOut']
    team2_players: List['PlayerOut']

    model_config = {
        "from_attributes": True
    }

# ---------------------------
# Game Participation Schemas  
# ---------------------------
class GameParticipationOut(BaseModel):
    id: int
    game_id: int
    player_id: int
    team_number: int
    
    model_config = {
        "from_attributes": True
    }

# ---------------------------
# Response Schemas
# ---------------------------
class GameSummary(BaseModel):
    """Lightweight game summary for lists"""
    id: int
    team1_score: int
    team2_score: int
    winner_team: int
    location: Optional[str]
    played_at: datetime
    team1_player_names: List[str]
    team2_player_names: List[str]

class PlayerStats(BaseModel):
    """Detailed player statistics"""
    id: int
    name: str
    games_played: int
    games_won: int
    win_percentage: float
    avg_win_margin: float
    avg_loss_margin: float
    total_points_scored: int
    total_points_against: int
    recent_games: List[GameSummary]

# ---------------------------
# Team Schemas
# ---------------------------
class TeamOut(BaseModel):
    id: int
    player1_id: int
    player2_id: int  
    player3_id: int
    team_name: str
    created_at: datetime
    games_played: int
    games_won: int
    total_points_scored: int
    total_points_against: int
    win_percentage: float
    avg_loss_margin: float
    avg_win_margin: float
    player1: PlayerOut
    player2: PlayerOut
    player3: PlayerOut

    model_config = {
        "from_attributes": True
    }

class TeamStats(BaseModel):
    """Detailed team statistics"""
    id: int
    team_name: str
    games_played: int
    games_won: int
    win_percentage: float
    avg_win_margin: float
    avg_loss_margin: float
    total_points_scored: int
    total_points_against: int
    players: List[PlayerOut]
    recent_games: List[GameSummary]
