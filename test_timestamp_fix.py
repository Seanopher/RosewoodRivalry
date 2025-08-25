#!/usr/bin/env python3
"""
Safe test script to preview the timestamp fix before applying it.
This script will show which games would be affected and what their new timestamps would be.
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal
from app.models import Game
from datetime import datetime, timedelta
from sqlalchemy import text

def test_timestamp_fix():
    db = SessionLocal()
    try:
        print("=== TIMESTAMP FIX PREVIEW ===")
        print("Current time:", datetime.now())
        print()
        
        # Test query to see what would be affected
        print("Games that would be updated (UTC timestamps >= 20:00:00 today):")
        print("ID | Current Timestamp        | New Timestamp (- 4 hours)")
        print("-" * 65)
        
        # Use raw SQL to test the logic
        result = db.execute(text("""
            SELECT id, played_at, played_at - INTERVAL '4 hours' AS new_played_at
            FROM games 
            WHERE played_at >= '2025-08-24 20:00:00' 
            ORDER BY id
        """))
        
        affected_count = 0
        for row in result:
            affected_count += 1
            print(f"{row.id:2d} | {row.played_at} | {row.new_played_at}")
        
        print(f"\nTotal games to be updated: {affected_count}")
        
        print("\nGames that would NOT be updated (already correct timestamps):")
        result2 = db.execute(text("""
            SELECT id, played_at 
            FROM games 
            WHERE played_at < '2025-08-24 20:00:00' 
            ORDER BY id
        """))
        
        safe_count = 0
        for row in result2:
            safe_count += 1
            print(f"{row.id:2d} | {row.played_at} (SAFE - no change)")
        
        print(f"\nTotal games left unchanged: {safe_count}")
        
        return affected_count
        
    finally:
        db.close()

if __name__ == "__main__":
    affected = test_timestamp_fix()
    print(f"\n=== SUMMARY ===")
    print(f"Ready to fix {affected} games")
    print("\nIf this looks correct, run the UPDATE query:")
    print("UPDATE games SET played_at = played_at - INTERVAL '4 hours' WHERE played_at >= '2025-08-24 20:00:00';")