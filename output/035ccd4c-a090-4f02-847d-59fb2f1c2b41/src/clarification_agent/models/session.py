"""Session state models."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class SessionStatus(str, Enum):
    """Session lifecycle status."""
    INITIALIZING = "initializing"
    ACTIVE = "active"
    WAITING_RESPONSE = "waiting_response"
    COMPLETED = "completed"
    EXPIRED = "expired"
    ERROR = "error"


class ExtractedFact(BaseModel):
    """A fact extracted from conversation."""
    key: str
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    source_turn: int
    extracted_at: datetime = Field(default_factory=datetime.utcnow)


class ConversationTurn(BaseModel):
    """Single turn in conversation."""
    turn_number: int
    speaker: str  # "agent" or "user"
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IntentClassification(BaseModel):
    """Intent classification result."""
    domain: str
    sub_domain: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    categories: List[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SessionState(BaseModel):
    """Complete session state."""
    session_id: UUID = Field(default_factory=uuid4)
    status: SessionStatus = SessionStatus.INITIALIZING
    
    # Conversation history
    turns: List[ConversationTurn] = Field(default_factory=list)
    
    # Extracted information
    facts: Dict[str, ExtractedFact] = Field(default_factory=dict)
    requirements: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    
    # Classification
    intent: Optional[IntentClassification] = None
    
    # Confidence tracking
    overall_confidence: float = 0.0
    clarity_score: float = 0.0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    # Configuration
    max_turns: int = 10
    confidence_threshold: float = 0.75
    
    class Config:
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat(),
        }