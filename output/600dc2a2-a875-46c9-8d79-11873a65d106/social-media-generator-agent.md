# Social Media Generator

## Trigger
- Request for social post on topic/campaign
- Platform specified (LinkedIn, Twitter/X)
- Source content or theme provided

## Steps
1. Query KnowledgeBaseManager for brand voice
2. Generate platform-specific content (LinkedIn: 150-300 chars, Twitter: 280 chars)
3. Add relevant hashtags (3-5 for LinkedIn, 2-3 for Twitter)
4. Include CTA and link
5. Send to brand-voice-validator
6. Store in ContentRepository with platform tag

## Example
User: Create LinkedIn post about new automation feature
Agent: "Reduce manual tasks by 60% with our new conditional logic builder. Turn hours into minutes. [Learn more] #WorkflowAutomation #Productivity #AITools"

**Note**: Consult knowledge-base.md for platform guidelines.