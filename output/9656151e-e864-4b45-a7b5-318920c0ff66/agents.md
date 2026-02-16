# Agent System: AIOps monitoring agent for Kubernetes cluster that:
  - Monitors pod health and resource usage via Prometheus
  - Correlates incidents across services using Datadog logs
  - Auto-remediates common failures (pod restarts, scaling, config fixes)
  - Learns from past incident resolutions in PostgreSQL incident database
  - Integrates with PagerDuty for alerting and on-call escalation
  - References runbook repository and #sre Slack channel for tribal knowledge
  - Distinguishes between production critical alerts vs dev/staging warnings
  - Predicts capacity issues before they cause outages
  - Generates blameless postmortems for major incidents

## Overview
This is a aiops agent system with 22 specialized agents.

## Agents

### 1. MonitoringOrchestrator
Orchestrates continuous monitoring loops for Kubernetes resources and Prometheus metrics

**File**: [monitoringorchestrator-agent.md](./monitoringorchestrator-agent.md)


### 2. PrometheusCollector
Collects and processes metrics from Prometheus for health assessment

**File**: [prometheuscollector-agent.md](./prometheuscollector-agent.md)


### 3. KubernetesWatcher
Watches Kubernetes API for pod events and state changes

**File**: [kuberneteswatcher-agent.md](./kuberneteswatcher-agent.md)


### 4. LogCorrelationEngine
Correlates logs across services using Datadog to identify incident patterns

**File**: [logcorrelationengine-agent.md](./logcorrelationengine-agent.md)


### 5. AnomalyDetector
Detects anomalies in time-series metrics and predicts capacity issues

**File**: [anomalydetector-agent.md](./anomalydetector-agent.md)


### 6. IncidentManager
Central orchestrator managing incident lifecycle from detection to resolution

**File**: [incidentmanager-agent.md](./incidentmanager-agent.md)


### 7. RemediationPlanner
Plans and prioritizes remediation actions based on incident analysis

**File**: [remediationplanner-agent.md](./remediationplanner-agent.md)


### 8. RemediationExecutor
Safely executes remediation actions with rollback capability

**File**: [remediationexecutor-agent.md](./remediationexecutor-agent.md)


### 9. SafetyChecker
Validates safety constraints before remediation execution

**File**: [safetychecker-agent.md](./safetychecker-agent.md)


### 10. LearningService
Learns from historical incidents to improve recommendations

**File**: [learningservice-agent.md](./learningservice-agent.md)


### 11. AlertRouter
Intelligently routes and escalates alerts via PagerDuty

**File**: [alertrouter-agent.md](./alertrouter-agent.md)


### 12. SeverityClassifier
Classifies incident severity based on environment and impact

**File**: [severityclassifier-agent.md](./severityclassifier-agent.md)


### 13. KnowledgeExtractor
Extracts tribal knowledge from Slack and runbook repositories

**File**: [knowledgeextractor-agent.md](./knowledgeextractor-agent.md)


### 14. RunbookIndex
Searchable index of runbooks with relevance ranking

**File**: [runbookindex-agent.md](./runbookindex-agent.md)


### 15. PostmortemGenerator
Generates blameless postmortems with timeline reconstruction

**File**: [postmortemgenerator-agent.md](./postmortemgenerator-agent.md)


### 16. RootCauseAnalyzer
Performs root cause analysis through distributed trace correlation

**File**: [rootcauseanalyzer-agent.md](./rootcauseanalyzer-agent.md)


### 17. CircuitBreaker
Implements circuit breaker pattern for external API calls and remediation

**File**: [circuitbreaker-agent.md](./circuitbreaker-agent.md)


### 18. EventBus
Message bus for async communication between components

**File**: [eventbus-agent.md](./eventbus-agent.md)


### 19. HistoricalIncidentDB
PostgreSQL database storing historical incident data for learning

**File**: [historicalincidentdb-agent.md](./historicalincidentdb-agent.md)


### 20. StateStore
Redis-backed store for ephemeral state (circuit breakers, rate limits, caches)

**File**: [statestore-agent.md](./statestore-agent.md)


### 21. AuditLogger
Comprehensive audit trail of all agent actions

**File**: [auditlogger-agent.md](./auditlogger-agent.md)


### 22. APIServer
FastAPI server exposing webhooks and control endpoints

**File**: [apiserver-agent.md](./apiserver-agent.md)


## Domain
**AIOPS** - Automated IT Operations - monitoring, alerting, and remediation
