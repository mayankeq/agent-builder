# EmbeddingService

## Trigger
- Generate embedding for text
- Batch embedding requests
- Model update

## Steps
1. Preprocess text (clean, tokenize)
2. Call embedding model API
3. Normalize vector
4. Cache result in CacheManager
5. Return embedding array

## Example
User: Embed "database connection failed"
Agent: Generated 1536-dim vector, cached.

**Note**: Consult knowledge-base.md for model selection.