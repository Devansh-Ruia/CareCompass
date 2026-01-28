"""
Logging configuration for MedFin API
"""

import logging
import json
import uuid
import time
from datetime import datetime
from typing import Dict, Any, Optional
import os


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add correlation ID if available
        if hasattr(record, "correlation_id") and record.correlation_id:
            log_entry["correlation_id"] = record.correlation_id

        # Add request ID if available
        if hasattr(record, "request_id") and record.request_id:
            log_entry["request_id"] = record.request_id

        # Add duration if available
        if hasattr(record, "duration") and record.duration is not None:
            log_entry["duration"] = record.duration

        # Add extra fields from record.__dict__
        extra_keys = set(record.__dict__.keys()) - {
            "name",
            "msg",
            "args",
            "levelname",
            "levelno",
            "pathname",
            "filename",
            "module",
            "lineno",
            "funcName",
            "created",
            "msecs",
            "relativeCreated",
            "thread",
            "threadName",
            "processName",
            "process",
            "getMessage",
            "exc_info",
            "exc_text",
            "stack_info",
            "correlation_id",
            "request_id",
            "duration",
        }

        for key in extra_keys:
            if not key.startswith("_"):
                log_entry[key] = getattr(record, key)

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging(log_level: str = "INFO") -> None:
    """Setup structured logging with JSON formatter"""

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Add console handler with JSON formatter
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)

    # Add file handler for production (optional)
    log_file = os.getenv("LOG_FILE")
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)


class LoggerMixin:
    """Mixin to add correlation ID support to loggers"""

    @staticmethod
    def get_logger(name: str) -> logging.Logger:
        """Get logger with correlation ID support"""
        return logging.getLogger(name)

    @staticmethod
    def log_with_correlation(
        logger: logging.Logger,
        level: int,
        msg: str,
        correlation_id: Optional[str] = None,
        **kwargs,
    ):
        """Log message with correlation ID"""
        extra = kwargs.copy()
        if correlation_id:
            extra["correlation_id"] = correlation_id
        logger.log(level, msg, extra=extra)


def get_request_id() -> str:
    """Generate a unique request ID"""
    return str(uuid.uuid4())[:8]


def get_correlation_id() -> str:
    """Generate a unique correlation ID"""
    return str(uuid.uuid4())
