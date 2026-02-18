from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.schemas import (
    GolfRoundCreate, GolfRoundUpdate, GolfRoundOut, GolfRoundSummary,
    GolfHoleResultOut, GolfPlayerStats, GolfParTypeStat, PlayerOut,
    GolfCourseSearchResult, GolfCourseOut, GolfCourseTeeOut, GolfCourseTeeHoleOut,
)
from app.models import (
    GolfRound, GolfRoundParticipation, GolfHoleResult, Player,
    GolfCourse, GolfCourseTee, GolfCourseTeeHole,
)
from app.database import get_db
from app.services.golf_course_service import search_courses, get_or_cache_course

router = APIRouter(prefix="/golf", tags=["golf"])


# ---------------------------
# Course endpoints
# ---------------------------

@router.get("/courses/search", response_model=List[GolfCourseSearchResult])
def search_golf_courses(q: str = Query(..., min_length=2)):
    """Search GolfCourseAPI for courses."""
    try:
        results = search_courses(q)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Golf course API error: {str(e)}")

    out = []
    for c in results:
        location = c.get("location", {}) or {}
        out.append(GolfCourseSearchResult(
            id=c.get("id", 0),
            club_name=c.get("club_name", ""),
            course_name=c.get("course_name", ""),
            city=location.get("city"),
            state=location.get("state"),
            country=location.get("country"),
        ))
    return out


@router.get("/courses/{api_id}", response_model=GolfCourseOut)
def get_course(api_id: int, db: Session = Depends(get_db)):
    """Get or cache a course by its GolfCourseAPI id."""
    try:
        course = get_or_cache_course(api_id, db)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Golf course API error: {str(e)}")

    tees_out = []
    for tee in course.tees:
        holes_sorted = sorted(tee.holes, key=lambda h: h.hole_number)
        tees_out.append(GolfCourseTeeOut(
            id=tee.id,
            tee_name=tee.tee_name,
            gender=tee.gender,
            course_rating=tee.course_rating,
            slope_rating=tee.slope_rating,
            total_yards=tee.total_yards,
            par_total=tee.par_total,
            holes=[GolfCourseTeeHoleOut(
                hole_number=h.hole_number,
                par=h.par,
                yardage=h.yardage,
                handicap=h.handicap,
            ) for h in holes_sorted],
        ))

    return GolfCourseOut(
        id=course.id,
        api_id=course.api_id,
        club_name=course.club_name,
        course_name=course.course_name,
        address=course.address,
        city=course.city,
        state=course.state,
        country=course.country,
        latitude=course.latitude,
        longitude=course.longitude,
        tees=tees_out,
    )


# ---------------------------
# Round helpers
# ---------------------------

def _update_single_player_golf_stats(db: Session, player_id: int):
    """Recalculate all golf stats for a single player from scratch"""
    player = db.get(Player, player_id)
    if not player:
        return

    all_participations = db.query(GolfRoundParticipation).filter(
        GolfRoundParticipation.player_id == player.id
    ).all()

    rounds_played = len(all_participations)
    rounds_won = 0
    rounds_lost = 0
    rounds_drawn = 0
    holes_won = 0
    holes_lost = 0

    for p in all_participations:
        golf_round = db.get(GolfRound, p.round_id)
        if not golf_round:
            continue

        # Count holes won/lost for this player's team
        if p.team_number == 1:
            holes_won += golf_round.team1_holes_won
            holes_lost += golf_round.team2_holes_won
        else:
            holes_won += golf_round.team2_holes_won
            holes_lost += golf_round.team1_holes_won

        # Count round results
        if golf_round.winner_team is None:
            rounds_drawn += 1
        elif golf_round.winner_team == p.team_number:
            rounds_won += 1
        else:
            rounds_lost += 1

    player.golf_rounds_played = rounds_played
    player.golf_rounds_won = rounds_won
    player.golf_rounds_lost = rounds_lost
    player.golf_rounds_drawn = rounds_drawn
    player.golf_holes_won = holes_won
    player.golf_holes_lost = holes_lost
    player.golf_win_percentage = (rounds_won / rounds_played * 100) if rounds_played > 0 else 0.0

    db.add(player)


