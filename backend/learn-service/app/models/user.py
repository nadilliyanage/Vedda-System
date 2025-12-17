from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class User:
    id: str
    username: str
    email: str
    role: str
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None