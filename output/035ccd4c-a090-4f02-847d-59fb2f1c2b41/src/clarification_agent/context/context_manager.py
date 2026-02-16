"""Context and state management."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

from ..models.session import (
    ConversationTurn,
    ExtractedFact,
    IntentClassification,
    SessionState,
    SessionStatus
)
from ..observability.logger import LoggerMixin
from .state_store import StateStore


class ContextManager(LoggerMixin):
    """Manages conversation context and session state."""
    
    def __init__(self, state_store: StateStore):
        """Initialize context manager.
        
        Args:
            state_store: State persistence backend
        """
        self.state_store = state_store
    
    async def create_session(
        self,
        initial_input: str,
        max_turns: int = 10,
        confidence_threshold: float = 0.75
    ) -> SessionState:
        """Create a new clarification session.
        
        Args:
            initial_input: User's initial input
            max_turns: Maximum conversation turns allowed
            confidence_threshold: Confidence threshold for completion
            
        Returns:
            New session state
        """
        session = SessionState(
            status=SessionStatus.ACTIVE,
            max_turns=max_turns,
            confidence_threshold=confidence_threshold,
            expires_at=datetime.utcnow() + timedelta(minutes=30)
        )
        
        # Add initial turn
        turn = ConversationTurn(
            turn_number=0,
            speaker="user",
            message=initial_input
        )
        session.turns.append(turn)
        
        await self.state_store.save_session(session)
        
        self.log_event(
            "session_created",
            session_id=str(session.session_id),
            initial_input_length=len(initial_input)
        )
        
        return session
    
    async def get_session(self, session_id: UUID) -> Optional[SessionState]:
        """Get session by ID.
        
        Args:
            session_id: Session UUID
            
        Returns:
            Session state or None if not found
        """
        return await self.state_store.load_session(session_id)
    
    async def add_turn(
        self,
        session_id: UUID,
        speaker: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SessionState:
        """Add a conversation turn.
        
        Args:
            session_id: Session UUID
            speaker: "agent" or "user"
            message: Turn message
            metadata: Optional metadata
            
        Returns:
            Updated session state
            
        Raises:
            ValueError: If session not found
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        turn = ConversationTurn(
            turn_number=len(session.turns),
            speaker=speaker,
            message=message,
            metadata=metadata or {}
        )
        session.turns.append(turn)
        
        # Extend TTL on activity
        await self.state_store.extend_session_ttl(session_id, 1800)
        
        await self.state_store.save_session(session)
        
        self.log_event(
            "turn_added",
            session_id=str(session_id),
            turn_number=turn.turn_number,
            speaker=speaker
        )
        
        return session
    
    async def update_facts(
        self,
        session_id: UUID,
        facts: List[ExtractedFact]
    ) -> SessionState:
        """Update extracted facts.
        
        Args:
            session_id: Session UUID
            facts: List of extracted facts
            
        Returns:
            Updated session state
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        for fact in facts:
            # Update or add fact
            if fact.key in session.facts:
                # Keep higher confidence value
                existing = session.facts[fact.key]
                if fact.confidence > existing.confidence:
                    session.facts[fact.key] = fact
            else:
                session.facts[fact.key] = fact
        
        await self.state_store.save_session(session)
        
        self.log_event(
            "facts_updated",
            session_id=str(session_id),
            facts_count=len(facts)
        )
        
        return session
    
    async def update_intent(
        self,
        session_id: UUID,
        intent: IntentClassification
    ) -> SessionState:
        """Update intent classification.
        
        Args:
            session_id: Session UUID
            intent: Intent classification
            
        Returns:
            Updated session state
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        session.intent = intent
        
        await self.state_store.save_session(session)
        
        self.log_event(
            "intent_updated",
            session_id=str(session_id),
            domain=intent.domain,
            confidence=intent.confidence
        )
        
        return session
    
    async def update_confidence(
        self,
        session_id: UUID,
        overall_confidence: float,
        clarity_score: Optional[float] = None
    ) -> SessionState:
        """Update confidence scores.
        
        Args:
            session_id: Session UUID
            overall_confidence: Overall confidence score
            clarity_score: Optional clarity score
            
        Returns:
            Updated session state
        """
        session = await self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        session.overall_confidence = overall_confidence
        if clarity_score is not None:
            session.clarity_score = clarity_score
        
        await self.state_store.save_session(session)
        
        return session
    
    def get_conversation_history(self, session: SessionState) -> List[Dict[str, str]]:
        """Get formatted conversation history.
        
        Args:
            session: Session state
            
        Returns:
            List of conversation turns
        """
        return [
            {
                "speaker": turn.speaker,
                "message": turn.message,
                "turn_number": turn.turn_number
            }
            for turn in session.turns
        ]