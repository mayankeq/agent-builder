# SkillExecutor

## Trigger
- WorkflowEngine requests skill execution
- Retry on transient failure

## Steps
1. Load skill prompt template
2. Inject TicketContext data
3. Call LLM with formatted prompt
4. Parse structured output
5. Return result with confidence score

## Example
User: Execute RootCauseAnalyzer skill
Agent: Analyzed logs → Root cause: connection pool exhausted (confidence: 0.89).

**Note**: Consult knowledge-base.md for prompt engineering.