"""State persistence abstraction."""
import json
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from uuid import UUID

import redis.asyncio as redis

from ..models.session import SessionState
from ..observability.logger import LoggerMixin


class StateStore(ABC):
    """Abstract state store interface."""
    
    @abstractmethod
    async def save_session(self, session: SessionState) -> None:
        """Save session state."""
        pass
    
    @abstractmethod
    async def load_session(self, session_id: UUID) -> Optional[SessionState]:
        """Load session state."""
        pass
    
    @abstractmethod
    async def delete_session(self, session_id: UUID) -> None:
        """Delete session state."""
        pass
    
    @abstractmethod
    async def session_exists(self, session_id: UUID) -> bool:
        """Check if session exists."""
        pass
    
    @abstractmethod
    async def extend_session_ttl(self, session_id: UUID, ttl_seconds: int) -> None:
        """Extend session TTL."""
        pass


class RedisStateStore(StateStore, LoggerMixin):
    """Redis-based state store with TTL support."""
    
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        key_prefix: str = "clarification:",
        default_ttl_seconds: int = 1800  # 30 minutes
    ):
        """Initialize Redis state store.
        
        Args:
            redis_url: Redis connection URL
            key_prefix: Prefix for all keys
            default_ttl_seconds: Default TTL for sessions
        """
        self.redis_url = redis_url
        self.key_prefix = key_prefix
        self.default_ttl_seconds = default_ttl_seconds
        self._redis: Optional[redis.Redis] = None
    
    async def connect(self) -> None:
        """Connect to Redis."""
        if self._redis is None:
            self._redis = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            self.log_event("redis_connected", url=self.redis_url)
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            self.log_event("redis_disconnected")
    
    def _make_key(self, session_id: UUID) -> str:
        """Generate Redis key for session."""
        return f"{self.key_prefix}{str(session_id)}"
    
    async def save_session(self, session: SessionState) -> None:
        """Save session state to Redis."""
        await self.connect()
        
        key = self._make_key(session.session_id)
        
        # Update timestamp
        session.updated_at = datetime.utcnow()
        
        # Serialize to JSON
        data = session.model_dump_json()
        
        # Save with TTL
        ttl = self.default_ttl_seconds
        if session.expires_at:
            ttl = int((session.expires_at - datetime.utcnow()).total_seconds())
            ttl = max(ttl, 60)  # At least 60 seconds
        
        await self._redis.setex(key, ttl, data)
        
        self.log_event(
            "session_saved",
            session_id=str(session.session_id),
            ttl=ttl
        )
    
    async def load_session(self, session_id: UUID) -> Optional[SessionState]:
        """Load session state from Redis."""
        await self.connect()
        
        key = self._make_key(session_id)
        data = await self._redis.get(key)
        
        if data is None:
            self.log_event("session_not_found", session_id=str(session_id))
            return None
        
        session = SessionState.model_validate_json(data)
        
        self.log_event("session_loaded", session_id=str(session_id))
        return session
    
    async def delete_session(self, session_id: UUID) -> None:
        """Delete session from Redis."""
        await self.connect()
        
        key = self._make_key(session_id)
        await self._redis.delete(key)
        
        self.log_event("session_deleted", session_id=str(session_id))
    
    async def session_exists(self, session_id: UUID) -> bool:
        """Check if session exists in Redis."""
        await self.connect()
        
        key = self._make_key(session_id)
        exists = await self._redis.exists(key)
        
        return bool(exists)
    
    async def extend_session_ttl(self, session_id: UUID, ttl_seconds: int) -> None:
        """Extend session TTL in Redis."""
        await self.connect()
        
        key = self._make_key(session_id)
        await self._redis.expire(key, ttl_seconds)
        
        self.log_event(
            "session_ttl_extended",
            session_id=str(session_id),
            ttl=ttl_seconds
        )


class InMemoryStateStore(StateStore, LoggerMixin):
    """In-memory state store for testing."""
    
    def __init__(self):
        """Initialize in-memory store."""
        self._sessions: Dict[str, SessionState] = {}
    
    async def save_session(self, session: SessionState) -> None:
        """Save session to memory."""
        session.updated_at = datetime.utcnow()
        self._sessions[str(session.session_id)] = session
        self.log_event("session_saved_memory", session_id=str(session.session_id))
    
    async def load_session(self, session_id: UUID) -> Optional[SessionState]:
        """Load session from memory."""
        return self._sessions.get(str(session_id))
    
    async def delete_session(self, session_id: UUID) -> None:
        """Delete session from memory."""
        self._sessions.pop(str(session_id), None)
    
    async def session_exists(self, session_id: UUID) -> bool:
        """Check if session exists."""
        return str(session_id) in self._sessions
    
    async def extend_session_ttl(self, session_id: UUID, ttl_seconds: int) -> None:
        """Extend TTL (no-op for in-memory)."""
        pass