def _update_golf_stats_for_round(db: Session, golf_round: GolfRound):
    """Update golf stats for all players in a round"""
    participations = db.query(GolfRoundParticipation).filter(
        GolfRoundParticipation.round_id == golf_round.id
    ).all()

    for participation in participations:
        _update_single_player_golf_stats(db, participation.player_id)

    db.commit()


def _calculate_round_results(holes):
    """Calculate team1_holes_won, team2_holes_won, halved_holes, and winner from hole results"""
    team1_won = sum(1 for h in holes if h.winner_team == 1)
    team2_won = sum(1 for h in holes if h.winner_team == 2)
    halved = sum(1 for h in holes if h.winner_team is None)

    if team1_won > team2_won:
        winner = 1
    elif team2_won > team1_won:
        winner = 2
    else:
        winner = None

    return team1_won, team2_won, halved, winner


def _build_round_summary(db: Session, golf_round: GolfRound) -> GolfRoundSummary:
    """Build a GolfRoundSummary from a round"""
    participations = db.query(GolfRoundParticipation, Player).join(Player).filter(
        GolfRoundParticipation.round_id == golf_round.id
    ).all()

    team1_names = [p.name for part, p in participations if part.team_number == 1]
    team2_names = [p.name for part, p in participations if part.team_number == 2]

    return GolfRoundSummary(
        id=golf_round.id,
        course=golf_round.course,
        played_at=golf_round.played_at,
        team1_holes_won=golf_round.team1_holes_won,
        team2_holes_won=golf_round.team2_holes_won,
        halved_holes=golf_round.halved_holes,
        winner_team=golf_round.winner_team,
        team1_player_names=team1_names,
        team2_player_names=team2_names,
    )


@router.post("/rounds/", response_model=GolfRoundOut)
def create_golf_round(round_data: GolfRoundCreate, db: Session = Depends(get_db)):
    # Validate all players exist
    all_player_ids = round_data.team1_players + round_data.team2_players
    players = db.query(Player).filter(Player.id.in_(all_player_ids)).all()
    if len(players) != 4:
        raise HTTPException(status_code=400, detail="One or more players not found")

    # Calculate results from holes
    team1_won, team2_won, halved, winner = _calculate_round_results(round_data.holes)

    # Determine course name: from linked course or free-text
    course_name = round_data.course or ""
    if round_data.course_id:
        golf_course = db.query(GolfCourse).filter(GolfCourse.id == round_data.course_id).first()
        if golf_course and not course_name:
            course_name = f"{golf_course.club_name} - {golf_course.course_name}"

    # Build hole par/yardage lookup from tee if provided
    tee_hole_map: dict = {}
    if round_data.tee_id:
        tee_holes = db.query(GolfCourseTeeHole).filter(
            GolfCourseTeeHole.tee_id == round_data.tee_id
        ).all()
        tee_hole_map = {h.hole_number: h for h in tee_holes}

    # Create round
    db_round = GolfRound(
        course=course_name,
        team1_holes_won=team1_won,
        team2_holes_won=team2_won,
        halved_holes=halved,
        winner_team=winner,
        course_id=round_data.course_id,
        tee_id=round_data.tee_id,
    )
    db.add(db_round)
    db.commit()
    db.refresh(db_round)

    # Create participation records
    for player_id in round_data.team1_players:
        db.add(GolfRoundParticipation(round_id=db_round.id, player_id=player_id, team_number=1))
    for player_id in round_data.team2_players:
        db.add(GolfRoundParticipation(round_id=db_round.id, player_id=player_id, team_number=2))

    # Create hole results with par/yardage snapshot
    for hole in round_data.holes:
        par = hole.par
        yardage = hole.yardage
        # Snapshot from tee data if not provided explicitly
        if tee_hole_map and hole.hole_number in tee_hole_map:
            tee_hole = tee_hole_map[hole.hole_number]
            if par is None:
                par = tee_hole.par
            if yardage is None:
                yardage = tee_hole.yardage

        db.add(GolfHoleResult(
            round_id=db_round.id,
            hole_number=hole.hole_number,
            winner_team=hole.winner_team,
            par=par,
            yardage=yardage,
        ))

    db.commit()

    # Update player statistics
    _update_golf_stats_for_round(db, db_round)

    return get_golf_round(db_round.id, db)


