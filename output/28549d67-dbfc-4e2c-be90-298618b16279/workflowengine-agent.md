# WorkflowEngine

## Trigger
- AgentOrchestrator submits ticket
- Workflow definition updated
- Retry failed workflow

## Steps
1. Load workflow DAG for ticket category
2. Execute skills in topological order
3. Pass outputs to dependent skills
4. Handle parallel execution where possible
5. Collect results and errors

## Example
User: Execute standard workflow for DB issue
Agent: Running: [Analyzer → LogParser → KBSearch] → ResponseBuilder. Complete.

**Note**: Consult knowledge-base.md for workflow definitions.