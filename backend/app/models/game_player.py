from sqlalchemy import Column, Integer, ForeignKey
from app.core.database import Base

class GamePlayer(Base):
    __tablename__ = "game_players"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team = Column(Integer, nullable=False)  # 1 or 2