@router.get("/rounds/", response_model=List[GolfRoundSummary])
def list_golf_rounds(limit: int = 250, db: Session = Depends(get_db)):
    rounds = db.query(GolfRound).order_by(GolfRound.played_at.desc()).limit(limit).all()

    if not rounds:
        return []

    summaries = []
    round_ids = [r.id for r in rounds]

    # Batch fetch participations
    participations = db.query(GolfRoundParticipation, Player).join(Player).filter(
        GolfRoundParticipation.round_id.in_(round_ids)
    ).all()

    round_teams = {}
    for part, player in participations:
        if part.round_id not in round_teams:
            round_teams[part.round_id] = {1: [], 2: []}
        round_teams[part.round_id][part.team_number].append(player.name)

    for r in rounds:
        teams = round_teams.get(r.id, {1: [], 2: []})
        summaries.append(GolfRoundSummary(
            id=r.id,
            course=r.course,
            played_at=r.played_at,
            team1_holes_won=r.team1_holes_won,
            team2_holes_won=r.team2_holes_won,
            halved_holes=r.halved_holes,
            winner_team=r.winner_team,
            team1_player_names=teams[1],
            team2_player_names=teams[2],
        ))

    return summaries


@router.get("/rounds/{round_id}", response_model=GolfRoundOut)
def get_golf_round(round_id: int, db: Session = Depends(get_db)):
    golf_round = db.get(GolfRound, round_id)
    if not golf_round:
        raise HTTPException(status_code=404, detail="Golf round not found")

    team1_players = db.query(Player).join(GolfRoundParticipation).filter(
        GolfRoundParticipation.round_id == golf_round.id,
        GolfRoundParticipation.team_number == 1,
    ).all()
    team2_players = db.query(Player).join(GolfRoundParticipation).filter(
        GolfRoundParticipation.round_id == golf_round.id,
        GolfRoundParticipation.team_number == 2,
    ).all()

    hole_results = db.query(GolfHoleResult).filter(
        GolfHoleResult.round_id == golf_round.id
    ).order_by(GolfHoleResult.hole_number).all()

    # Build course output if linked
    golf_course_out = None
    if golf_round.course_id:
        gc = golf_round.golf_course
        if gc:
            tees_out = []
            for tee in gc.tees:
                holes_sorted = sorted(tee.holes, key=lambda h: h.hole_number)
                tees_out.append(GolfCourseTeeOut(
                    id=tee.id,
                    tee_name=tee.tee_name,
                    gender=tee.gender,
                    course_rating=tee.course_rating,
                    slope_rating=tee.slope_rating,
                    total_yards=tee.total_yards,
                    par_total=tee.par_total,
                    holes=[GolfCourseTeeHoleOut(
                        hole_number=h.hole_number, par=h.par, yardage=h.yardage, handicap=h.handicap,
                    ) for h in holes_sorted],
                ))
            golf_course_out = GolfCourseOut(
                id=gc.id, api_id=gc.api_id, club_name=gc.club_name, course_name=gc.course_name,
                address=gc.address, city=gc.city, state=gc.state, country=gc.country,
                latitude=gc.latitude, longitude=gc.longitude, tees=tees_out,
            )

    return GolfRoundOut(
        id=golf_round.id,
        course=golf_round.course,
        played_at=golf_round.played_at,
        team1_holes_won=golf_round.team1_holes_won,
        team2_holes_won=golf_round.team2_holes_won,
        halved_holes=golf_round.halved_holes,
        winner_team=golf_round.winner_team,
        course_id=golf_round.course_id,
        tee_id=golf_round.tee_id,
        team1_players=team1_players,
        team2_players=team2_players,
        hole_results=[GolfHoleResultOut(
            hole_number=h.hole_number, winner_team=h.winner_team,
            par=h.par, yardage=h.yardage,
        ) for h in hole_results],
        golf_course=golf_course_out,
    )


