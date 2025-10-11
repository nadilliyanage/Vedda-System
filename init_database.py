#!/usr/bin/env python3
"""
Simple script to initialize the database
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import init_db

if __name__ == '__main__':
    print("🔄 Initializing database...")
    init_db()
    print("✅ Database initialized successfully!")