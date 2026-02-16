"""Structured logging configuration."""
import logging
import sys
from typing import Any, Dict

import structlog


def setup_logging(log_level: str = "INFO", json_logs: bool = False) -> None:
    """Configure structured logging.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: Whether to output logs in JSON format
    """
    # Configure structlog
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    
    if json_logs:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)


class LoggerMixin:
    """Mixin to add logging to classes."""
    
    @property
    def logger(self) -> structlog.BoundLogger:
        """Get logger bound to this instance."""
        if not hasattr(self, "_logger"):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger
    
    def log_event(self, event: str, **kwargs: Any) -> None:
        """Log an event with context.
        
        Args:
            event: Event name
            **kwargs: Additional context
        """
        self.logger.info(event, **kwargs)
    
    def log_error(self, error: Exception, **kwargs: Any) -> None:
        """Log an error with context.
        
        Args:
            error: The exception
            **kwargs: Additional context
        """
        self.logger.error(
            "error_occurred",
            error_type=type(error).__name__,
            error_message=str(error),
            **kwargs
        )