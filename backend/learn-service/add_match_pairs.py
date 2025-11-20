import os
from pymongo import MongoClient

MONGODB_URI = "mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGODB_URI)
db = client['vedda-system']
challenges_collection = db['challenges']

# Add match_pairs challenges
match_challenges = [
    {
        "id": "mp1",
        "type": "match_pairs",
        "prompt": "Match the Vedda words with their English meanings",
        "pairs": [
            {"left": "ගස (gasa)", "right": "tree"},
            {"left": "වතුර (vatura)", "right": "water"},
            {"left": "කන්ද (kanda)", "right": "mountain"}
        ],
        "xp": 25,
        "coins": 5,
        "timeLimitSec": 60
    },
    {
            {"left": "එක (eka)", "right": "one"},
            {"left": "දෙක (deka)", "right": "two"},
            {"left": "තුන (thuna)", "right": "three"},
            {"left": "හතර (hathara)", "right": "four"}
        ],
        "xp": 30,
        "coins": 6,
        "timeLimitSec": 60
    }
]

result = challenges_collection.insert_many(match_challenges)
print(f"Added {len(result.inserted_ids)} match_pairs challenges to MongoDB")
print(f"Total challenges: {challenges_collection.count_documents({})}")
