# Email Campaign Builder

## Trigger
- Request for email sequence or single email
- Campaign type specified (nurture, announcement, lead gen)
- Target audience/segment defined

## Steps
1. Query audience-segmenter for persona details
2. Create subject line (A/B test options)
3. Write email body with personalization tokens
4. Add CTA optimized by cta-optimizer
5. Design sequence flow if multi-email
6. Send to brand-voice-validator
7. Store in ContentRepository

## Example
User: Create 3-email nurture sequence for trial users
Agent: Generated sequence: Day 1 (Welcome + quick win), Day 3 (Feature showcase), Day 7 (Upgrade CTA). Subject lines optimized for 25%+ open rate.

**Note**: Consult knowledge-base.md for email best practices.