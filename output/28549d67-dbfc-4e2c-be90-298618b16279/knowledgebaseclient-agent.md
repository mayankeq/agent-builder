# KnowledgeBaseClient

## Trigger
- Search for solution articles
- Retrieve specific article by ID
- Find troubleshooting guides

## Steps
1. Generate query embedding via EmbeddingService
2. Search VectorStore for similar articles
3. Rank results by relevance
4. Retrieve full article content
5. Return top K articles

## Example
User: Find articles about "database connection timeout"
Agent: Found 3 articles: [DB Pool Config, Timeout Tuning, Network Issues].

**Note**: Consult knowledge-base.md for search strategies.