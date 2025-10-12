#!/usr/bin/env python3
"""Script to check and update database with CSV data"""

import sqlite3
import csv
import os
from datetime import datetime

def get_latest_words_from_csv(csv_path, limit=10):
    """Get the latest words from CSV file (last N entries)"""
    with open(csv_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        records = list(csv_reader)
        # Return last N records (assuming newer entries are at the bottom)
        return records[-limit:] if len(records) > limit else records

def check_and_update_database():
    """Check database and update with CSV data if needed"""
    
    db_path = 'vedda_translator.db'
    csv_path = 'vedda_dictionary.csv'
    
    print("🔍 Checking database and CSV synchronization...")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Count current records in database
    cursor.execute("SELECT COUNT(*) FROM dictionary")
    db_count = cursor.fetchone()[0]
    print(f"📊 Current database records: {db_count}")
    
    # Count CSV records
    with open(csv_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        csv_records = list(csv_reader)
        csv_count = len(csv_records)
    
    print(f"📊 CSV file records: {csv_count}")
    
    if db_count != csv_count:
        print(f"⚠️  Database ({db_count}) and CSV ({csv_count}) are out of sync!")
        print("🔄 Updating database with CSV data...")
        
        # Get current words in database before update
        cursor.execute("SELECT vedda_word FROM dictionary")
        existing_words = set(row[0] for row in cursor.fetchall())
        
        # Get words from CSV
        csv_words = set(record['vedda_word'] for record in csv_records)
        
        # Find new words (in CSV but not in database)
        new_words = csv_words - existing_words
        
        # Clear existing data
        cursor.execute("DELETE FROM dictionary")
        
        # Insert CSV data
        for i, record in enumerate(csv_records):
            cursor.execute("""
                INSERT INTO dictionary 
                (vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, 
                 english_ipa, word_type, usage_example, frequency_score, 
                 confidence_score, last_updated, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record['vedda_word'],
                record['sinhala_word'], 
                record['english_word'],
                record['vedda_ipa'],
                record['sinhala_ipa'],
                record['english_ipa'],
                record['word_type'],
                record['usage_example'],
                1.0,  # frequency_score
                0.95,  # confidence_score
                datetime.now().isoformat(),
                'csv_import'
            ))
            
            if (i + 1) % 10 == 0:
                print(f"  ✅ Imported {i + 1} records...")
        
        conn.commit()
        print(f"✅ Successfully imported {csv_count} records!")
        
        # Show newly added words from CSV
        if new_words:
            print(f"\n🎯 Newly added words ({len(new_words)} words):")
            for word in sorted(new_words):
                cursor.execute("SELECT vedda_word, sinhala_word, english_word FROM dictionary WHERE vedda_word = ?", (word,))
                result = cursor.fetchone()
                if result:
                    print(f"  ✅ {result[0]} → {result[1]} → {result[2]}")
        else:
            print("\n📋 No new words were added in this update.")
    
    else:
        print("✅ Database and CSV are synchronized!")
        
        # Get all words from CSV to show latest additions
        latest_csv_words = get_latest_words_from_csv(csv_path, 10)
        
        print(f"\n📋 Latest {len(latest_csv_words)} words in CSV:")
        for record in latest_csv_words:
            print(f"  📝 {record['vedda_word']} → {record['sinhala_word']} → {record['english_word']}")
                
        # Show total vocabulary count
        print(f"\n📊 Total vocabulary: {len(csv_records)} words")
    
    conn.close()
    print("\n🎉 Database training completed!")

if __name__ == "__main__":
    check_and_update_database()