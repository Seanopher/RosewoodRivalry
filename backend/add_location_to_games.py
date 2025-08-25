#!/usr/bin/env python3
"""
Migration script to add location column to games table
"""

from sqlalchemy import text
from app.database import engine

def add_location_column():
    """Add location column to games table"""
    try:
        with engine.connect() as connection:
            # Add the location column
            connection.execute(text("""
                ALTER TABLE games 
                ADD COLUMN location VARCHAR(100);
            """))
            connection.commit()
            print("✅ Successfully added location column to games table")
            
    except Exception as e:
        print(f"❌ Error adding location column: {e}")
        # If column already exists, that's ok
        if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
            print("✅ Location column already exists")
        else:
            raise

if __name__ == "__main__":
    print("Adding location column to games table...")
    add_location_column()
    print("Migration complete!")