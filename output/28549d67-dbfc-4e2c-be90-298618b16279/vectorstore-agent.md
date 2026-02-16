# VectorStore

## Trigger
- Store new embeddings
- Semantic search query
- Update existing vectors

## Steps
1. Accept vector and metadata
2. Index in vector database (Pinecone/Weaviate)
3. Perform similarity search
4. Return top K matches with scores
5. Handle bulk operations

## Example
User: Search vectors for "timeout error"
Agent: Top 5 matches: [0.94, 0.91, 0.88, 0.85, 0.82] with IDs.

**Note**: Consult knowledge-base.md for indexing strategies.