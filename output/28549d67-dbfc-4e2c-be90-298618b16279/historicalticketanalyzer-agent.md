# HistoricalTicketAnalyzer

## Trigger
- Find similar past tickets
- Identify resolution patterns
- Extract successful solutions

## Steps
1. Embed current ticket description
2. Query TicketRepository for similar vectors
3. Filter by resolution status
4. Extract solution patterns
5. Rank by similarity and success rate

## Example
User: Find similar tickets for "API rate limit error"
Agent: Found 12 similar tickets, 10 resolved via rate increase, avg resolution: 2hrs.

**Note**: Consult knowledge-base.md for similarity metrics.