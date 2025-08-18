from app.core.database import engine, Base
from app.models import player, game, game_player  # import your models

# Create all tables
Base.metadata.create_all(bind=engine)

print("Database initialized!")