@router.put("/rounds/{round_id}", response_model=GolfRoundOut)
def update_golf_round(round_id: int, round_update: GolfRoundUpdate, db: Session = Depends(get_db)):
    golf_round = db.get(GolfRound, round_id)
    if not golf_round:
        raise HTTPException(status_code=404, detail="Golf round not found")

    all_affected_player_ids = set()

    # Update course fields
    if round_update.course is not None:
        golf_round.course = round_update.course
    if round_update.course_id is not None:
        golf_round.course_id = round_update.course_id
    if round_update.tee_id is not None:
        golf_round.tee_id = round_update.tee_id

    # Update players if provided
    if round_update.team1_players is not None or round_update.team2_players is not None:
        # Track old players
        existing = db.query(GolfRoundParticipation).filter(
            GolfRoundParticipation.round_id == golf_round.id
        ).all()
        for p in existing:
            all_affected_player_ids.add(p.player_id)

        # Validate new players
        new_ids = []
        if round_update.team1_players is not None:
            new_ids.extend(round_update.team1_players)
            all_affected_player_ids.update(round_update.team1_players)
        if round_update.team2_players is not None:
            new_ids.extend(round_update.team2_players)
            all_affected_player_ids.update(round_update.team2_players)

        if new_ids:
            players = db.query(Player).filter(Player.id.in_(new_ids)).all()
            if len(players) != len(new_ids):
                raise HTTPException(status_code=400, detail="One or more players not found")

        # Remove old participations
        db.query(GolfRoundParticipation).filter(
            GolfRoundParticipation.round_id == golf_round.id
        ).delete()

        # Add new participations
        if round_update.team1_players is not None:
            for pid in round_update.team1_players:
                db.add(GolfRoundParticipation(round_id=golf_round.id, player_id=pid, team_number=1))
        if round_update.team2_players is not None:
            for pid in round_update.team2_players:
                db.add(GolfRoundParticipation(round_id=golf_round.id, player_id=pid, team_number=2))

    # Update holes if provided
    if round_update.holes is not None:
        db.query(GolfHoleResult).filter(GolfHoleResult.round_id == golf_round.id).delete()

        # Build tee hole map if tee is set
        tee_id = round_update.tee_id or golf_round.tee_id
        tee_hole_map: dict = {}
        if tee_id:
            tee_holes = db.query(GolfCourseTeeHole).filter(
                GolfCourseTeeHole.tee_id == tee_id
            ).all()
            tee_hole_map = {h.hole_number: h for h in tee_holes}

        for hole in round_update.holes:
            par = hole.par
            yardage = hole.yardage
            if tee_hole_map and hole.hole_number in tee_hole_map:
                tee_hole = tee_hole_map[hole.hole_number]
                if par is None:
                    par = tee_hole.par
                if yardage is None:
                    yardage = tee_hole.yardage
            db.add(GolfHoleResult(
                round_id=golf_round.id,
                hole_number=hole.hole_number,
                winner_team=hole.winner_team,
                par=par,
                yardage=yardage,
            ))

        team1_won, team2_won, halved, winner = _calculate_round_results(round_update.holes)
        golf_round.team1_holes_won = team1_won
        golf_round.team2_holes_won = team2_won
        golf_round.halved_holes = halved
        golf_round.winner_team = winner

    db.add(golf_round)
    db.commit()
    db.refresh(golf_round)

    # Update stats for affected players
    if all_affected_player_ids:
        for pid in all_affected_player_ids:
            _update_single_player_golf_stats(db, pid)
        db.commit()
    else:
        _update_golf_stats_for_round(db, golf_round)

    return get_golf_round(golf_round.id, db)


@router.delete("/rounds/{round_id}")
def delete_golf_round(round_id: int, db: Session = Depends(get_db)):
    golf_round = db.get(GolfRound, round_id)
    if not golf_round:
        raise HTTPException(status_code=404, detail="Golf round not found")

    # Track affected players before deletion
    affected_player_ids = [
        p.player_id for p in
        db.query(GolfRoundParticipation).filter(GolfRoundParticipation.round_id == golf_round.id).all()
    ]

    # Delete hole results and participations (cascade should handle this, but be explicit)
    db.query(GolfHoleResult).filter(GolfHoleResult.round_id == golf_round.id).delete()
    db.query(GolfRoundParticipation).filter(GolfRoundParticipation.round_id == golf_round.id).delete()
    db.delete(golf_round)
    db.commit()

    # Recalculate stats for affected players
    for pid in affected_player_ids:
        _update_single_player_golf_stats(db, pid)
    db.commit()

    return {"message": "Golf round deleted successfully"}


