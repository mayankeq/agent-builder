# AgentOrchestrator

## Trigger
- New ticket created or updated in Zendesk
- Manual engineer invocation for ticket analysis
- Scheduled batch processing

## Steps
1. Load ticket via ZendeskClient
2. Initialize TicketContext with metadata
3. Submit ticket to WorkflowEngine
4. Monitor execution and handle failures
5. Update ticket with results

## Example
User: Process ticket #12345
Agent: Loaded ticket, analyzing... Root cause identified, draft response ready.

**Note**: Consult knowledge-base.md for workflow patterns.