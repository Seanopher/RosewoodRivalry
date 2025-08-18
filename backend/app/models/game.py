from sqlalchemy import Column, Integer, DateTime
from datetime import datetime
from app.core.database import Base

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    team1_score = Column(Integer, nullable=False)
    team2_score = Column(Integer, nullable=False)
