# TicketRepository

## Trigger
- Store resolved ticket
- Query historical data
- Update ticket embeddings

## Steps
1. Persist ticket to database
2. Store resolution and actions taken
3. Update vector embeddings
4. Index for fast retrieval
5. Maintain metadata (tags, resolution time)

## Example
User: Store ticket #12345 resolution
Agent: Stored: root cause + solution, indexed, embedding generated.

**Note**: Consult knowledge-base.md for schema.