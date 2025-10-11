#!/usr/bin/env python3
"""
Database migration script to update schema for CSV data management
"""
import sqlite3
import os

DATABASE = 'vedda_translator.db'

def migrate_database():
    """Migrate existing database to new schema"""
    print("🔄 Starting database migration...")
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Check current schema
    cursor.execute("PRAGMA table_info(dictionary)")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"📋 Current columns: {columns}")
    
    # Add new columns if they don't exist
    new_columns = [
        ('frequency_score', 'REAL DEFAULT 1.0'),
        ('confidence_score', 'REAL DEFAULT 1.0'), 
        ('source', 'TEXT DEFAULT "original"')
    ]
    
    for column_name, column_def in new_columns:
        if column_name not in columns:
            try:
                cursor.execute(f'ALTER TABLE dictionary ADD COLUMN {column_name} {column_def}')
                print(f"✅ Added column: {column_name}")
            except Exception as e:
                print(f"⚠️  Column {column_name} might already exist: {e}")
    
    # Handle last_updated column separately (SQLite limitation with CURRENT_TIMESTAMP)
    if 'last_updated' not in columns:
        try:
            cursor.execute('ALTER TABLE dictionary ADD COLUMN last_updated TEXT')
            cursor.execute('UPDATE dictionary SET last_updated = datetime("now") WHERE last_updated IS NULL')
            print("✅ Added column: last_updated")
        except Exception as e:
            print(f"⚠️  Column last_updated might already exist: {e}")
    
    # Create new tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS training_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            entries_added INTEGER,
            entries_updated INTEGER,
            csv_file TEXT,
            backup_file TEXT,
            notes TEXT
        )
    ''')
    print("✅ Created training_history table")
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS word_statistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            word_type TEXT,
            translation_count INTEGER DEFAULT 0,
            success_rate REAL DEFAULT 1.0,
            last_used TIMESTAMP,
            UNIQUE(word)
        )
    ''')
    print("✅ Created word_statistics table")
    
    # Update existing entries with new fields
    cursor.execute('''
        UPDATE dictionary 
        SET source = 'original'
        WHERE source IS NULL OR source = ""
    ''')
    
    cursor.execute('''
        UPDATE dictionary 
        SET last_updated = datetime("now")
        WHERE last_updated IS NULL OR last_updated = ""
    ''')
    
    conn.commit()
    conn.close()
    print("🎉 Database migration completed!")

if __name__ == "__main__":
    migrate_database()