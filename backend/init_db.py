from app.database import engine, Base
from app.models import Player, Game, GameParticipation

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database initialized!")
