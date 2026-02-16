"""Question and response models."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    """Types of clarifying questions."""
    OPEN_ENDED = "open_ended"
    MULTIPLE_CHOICE = "multiple_choice"
    YES_NO = "yes_no"
    SCALE = "scale"
    FOLLOW_UP = "follow_up"


class QuestionPriority(str, Enum):
    """Question priority levels."""
    CRITICAL = "critical"  # Must be answered
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Question(BaseModel):
    """A clarifying question."""
    question_id: str
    text: str
    question_type: QuestionType
    priority: QuestionPriority = QuestionPriority.MEDIUM
    
    # For multiple choice questions
    options: Optional[List[str]] = None
    
    # Context about why this question is being asked
    rationale: Optional[str] = None
    
    # What information gap this addresses
    targets: List[str] = Field(default_factory=list)
    
    # Expected information value (0-1)
    information_value: float = Field(default=0.5, ge=0.0, le=1.0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UserResponse(BaseModel):
    """User's response to a question."""
    question_id: str
    response_text: str
    
    # For structured responses
    selected_option: Optional[str] = None
    scale_value: Optional[int] = None
    
    # Analysis
    informativeness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    contains_new_info: bool = True
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class QuestionBatch(BaseModel):
    """Batch of related questions."""
    batch_id: str
    questions: List[Question]
    
    # Instructions for presenting questions
    introduction: Optional[str] = None
    ask_sequentially: bool = True
    
    created_at: datetime = Field(default_factory=datetime.utcnow)