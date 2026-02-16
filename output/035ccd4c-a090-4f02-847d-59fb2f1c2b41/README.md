# Clarification Agent

An interactive AI agent system that handles ambiguous user requests through intelligent clarification.

## Overview

This agent detects vague or ambiguous inputs and engages in a structured conversation to:
- Extract clear requirements
- Classify domain and intent
- Generate targeted clarifying questions
- Synthesize comprehensive requirement specifications

## Features

- **Intelligent Question Generation**: Uses LLMs to create contextual, high-value questions
- **Multi-LLM Support**: OpenAI and Anthropic with fallback capabilities
- **Session Management**: Redis-backed stateful conversations with TTL
- **Comprehensive Metrics**: Prometheus metrics for monitoring
- **Structured Logging**: Full observability with structlog
- **Type Safety**: Pydantic models throughout

## Quick Start

### Prerequisites

- Python 3.11+
- Redis (for session storage)
- OpenAI API key

### Installation