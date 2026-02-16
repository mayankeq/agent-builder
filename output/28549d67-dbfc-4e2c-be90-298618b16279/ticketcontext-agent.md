# TicketContext

## Trigger
- Ticket processing initiated
- Skill requests context data
- Context update from skill output

## Steps
1. Store ticket ID, subject, description
2. Maintain execution state per skill
3. Track artifacts (logs, screenshots)
4. Record skill outputs and confidence scores
5. Provide context to downstream skills

## Example
User: Get context for ticket #12345
Agent: Ticket: DB timeout, severity: high, 3 attachments, 2 skills completed.

**Note**: Consult knowledge-base.md for context schema.