from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.utils.timezone import est_now

class Player(Base):
    """Player entity with cached statistics for Die game tracking"""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=est_now)
    
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
    location = Column(String, nullable=True)  # Where the game was played
    played_at = Column(DateTime, default=est_now)
    
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


class Team(Base):
    """Team entity tracking statistics for 3-player teams with ≥3 games together"""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player3_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_name = Column(String, nullable=False)  # e.g., "Nary/Silverman/Pendleton"
    created_at = Column(DateTime, default=est_now)
    
    # Cached team statistics - updated when games are recorded
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    total_points_scored = Column(Integer, default=0)
    total_points_against = Column(Integer, default=0)
    win_percentage = Column(Float, default=0.0)
    avg_loss_margin = Column(Float, default=0.0)
    avg_win_margin = Column(Float, default=0.0)

    # Relationships
    player1 = relationship("Player", foreign_keys=[player1_id])
    player2 = relationship("Player", foreign_keys=[player2_id])
    player3 = relationship("Player", foreign_keys=[player3_id])
