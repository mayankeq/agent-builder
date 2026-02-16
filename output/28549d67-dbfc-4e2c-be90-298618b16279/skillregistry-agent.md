# SkillRegistry

## Trigger
- System initialization
- Hot reload request
- New skill deployment

## Steps
1. Scan skill directory for markdown files
2. Parse skill metadata (triggers, dependencies)
3. Validate skill definitions
4. Register in memory catalog
5. Build dependency graph

## Example
User: Register new LogParser skill
Agent: Loaded LogParser v1.2, dependencies: [EmbeddingService], registered.

**Note**: Consult knowledge-base.md for skill schemas.