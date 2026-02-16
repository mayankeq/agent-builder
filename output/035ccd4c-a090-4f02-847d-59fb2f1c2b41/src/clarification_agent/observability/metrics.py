"""Metrics collection using Prometheus."""
from typing import Dict, Optional

from prometheus_client import Counter, Gauge, Histogram, Summary


# Session metrics
sessions_created = Counter(
    "clarification_sessions_created_total",
    "Total number of clarification sessions created"
)

sessions_completed = Counter(
    "clarification_sessions_completed_total",
    "Total number of sessions completed successfully",
    ["domain"]
)

sessions_expired = Counter(
    "clarification_sessions_expired_total",
    "Total number of sessions that expired"
)

# Question metrics
questions_generated = Counter(
    "clarification_questions_generated_total",
    "Total number of questions generated",
    ["question_type", "priority"]
)

questions_answered = Counter(
    "clarification_questions_answered_total",
    "Total number of questions answered"
)

# Turn metrics
conversation_turns = Histogram(
    "clarification_conversation_turns",
    "Number of turns in clarification conversations",
    buckets=[1, 2, 3, 5, 7, 10, 15, 20]
)

# Confidence metrics
session_confidence = Histogram(
    "clarification_session_confidence",
    "Final confidence scores for sessions",
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

clarity_score = Histogram(
    "clarification_input_clarity_score",
    "Initial input clarity scores",
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

# LLM metrics
llm_requests = Counter(
    "clarification_llm_requests_total",
    "Total LLM API requests",
    ["provider", "model", "operation"]
)

llm_errors = Counter(
    "clarification_llm_errors_total",
    "Total LLM API errors",
    ["provider", "error_type"]
)

llm_latency = Histogram(
    "clarification_llm_latency_seconds",
    "LLM API request latency",
    ["provider", "model"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

llm_tokens = Summary(
    "clarification_llm_tokens",
    "Tokens used in LLM requests",
    ["provider", "model", "token_type"]
)

# Cache metrics
cache_hits = Counter(
    "clarification_cache_hits_total",
    "Cache hits",
    ["cache_type"]
)

cache_misses = Counter(
    "clarification_cache_misses_total",
    "Cache misses",
    ["cache_type"]
)

# Active sessions gauge
active_sessions = Gauge(
    "clarification_active_sessions",
    "Number of currently active sessions"
)


class MetricsCollector:
    """Collects and aggregates metrics."""
    
    def __init__(self) -> None:
        """Initialize metrics collector."""
        self._session_data: Dict[str, Dict] = {}
    
    def record_session_created(self) -> None:
        """Record session creation."""
        sessions_created.inc()
        active_sessions.inc()
    
    def record_session_completed(self, domain: str, turns: int, confidence: float) -> None:
        """Record session completion.
        
        Args:
            domain: Session domain
            turns: Number of conversation turns
            confidence: Final confidence score
        """
        sessions_completed.labels(domain=domain).inc()
        conversation_turns.observe(turns)
        session_confidence.observe(confidence)
        active_sessions.dec()
    
    def record_session_expired(self) -> None:
        """Record session expiration."""
        sessions_expired.inc()
        active_sessions.dec()
    
    def record_question_generated(self, question_type: str, priority: str) -> None:
        """Record question generation.
        
        Args:
            question_type: Type of question
            priority: Question priority
        """
        questions_generated.labels(
            question_type=question_type,
            priority=priority
        ).inc()
    
    def record_question_answered(self) -> None:
        """Record question answer."""
        questions_answered.inc()
    
    def record_clarity_score(self, score: float) -> None:
        """Record input clarity score.
        
        Args:
            score: Clarity score (0-1)
        """
        clarity_score.observe(score)
    
    def record_llm_request(
        self,
        provider: str,
        model: str,
        operation: str,
        latency: float,
        tokens_used: Optional[Dict[str, int]] = None,
        error: Optional[str] = None
    ) -> None:
        """Record LLM API request.
        
        Args:
            provider: LLM provider (openai, anthropic)
            model: Model name
            operation: Operation type
            latency: Request latency in seconds
            tokens_used: Dictionary of token counts
            error: Error type if request failed
        """
        if error:
            llm_errors.labels(provider=provider, error_type=error).inc()
        else:
            llm_requests.labels(
                provider=provider,
                model=model,
                operation=operation
            ).inc()
            
            llm_latency.labels(provider=provider, model=model).observe(latency)
            
            if tokens_used:
                for token_type, count in tokens_used.items():
                    llm_tokens.labels(
                        provider=provider,
                        model=model,
                        token_type=token_type
                    ).observe(count)
    
    def record_cache_access(self, cache_type: str, hit: bool) -> None:
        """Record cache access.
        
        Args:
            cache_type: Type of cache
            hit: Whether it was a hit or miss
        """
        if hit:
            cache_hits.labels(cache_type=cache_type).inc()
        else:
            cache_misses.labels(cache_type=cache_type).inc()


# Global metrics collector instance
metrics = MetricsCollector()