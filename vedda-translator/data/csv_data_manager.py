#!/usr/bin/env python3
"""
CSV-based Vedda Dictionary Data Manager
Supports loading, updating, and training from CSV files
"""
import sqlite3
import csv
import json
import os
import pandas as pd
from datetime import datetime

DATABASE = 'vedda_translator.db'
CSV_FILE = 'vedda_dictionary.csv'

class VeddaDataManager:
    def __init__(self, csv_file=CSV_FILE, db_file=DATABASE):
        self.csv_file = csv_file
        self.db_file = db_file
    
    def load_csv_data(self):
        """Load dictionary data from CSV file"""
        try:
            df = pd.read_csv(self.csv_file)
            print(f"📊 Loaded {len(df)} entries from {self.csv_file}")
            
            # Validate required columns
            required_columns = ['vedda_word', 'sinhala_word', 'english_word', 
                              'vedda_ipa', 'sinhala_ipa', 'english_ipa', 
                              'word_type', 'usage_example']
            
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                print(f"❌ Missing columns: {missing_columns}")
                return None
            
            # Convert to list of dictionaries
            data = df.to_dict('records')
            
            # Clean and validate data
            cleaned_data = []
            for i, row in enumerate(data):
                if pd.isna(row['vedda_word']) or pd.isna(row['english_word']):
                    print(f"⚠️  Skipping row {i+2}: Missing required fields")
                    continue
                
                # Clean IPA fields (handle NaN values)
                for ipa_field in ['vedda_ipa', 'sinhala_ipa', 'english_ipa']:
                    if pd.isna(row[ipa_field]):
                        row[ipa_field] = ''
                
                cleaned_data.append(row)
            
            print(f"✅ Cleaned data: {len(cleaned_data)} valid entries")
            return cleaned_data
            
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            return None
    
    def create_database_schema(self):
        """Create or update database schema"""
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        # Create enhanced dictionary table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dictionary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vedda_word TEXT NOT NULL,
                sinhala_word TEXT,
                english_word TEXT,
                vedda_ipa TEXT,
                sinhala_ipa TEXT,
                english_ipa TEXT,
                word_type TEXT,
                usage_example TEXT,
                frequency_score REAL DEFAULT 1.0,
                confidence_score REAL DEFAULT 1.0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT DEFAULT 'csv_import',
                UNIQUE(vedda_word, english_word)
            )
        ''')
        
        # Create training history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                entries_added INTEGER,
                entries_updated INTEGER,
                csv_file TEXT,
                notes TEXT
            )
        ''')
        
        # Create word statistics table
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
        
        conn.commit()
        conn.close()
        print("✅ Database schema created/updated")
    
    def import_csv_to_database(self, update_existing=True):
        """Import CSV data to database with training capabilities"""
        # Load CSV data
        csv_data = self.load_csv_data()
        if not csv_data:
            return False
        
        # Create/update schema
        self.create_database_schema()
        
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        entries_added = 0
        entries_updated = 0
        
        for entry in csv_data:
            try:
                if update_existing:
                    # Try to update existing entry first
                    cursor.execute('''
                        UPDATE dictionary 
                        SET sinhala_word=?, vedda_ipa=?, sinhala_ipa=?, english_ipa=?,
                            word_type=?, usage_example=?, last_updated=datetime("now"),
                            source='csv_update'
                        WHERE vedda_word=? AND english_word=?
                    ''', (
                        entry['sinhala_word'], entry['vedda_ipa'], entry['sinhala_ipa'],
                        entry['english_ipa'], entry['word_type'], entry['usage_example'],
                        entry['vedda_word'], entry['english_word']
                    ))
                    
                    if cursor.rowcount > 0:
                        entries_updated += 1
                        continue
                
                # Insert new entry
                cursor.execute('''
                    INSERT OR IGNORE INTO dictionary 
                    (vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, 
                     english_ipa, word_type, usage_example, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'csv_import')
                ''', (
                    entry['vedda_word'], entry['sinhala_word'], entry['english_word'],
                    entry['vedda_ipa'], entry['sinhala_ipa'], entry['english_ipa'],
                    entry['word_type'], entry['usage_example']
                ))
                
                if cursor.rowcount > 0:
                    entries_added += 1
                    
            except Exception as e:
                print(f"⚠️  Error importing entry {entry['vedda_word']}: {e}")
                continue
        
        # Record training history
        cursor.execute('''
            INSERT INTO training_history 
            (entries_added, entries_updated, csv_file, notes)
            VALUES (?, ?, ?, ?)
        ''', (
            entries_added, entries_updated, self.csv_file,
            f"CSV import: {entries_added} added, {entries_updated} updated"
        ))
        
        conn.commit()
        conn.close()
        
        print(f"\n🎯 Training Results:")
        print(f"   📥 Entries added: {entries_added}")
        print(f"   🔄 Entries updated: {entries_updated}")
        print(f"   📁 Total processed: {len(csv_data)}")
        
        return True
    
    def export_database_to_csv(self, output_file=None):
        """Export current database to CSV"""
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f'vedda_dictionary_export_{timestamp}.csv'
        
        conn = sqlite3.connect(self.db_file)
        
        query = '''
            SELECT vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, 
                   english_ipa, word_type, usage_example, frequency_score, 
                   confidence_score, last_updated, source
            FROM dictionary 
            ORDER BY vedda_word
        '''
        
        df = pd.read_sql_query(query, conn)
        df.to_csv(output_file, index=False, encoding='utf-8-sig')
        conn.close()
        
        print(f"✅ Database exported to: {output_file}")
        return output_file
    
    def get_statistics(self):
        """Get training and usage statistics"""
        conn = sqlite3.connect(self.db_file)
        cursor = conn.cursor()
        
        # Dictionary statistics
        cursor.execute('SELECT COUNT(*) FROM dictionary')
        total_entries = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT word_type) FROM dictionary WHERE word_type IS NOT NULL')
        word_types = cursor.fetchone()[0]
        
        cursor.execute('SELECT word_type, COUNT(*) FROM dictionary GROUP BY word_type ORDER BY COUNT(*) DESC')
        type_breakdown = cursor.fetchall()
        
        # Training history
        cursor.execute('SELECT COUNT(*) FROM training_history')
        training_sessions = cursor.fetchone()[0]
        
        cursor.execute('SELECT MAX(training_date) FROM training_history')
        last_training = cursor.fetchone()[0]
        
        conn.close()
        
        stats = {
            'total_entries': total_entries,
            'word_types': word_types,
            'type_breakdown': type_breakdown,
            'training_sessions': training_sessions,
            'last_training': last_training
        }
        
        return stats
    
    def print_statistics(self):
        """Print formatted statistics"""
        stats = self.get_statistics()
        
        print("\n📊 Vedda Dictionary Statistics")
        print("=" * 40)
        print(f"📖 Total entries: {stats['total_entries']}")
        print(f"🏷️  Word types: {stats['word_types']}")
        print(f"🎓 Training sessions: {stats['training_sessions']}")
        print(f"📅 Last updated: {stats['last_training'] or 'Never'}")
        
        print(f"\n📈 Word Type Breakdown:")
        for word_type, count in stats['type_breakdown']:
            if word_type:
                print(f"   {word_type}: {count}")

def main():
    """Main function for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Vedda Dictionary Data Manager')
    parser.add_argument('--import', '-i', action='store_true', help='Import CSV to database')
    parser.add_argument('--export', '-e', action='store_true', help='Export database to CSV')
    parser.add_argument('--stats', '-s', action='store_true', help='Show statistics')
    parser.add_argument('--csv-file', default=CSV_FILE, help='CSV file path')
    parser.add_argument('--db-file', default=DATABASE, help='Database file path')
    
    args = parser.parse_args()
    
    manager = VeddaDataManager(args.csv_file, args.db_file)
    
    if getattr(args, 'import'):
        manager.import_csv_to_database()
    elif args.export:
        manager.export_database_to_csv()
    elif args.stats:
        manager.print_statistics()
    else:
        # Default: import CSV data
        print("🚀 Starting CSV import...")
        manager.import_csv_to_database()
        manager.print_statistics()

if __name__ == "__main__":
    main()