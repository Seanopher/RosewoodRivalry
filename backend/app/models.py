from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Player(Base):
    """Player entity with cached statistics for Die game tracking"""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Cached statistics - updated when games are recorded
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    total_points_scored = Column(Integer, default=0)
    total_points_against = Column(Integer, default=0)
    win_percentage = Column(Float, default=0.0)
    avg_loss_margin = Column(Float, default=0.0)
    avg_win_margin = Column(Float, default=0.0)

    # Relationships
    participations = relationship("GameParticipation", back_populates="player")


class Game(Base):
    """Game entity tracking Die games played to 21 points"""
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    team1_score = Column(Integer, nullable=False)
    team2_score = Column(Integer, nullable=False)
    winner_team = Column(Integer, nullable=False)  # 1 or 2
    played_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    participations = relationship("GameParticipation", back_populates="game")


class GameParticipation(Base):
    """Junction table tracking which players were on which team for each game"""
    __tablename__ = "game_participations"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_number = Column(Integer, nullable=False)  # 1 or 2
    
    # Relationships
    game = relationship("Game", back_populates="participations")
    player = relationship("Player", back_populates="participations")
