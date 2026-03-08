"""
Export vedda_knowledge collection → exported_knowledge/vedda_knowledge.md
Each document is rendered as a fenced JSON block.
Reads MONGODB_URI and MONGODB_DB_NAME from .env (or environment).
"""

import json
import os
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URI = os.environ["MONGODB_URI"]
DB_NAME   = os.environ.get("MONGODB_DB_NAME", "vedda-system")
COLL_NAME = "vedda_knowledge"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "exported_knowledge")
OUTPUT_MD  = os.path.join(OUTPUT_DIR, "vedda_knowledge.md")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class _Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def main():
    print(f"Connecting to MongoDB ({DB_NAME}) …")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    client.admin.command("ping")

    docs = list(client[DB_NAME][COLL_NAME].find({}))
    print(f"Found {len(docs)} documents in {COLL_NAME}")

    lines = [
        "# Vedda Knowledge Base",
        "",
        f"> Collection: `{COLL_NAME}`  |  Database: `{DB_NAME}`  |  Documents: **{len(docs)}**",
        "",
        "---",
        "",
    ]

    EMBEDDING_KEYS = {"embedding", "content_embedding", "sparse_embedding", "vector"}

    for i, doc in enumerate(docs, start=1):
        # convert ObjectId / datetime to strings
        clean = json.loads(json.dumps(doc, cls=_Encoder))
        # strip embedding / vector fields
        for key in EMBEDDING_KEYS:
            clean.pop(key, None)
        label = clean.get("id") or str(clean.get("_id", f"doc-{i}"))
        lines.append(f"## {i}. {label}")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(clean, indent=2, ensure_ascii=False))
        lines.append("```")
        lines.append("")

    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Written → {OUTPUT_MD}")


if __name__ == "__main__":
    main()
