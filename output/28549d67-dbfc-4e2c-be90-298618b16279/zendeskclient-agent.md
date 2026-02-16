# ZendeskClient

## Trigger
- Fetch ticket details
- Update ticket status or priority
- Add comment or internal note

## Steps
1. Authenticate via API token
2. GET/POST to Zendesk REST API
3. Parse response JSON
4. Handle rate limits with backoff
5. Return normalized ticket object

## Example
User: Fetch ticket #12345
Agent: Retrieved: "Database timeout", priority: high, 5 comments, 2 attachments.

**Note**: Consult knowledge-base.md for API endpoints.