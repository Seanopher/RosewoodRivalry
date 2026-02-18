import os
import httpx
from sqlalchemy.orm import Session
from app.models import GolfCourse, GolfCourseTee, GolfCourseTeeHole

API_BASE_URL = "https://api.golfcourseapi.com/v1"


def _get_api_key() -> str:
    key = os.getenv("GOLF_COURSE_API_KEY", "")
    if not key:
        from dotenv import load_dotenv
        load_dotenv()
        key = os.getenv("GOLF_COURSE_API_KEY", "")
    return key


def _get_headers() -> dict:
    return {"Authorization": f"Key {_get_api_key()}"}


def search_courses(query: str) -> list[dict]:
    """Search GolfCourseAPI for courses matching query string."""
    with httpx.Client(timeout=10) as client:
        resp = client.get(
            f"{API_BASE_URL}/search",
            params={"search_query": query},
            headers=_get_headers(),
        )
        resp.raise_for_status()
        data = resp.json()
    return data.get("courses", [])


def get_or_cache_course(api_id: int, db: Session) -> GolfCourse:
    """Return cached course from DB, or fetch from API and cache it."""
    existing = db.query(GolfCourse).filter(GolfCourse.api_id == api_id).first()
    if existing:
        return existing

    # Fetch from API
    with httpx.Client(timeout=10) as client:
        resp = client.get(
            f"{API_BASE_URL}/courses/{api_id}",
            headers=_get_headers(),
        )
        resp.raise_for_status()
        data = resp.json()

    course_data = data.get("course", data)

    location = course_data.get("location", {}) or {}
    db_course = GolfCourse(
        api_id=api_id,
        club_name=course_data.get("club_name", ""),
        course_name=course_data.get("course_name", ""),
        address=location.get("address"),
        city=location.get("city"),
        state=location.get("state"),
        country=location.get("country"),
        latitude=location.get("lat"),
        longitude=location.get("lng"),
    )
    db.add(db_course)
    db.flush()  # Get the id

    # Cache tee sets
    tees_data = course_data.get("tees", {}) or {}
    for gender in ("male", "female"):
        for tee_set in tees_data.get(gender, []):
            db_tee = GolfCourseTee(
                course_id=db_course.id,
                tee_name=tee_set.get("tee_name", "Unknown"),
                gender=gender,
                course_rating=tee_set.get("course_rating"),
                slope_rating=tee_set.get("slope_rating"),
                total_yards=tee_set.get("total_yards"),
                par_total=tee_set.get("par_total"),
            )
            db.add(db_tee)
            db.flush()

            for idx, hole in enumerate(tee_set.get("holes", [])):
                db.add(GolfCourseTeeHole(
                    tee_id=db_tee.id,
                    hole_number=idx + 1,  # API returns ordered array, no explicit number field
                    par=hole.get("par", 0),
                    yardage=hole.get("yardage", 0),
                    handicap=hole.get("handicap"),
                ))

    db.commit()
    db.refresh(db_course)
    return db_course