def _calculate_par_type_stats(db: Session, player_id: int) -> dict:
    """Calculate holes won/lost broken down by par type (3, 4, 5) for a player."""
    participations = db.query(GolfRoundParticipation).filter(
        GolfRoundParticipation.player_id == player_id
    ).all()

    par_stats = {3: {'won': 0, 'lost': 0}, 4: {'won': 0, 'lost': 0}, 5: {'won': 0, 'lost': 0}}

    for participation in participations:
        hole_results = db.query(GolfHoleResult).filter(
            GolfHoleResult.round_id == participation.round_id,
            GolfHoleResult.par.isnot(None),
        ).all()

        for hole in hole_results:
            par = hole.par
            if par not in (3, 4, 5):
                continue
            if hole.winner_team == participation.team_number:
                par_stats[par]['won'] += 1
            elif hole.winner_team is not None:
                par_stats[par]['lost'] += 1

    def to_stat(d):
        total = d['won'] + d['lost']
        return GolfParTypeStat(
            won=d['won'],
            lost=d['lost'],
            win_percentage=round(d['won'] / total * 100, 1) if total > 0 else 0.0,
        )

    return {3: to_stat(par_stats[3]), 4: to_stat(par_stats[4]), 5: to_stat(par_stats[5])}


@router.get("/stats/", response_model=List[GolfPlayerStats])
def get_golf_leaderboard(db: Session = Depends(get_db)):
    """Get all players who have played golf, ranked by win percentage"""
    players = db.query(Player).filter(Player.golf_rounds_played > 0).order_by(
        Player.golf_win_percentage.desc(),
        Player.golf_rounds_played.desc(),
    ).all()

    result = []
    for player in players:
        # Get recent rounds
        recent_round_ids = db.query(GolfRoundParticipation.round_id).filter(
            GolfRoundParticipation.player_id == player.id
        ).all()
        recent_round_ids = [r[0] for r in recent_round_ids]

        recent_rounds = db.query(GolfRound).filter(
            GolfRound.id.in_(recent_round_ids)
        ).order_by(GolfRound.played_at.desc()).limit(5).all()

        recent_summaries = [_build_round_summary(db, r) for r in recent_rounds]
        par_breakdown = _calculate_par_type_stats(db, player.id)

        result.append(GolfPlayerStats(
            id=player.id,
            name=player.name,
            golf_rounds_played=player.golf_rounds_played,
            golf_rounds_won=player.golf_rounds_won,
            golf_rounds_lost=player.golf_rounds_lost,
            golf_rounds_drawn=player.golf_rounds_drawn,
            golf_holes_won=player.golf_holes_won,
            golf_holes_lost=player.golf_holes_lost,
            golf_win_percentage=player.golf_win_percentage,
            par3=par_breakdown[3],
            par4=par_breakdown[4],
            par5=par_breakdown[5],
            recent_rounds=recent_summaries,
        ))

    return result


@router.get("/stats/{player_id}", response_model=GolfPlayerStats)
def get_player_golf_stats(player_id: int, db: Session = Depends(get_db)):
    """Get detailed golf stats for a specific player"""
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get recent rounds
    recent_round_ids = db.query(GolfRoundParticipation.round_id).filter(
        GolfRoundParticipation.player_id == player.id
    ).all()
    recent_round_ids = [r[0] for r in recent_round_ids]

    recent_rounds = db.query(GolfRound).filter(
        GolfRound.id.in_(recent_round_ids)
    ).order_by(GolfRound.played_at.desc()).limit(10).all()

    recent_summaries = [_build_round_summary(db, r) for r in recent_rounds]
    par_breakdown = _calculate_par_type_stats(db, player.id)

    return GolfPlayerStats(
        id=player.id,
        name=player.name,
        golf_rounds_played=player.golf_rounds_played,
        golf_rounds_won=player.golf_rounds_won,
        golf_rounds_lost=player.golf_rounds_lost,
        golf_rounds_drawn=player.golf_rounds_drawn,
        golf_holes_won=player.golf_holes_won,
        golf_holes_lost=player.golf_holes_lost,
        golf_win_percentage=player.golf_win_percentage,
        par3=par_breakdown[3],
        par4=par_breakdown[4],
        par5=par_breakdown[5],
        recent_rounds=recent_summaries,
    )
