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

class TeamsListResponse(BaseModel):
    """Response model for team list with threshold info"""
    teams: List[TeamOut]
    total_games: int
    min_games_required: int
    threshold_percentage: float = 10.0

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

class RivalryGame(BaseModel):
    """Individual rivalry game"""
    id: int
    played_at: datetime
    location: Optional[str]
    orchard_team: int
    dreher_team: int
    orchard_players: List[str]
    dreher_players: List[str]
    orchard_score: int
    dreher_score: int
    winner: str

class RivalryStats(BaseModel):
    """Rivalry statistics between The Orchard and Dreher"""
    total_games: int
    orchard_wins: int
    dreher_wins: int
    orchard_win_percentage: float
    dreher_win_percentage: float
    total_orchard_points: int
    total_dreher_points: int
    point_differential: int
    recent_games: List[RivalryGame]

# ---------------------------
# Golf Schemas
# ---------------------------
class GolfHoleInput(BaseModel):
    """Input for a single hole result"""
    hole_number: int = Field(..., ge=1, le=18)
    winner_team: Optional[int] = Field(None)  # 1, 2, or null for halved

    @validator('winner_team')
    def validate_winner_team(cls, v):
        if v is not None and v not in (1, 2):
            raise ValueError('winner_team must be 1, 2, or null')
        return v

class GolfRoundCreate(BaseModel):
    """Create a new golf round"""
    team1_players: List[int] = Field(..., min_items=2, max_items=2)
    team2_players: List[int] = Field(..., min_items=2, max_items=2)
    course: str = Field(..., min_length=1, max_length=200)
    holes: List[GolfHoleInput] = Field(..., min_items=18, max_items=18)

    @validator('team2_players')
    def validate_unique_players(cls, v, values):
        if 'team1_players' in values:
            team1 = set(values['team1_players'])
            team2 = set(v)
            if team1.intersection(team2):
                raise ValueError('Players cannot be on both teams')
        return v

    @validator('holes')
    def validate_holes(cls, v):
        hole_numbers = [h.hole_number for h in v]
        if sorted(hole_numbers) != list(range(1, 19)):
            raise ValueError('Must provide results for all 18 holes (1-18)')
        return v

class GolfRoundUpdate(BaseModel):
    """Update an existing golf round"""
    team1_players: Optional[List[int]] = Field(None, min_items=2, max_items=2)
    team2_players: Optional[List[int]] = Field(None, min_items=2, max_items=2)
    course: Optional[str] = Field(None, min_length=1, max_length=200)
    holes: Optional[List[GolfHoleInput]] = Field(None, min_items=18, max_items=18)

    @validator('team2_players')
    def validate_unique_players(cls, v, values):
        if v is not None and 'team1_players' in values and values['team1_players'] is not None:
            team1 = set(values['team1_players'])
            team2 = set(v)
            if team1.intersection(team2):
                raise ValueError('Players cannot be on both teams')
        return v

    @validator('holes')
    def validate_holes(cls, v):
        if v is not None:
            hole_numbers = [h.hole_number for h in v]
            if sorted(hole_numbers) != list(range(1, 19)):
                raise ValueError('Must provide results for all 18 holes (1-18)')
        return v

class GolfHoleResultOut(BaseModel):
    """Output for a single hole result"""
    hole_number: int
    winner_team: Optional[int]

    model_config = {
        "from_attributes": True
    }

class GolfRoundOut(BaseModel):
    """Full golf round detail with players and hole results"""
    id: int
    course: str
    played_at: datetime
    team1_holes_won: int
    team2_holes_won: int
    halved_holes: int
    winner_team: Optional[int]
    team1_players: List[PlayerOut]
    team2_players: List[PlayerOut]
    hole_results: List[GolfHoleResultOut]

    model_config = {
        "from_attributes": True
    }

class GolfRoundSummary(BaseModel):
    """Lightweight golf round for lists"""
    id: int
    course: str
    played_at: datetime
    team1_holes_won: int
    team2_holes_won: int
    halved_holes: int
    winner_team: Optional[int]
    team1_player_names: List[str]
    team2_player_names: List[str]

class GolfPlayerStats(BaseModel):
    """Golf-specific stats for a player"""
    id: int
    name: str
    golf_rounds_played: int
    golf_rounds_won: int
    golf_rounds_lost: int
    golf_rounds_drawn: int
    golf_holes_won: int
    golf_holes_lost: int
    golf_win_percentage: float
    recent_rounds: List[GolfRoundSummary]
