from datetime import datetime, timedelta

def est_now():
    """Returns current datetime in Eastern Time (EST/EDT) as naive datetime"""
    # The system is showing local time, not UTC
    # We want to store the actual local time as-is
    return datetime.now()

def utc_to_est(utc_dt):
    """Convert UTC datetime to Eastern Time"""
    if utc_dt.tzinfo is not None:
        utc_dt = utc_dt.replace(tzinfo=None)
    return utc_dt - timedelta(hours=4)  # EDT offset