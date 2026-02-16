"""Requirement specification models."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RequirementType(str, Enum):
    """Types of requirements."""
    FUNCTIONAL = "functional"
    NON_FUNCTIONAL = "non_functional"
    TECHNICAL = "technical"
    BUSINESS = "business"
    CONSTRAINT = "constraint"


class RequirementPriority(str, Enum):
    """Requirement priority."""
    MUST_HAVE = "must_have"
    SHOULD_HAVE = "should_have"
    COULD_HAVE = "could_have"
    WONT_HAVE = "wont_have"


class Requirement(BaseModel):
    """A single requirement."""
    requirement_id: str
    type: RequirementType
    priority: RequirementPriority
    
    description: str
    rationale: Optional[str] = None
    
    # Acceptance criteria
    acceptance_criteria: List[str] = Field(default_factory=list)
    
    # Confidence in this requirement
    confidence: float = Field(ge=0.0, le=1.0)
    
    # Source tracking
    derived_from_turns: List[int] = Field(default_factory=list)
    
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RequirementSpecification(BaseModel):
    """Complete requirements specification."""
    session_id: UUID
    
    # Classification
    domain: str
    sub_domain: Optional[str] = None
    problem_category: str
    
    # Requirements
    requirements: List[Requirement]
    
    # User stories
    user_stories: List[str] = Field(default_factory=list)
    
    # Use cases
    use_cases: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Technical constraints
    technical_constraints: List[str] = Field(default_factory=list)
    
    # Success criteria from original design
    success_criteria: List[str] = Field(default_factory=list)
    
    # Confidence metrics
    overall_confidence: float = Field(ge=0.0, le=1.0)
    completeness_score: float = Field(ge=0.0, le=1.0)
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    generated_by: str = "clarification_agent"
    
    # Summary
    executive_summary: Optional[str] = None
    
    class Config:
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat(),
        }