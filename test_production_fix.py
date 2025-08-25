#!/usr/bin/env python3
"""
Test script for production timestamp fix - subtract 4 hours from ALL games.
This assumes all games in production are stored in UTC and need to be converted to EST.
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import SessionLocal
from app.models import Game
from datetime import datetime, timedelta
from sqlalchemy import text

def test_production_fix():
    db = SessionLocal()
    try:
        print("=== PRODUCTION TIMESTAMP FIX PREVIEW ===")
        print("This will subtract 4 hours from ALL games (UTC to EST conversion)")
        print()
        
        # Test query to see ALL games that would be affected
        print("ALL games will be updated:")
        print("ID | Current Timestamp        | New Timestamp (- 4 hours)")
        print("-" * 65)
        
        # Use raw SQL to test the logic for ALL games
        result = db.execute(text("""
            SELECT id, played_at, played_at - INTERVAL '4 hours' AS new_played_at
            FROM games 
            ORDER BY id
        """))
        
        total_count = 0
        for row in result:
            total_count += 1
            print(f"{row.id:2d} | {row.played_at} | {row.new_played_at}")
        
        print(f"\nTotal games to be updated: {total_count}")
        
        # Show any games that might become problematic (negative dates, etc.)
        print("\nChecking for any potential issues...")
        result2 = db.execute(text("""
            SELECT id, played_at, played_at - INTERVAL '4 hours' AS new_played_at
            FROM games 
            WHERE played_at - INTERVAL '4 hours' < '1900-01-01'
            ORDER BY id
        """))
        
        problem_count = 0
        for row in result2:
            problem_count += 1
            print(f"WARNING: Game {row.id} would become {row.new_played_at}")
        
        if problem_count == 0:
            print("SUCCESS: No problematic dates found - all conversions look safe")
        
        return total_count
        
    finally:
        db.close()

if __name__ == "__main__":
    total = test_production_fix()
    print(f"\n=== PRODUCTION SUMMARY ===")
    print(f"Ready to fix ALL {total} games")
    print("\nFor production database, run this UPDATE query:")
    print("UPDATE games SET played_at = played_at - INTERVAL '4 hours';")
    print("\nWARNING: This will affect ALL games in the database!")
    print("WARNING: Make sure to backup the database first!")