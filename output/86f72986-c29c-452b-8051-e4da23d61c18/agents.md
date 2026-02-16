# Agent System: Customer support agent for SaaS product handling billing issues, technical problems, and account management

## Overview
This is a support agent system with 12 specialized agents.

## Agents

### 1. TicketOrchestrator
Main controller that orchestrates the entire ticket processing workflow from intake to resolution

**File**: [ticketorchestrator-agent.md](./ticketorchestrator-agent.md)


### 2. IntentClassifier
Analyzes incoming tickets to determine category, complexity, and required actions

**File**: [intentclassifier-agent.md](./intentclassifier-agent.md)


### 3. ContextManager
Manages customer context, conversation history, and session state

**File**: [contextmanager-agent.md](./contextmanager-agent.md)


### 4. KnowledgeRetriever
Searches knowledge base using semantic search to find relevant documentation

**File**: [knowledgeretriever-agent.md](./knowledgeretriever-agent.md)


### 5. ActionExecutor
Executes operations on external systems (billing, account modifications, data retrieval)

**File**: [actionexecutor-agent.md](./actionexecutor-agent.md)


### 6. ResponseGenerator
Creates customer-facing responses with appropriate tone, empathy, and brand voice

**File**: [responsegenerator-agent.md](./responsegenerator-agent.md)


### 7. EscalationDecider
Determines when tickets should be escalated to human agents

**File**: [escalationdecider-agent.md](./escalationdecider-agent.md)


### 8. AuditLogger
Records all customer interactions, data access, and actions for compliance

**File**: [auditlogger-agent.md](./auditlogger-agent.md)


### 9. ChannelAdapter
Abstract interface for different communication channels with specific implementations

**File**: [channeladapter-agent.md](./channeladapter-agent.md)


### 10. MetricsCollector
Tracks performance metrics and SLA compliance

**File**: [metricscollector-agent.md](./metricscollector-agent.md)


### 11. CacheService
Manages caching for customer context, responses, and embeddings

**File**: [cacheservice-agent.md](./cacheservice-agent.md)


### 12. IntegrationLayer
Unified interface for external system integrations with circuit breakers and retries

**File**: [integrationlayer-agent.md](./integrationlayer-agent.md)


## Domain
**SUPPORT** - Customer support - ticketing, knowledge base, and response generation
