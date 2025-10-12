#!/usr/bin/env python3
"""Check database structure"""

import sqlite3

def check_db_structure():
    conn = sqlite3.connect('vedda_translator.db')
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("📋 Available tables:")
    for table in tables:
        print(f"  - {table[0]}")
        
        # Get table structure
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        print(f"    Columns: {[col[1] for col in columns]}")
        
        # Get record count
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"    Records: {count}")
        print()
    
    conn.close()

if __name__ == "__main__":
    check_db_structure()