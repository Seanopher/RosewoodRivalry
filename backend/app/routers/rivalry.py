from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.schemas import RivalryStats
from app.database import get_db
from app.services.rivalry_service import get_rivalry_games

router = APIRouter(prefix="/rivalry", tags=["rivalry"])

@router.get("/", response_model=RivalryStats)
def get_rivalry_stats(db: Session = Depends(get_db)):
    """Get rivalry statistics between The Orchard and Dreher"""
    return get_rivalry_games(db)