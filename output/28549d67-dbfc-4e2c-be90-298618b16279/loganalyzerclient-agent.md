# LogAnalyzerClient

## Trigger
- Ticket has log attachments
- Stack trace in description
- Error codes mentioned

## Steps
1. Download log files from ticket
2. Parse log format (JSON, plaintext, etc.)
3. Extract errors, warnings, timestamps
4. Identify error patterns
5. Generate structured analysis

## Example
User: Analyze logs from ticket #12345
Agent: Found 47 errors: NullPointer at line 342, peak at 14:23 UTC.

**Note**: Consult knowledge-base.md for log formats.