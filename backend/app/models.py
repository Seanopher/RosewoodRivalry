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

    # Golf cached statistics
    golf_rounds_played = Column(Integer, default=0, server_default='0')
    golf_rounds_won = Column(Integer, default=0, server_default='0')
    golf_rounds_lost = Column(Integer, default=0, server_default='0')
    golf_rounds_drawn = Column(Integer, default=0, server_default='0')
    golf_holes_won = Column(Integer, default=0, server_default='0')
    golf_holes_lost = Column(Integer, default=0, server_default='0')
    golf_win_percentage = Column(Float, default=0.0, server_default='0.0')

    # Relationships
    participations = relationship("GameParticipation", back_populates="player")
    golf_participations = relationship("GolfRoundParticipation", back_populates="player")


class Game(Base):
    """Game entity tracking Die games played to 21 points"""
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    team1_score = Column(Integer, nullable=False)
    team2_score = Column(Integer, nullable=False)
    winner_team = Column(Integer, nullable=False)  # 1 or 2
    location = Column(String, nullable=True)  # Where the game was played
    played_at = Column(DateTime, default=est_now, index=True)
    
    # Relationships
    participations = relationship("GameParticipation", back_populates="game")


class GameParticipation(Base):
    """Junction table tracking which players were on which team for each game"""
    __tablename__ = "game_participations"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    team_number = Column(Integer, nullable=False)  # 1 or 2
    
    # Relationships
    game = relationship("Game", back_populates="participations")
    player = relationship("Player", back_populates="participations")


class Team(Base):
    """Team entity tracking statistics for 3-player teams with ≥3 games together"""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    player2_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    player3_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
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


class GolfCourse(Base):
    """Cached golf course data from GolfCourseAPI.com"""
    __tablename__ = "golf_courses"

    id = Column(Integer, primary_key=True, index=True)
    api_id = Column(Integer, unique=True, nullable=False, index=True)
    club_name = Column(String, nullable=False)
    course_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Relationships
    tees = relationship("GolfCourseTee", back_populates="course", cascade="all, delete-orphan")
    rounds = relationship("GolfRound", back_populates="golf_course")


class GolfCourseTee(Base):
    """Tee set for a cached golf course"""
    __tablename__ = "golf_course_tees"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("golf_courses.id"), nullable=False, index=True)
    tee_name = Column(String, nullable=False)
    gender = Column(String, nullable=False)  # "male" or "female"
    course_rating = Column(Float, nullable=True)
    slope_rating = Column(Integer, nullable=True)
    total_yards = Column(Integer, nullable=True)
    par_total = Column(Integer, nullable=True)

    # Relationships
    course = relationship("GolfCourse", back_populates="tees")
    holes = relationship("GolfCourseTeeHole", back_populates="tee", cascade="all, delete-orphan")


class GolfCourseTeeHole(Base):
    """Hole data for a tee set"""
    __tablename__ = "golf_course_tee_holes"

    id = Column(Integer, primary_key=True, index=True)
    tee_id = Column(Integer, ForeignKey("golf_course_tees.id"), nullable=False, index=True)
    hole_number = Column(Integer, nullable=False)  # 1-18
    par = Column(Integer, nullable=False)
    yardage = Column(Integer, nullable=False)
    handicap = Column(Integer, nullable=True)

    # Relationships
    tee = relationship("GolfCourseTee", back_populates="holes")


class GolfRound(Base):
    """Golf round entity tracking 2v2 match play rounds"""
    __tablename__ = "golf_rounds"

    id = Column(Integer, primary_key=True, index=True)
    course = Column(String, nullable=False)
    played_at = Column(DateTime, default=est_now, index=True)
    team1_holes_won = Column(Integer, default=0)
    team2_holes_won = Column(Integer, default=0)
    halved_holes = Column(Integer, default=0)
    winner_team = Column(Integer, nullable=True)  # 1, 2, or NULL for draw
    course_id = Column(Integer, ForeignKey("golf_courses.id"), nullable=True)
    tee_id = Column(Integer, ForeignKey("golf_course_tees.id"), nullable=True)

    # Relationships
    participations = relationship("GolfRoundParticipation", back_populates="round", cascade="all, delete-orphan")
    hole_results = relationship("GolfHoleResult", back_populates="round", cascade="all, delete-orphan")
    golf_course = relationship("GolfCourse", back_populates="rounds")
    tee = relationship("GolfCourseTee")


class GolfRoundParticipation(Base):
    """Junction table tracking which players were on which team for each golf round"""
    __tablename__ = "golf_round_participations"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("golf_rounds.id"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    team_number = Column(Integer, nullable=False)  # 1 or 2

    # Relationships
    round = relationship("GolfRound", back_populates="participations")
    player = relationship("Player", back_populates="golf_participations")


class GolfHoleResult(Base):
    """Individual hole result for a golf round"""
    __tablename__ = "golf_hole_results"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("golf_rounds.id"), nullable=False, index=True)
    hole_number = Column(Integer, nullable=False)  # 1-18
    winner_team = Column(Integer, nullable=True)  # 1, 2, or NULL for halved
    par = Column(Integer, nullable=True)  # Snapshot from course data
    yardage = Column(Integer, nullable=True)  # Snapshot from course data

    # Relationships
    round = relationship("GolfRound", back_populates="hole_results")
