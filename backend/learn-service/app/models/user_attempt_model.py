from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class UserAttempt:
    """Model for tracking user exercise attempts."""
    user_id: str
    exercise_id: str
    skill_tags: List[str]
    is_correct: bool
    error_type: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self):
        """Convert the model to a dictionary for MongoDB storage."""
        return {
            "user_id": self.user_id,
            "exercise_id": self.exercise_id,
            "skill_tags": self.skill_tags,
            "is_correct": self.is_correct,
            "error_type": self.error_type,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create a UserAttempt instance from a dictionary."""
        return cls(
            user_id=data.get("user_id"),
            exercise_id=data.get("exercise_id"),
            skill_tags=data.get("skill_tags", []),
            is_correct=data.get("is_correct", False),
            error_type=data.get("error_type"),
            timestamp=data.get("timestamp", datetime.utcnow())
        )
