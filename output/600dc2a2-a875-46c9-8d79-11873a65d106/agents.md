# Marketing agent for AI workflow products that creates blog posts, social media content, case studies, email campaigns, and
  technical whitepapers for B2B audiences

## Purpose
Systematically produce high-quality, multi-format marketing content for AI workflow products to support B2B sales pipeline, establish thought leadership, and maintain consistent multi-channel presence while reducing manual content creation effort

## System Overview
This automation agent system consists of 28 specialized agents, each handling a specific aspect of the workflow. Together, they provide comprehensive coverage while maintaining ultra-concise, focused implementations.

## Architecture
- **Skills**: 28 ultra-concise agents (< 200 tokens each)
- **Knowledge Base**: Comprehensive domain expertise in [knowledge-base.md](./knowledge-base.md)
- **Integration**: 14 external systems

## Agents

### 1. [blog-content-generator](./blog-content-generator-agent.md)

**Purpose**: Generates long-form blog posts (1500-2500 words) with SEO optimization for thought leadership and organic search

**Key Responsibilities**:
- Research and outline blog topics based on keywords and audience needs
- Generate comprehensive blog content with proper structure (intro, body, conclusion)
- Incorporate SEO elements (keywords, meta descriptions, headers)

**When to use**: For creating new content or artifacts

### 2. [social-media-generator](./social-media-generator-agent.md)

**Purpose**: Creates platform-specific social media content for LinkedIn, Twitter/X, and other B2B channels

**Key Responsibilities**:
- Generate platform-appropriate posts (LinkedIn: 150-300 chars, Twitter: 280 chars)
- Adapt tone and format for each platform
- Create engagement hooks and conversation starters

**When to use**: For creating new content or artifacts

### 3. [email-campaign-builder](./email-campaign-builder-agent.md)

**Purpose**: Creates email campaigns for nurture sequences, product announcements, and lead generation

**Key Responsibilities**:
- Design email sequences with logical progression
- Craft compelling subject lines and preview text
- Create personalized email body content

**When to use**: For design email sequences with logical progression

### 4. [case-study-writer](./case-study-writer-agent.md)

**Purpose**: Develops customer case studies from success stories, usage data, and customer interviews

**Key Responsibilities**:
- Structure case studies with problem-solution-results format
- Extract key metrics and ROI data
- Craft compelling customer narratives

**When to use**: For structure case studies with problem-solution-results format

### 5. [technical-whitepaper-author](./technical-whitepaper-author-agent.md)

**Purpose**: Authors technical whitepapers on AI workflow topics for lead magnet content

**Key Responsibilities**:
- Research and structure comprehensive technical topics
- Write in-depth analysis and explanations
- Include diagrams, charts, and technical specifications

**When to use**: For research and structure comprehensive technical topics

### 6. [seo-optimizer](./seo-optimizer-agent.md)

**Purpose**: Optimizes content for search engines with keyword research, on-page SEO, and technical optimization

**Key Responsibilities**:
- Conduct keyword research and identify target keywords
- Optimize meta titles, descriptions, and headers
- Ensure proper keyword density and placement

**When to use**: For conduct keyword research and identify target keywords

### 7. [brand-voice-validator](./brand-voice-validator-agent.md)

**Purpose**: Validates content adherence to brand voice, style guide, and messaging guidelines

**Key Responsibilities**:
- Check tone, voice, and style consistency
- Validate messaging against brand guidelines
- Identify deviations from approved terminology

**When to use**: For check tone, voice, and style consistency

### 8. [technical-reviewer](./technical-reviewer-agent.md)

**Purpose**: Verifies technical accuracy of AI/workflow domain concepts and claims

**Key Responsibilities**:
- Validate technical claims and specifications
- Check accuracy of product features and capabilities
- Verify industry terminology and concepts

**When to use**: When detailed analysis or evaluation is needed

### 9. [content-repurposer](./content-repurposer-agent.md)

**Purpose**: Converts content across formats (blog to social, whitepaper to email series, etc.)

**Key Responsibilities**:
- Extract key messages from source content
- Adapt content to target format and channel
- Maintain core message while optimizing for medium

**When to use**: For extract key messages from source content

### 10. [competitive-analyzer](./competitive-analyzer-agent.md)

**Purpose**: Analyzes competitive positioning and creates differentiation messaging

**Key Responsibilities**:
- Research competitor content and messaging
- Identify differentiation opportunities
- Generate competitive comparison content

**When to use**: When detailed analysis or evaluation is needed

### 11. [audience-segmenter](./audience-segmenter-agent.md)

**Purpose**: Segments content for different buyer personas and journey stages

**Key Responsibilities**:
- Identify target persona for content
- Adapt messaging for journey stage (awareness, consideration, decision)
- Customize pain points and value propositions

**When to use**: For identify target persona for content

### 12. [cta-optimizer](./cta-optimizer-agent.md)

**Purpose**: Optimizes calls-to-action for conversion goals and campaign objectives

**Key Responsibilities**:
- Generate compelling CTA copy
- Align CTAs with content type and funnel stage
- Create urgency and value propositions

**When to use**: For generate compelling cta copy

### 13. [content-calendar-manager](./content-calendar-manager-agent.md)

**Purpose**: Manages production schedule, planning, and workflow coordination

**Key Responsibilities**:
- Plan content calendar based on goals and priorities
- Schedule content production tasks
- Coordinate multi-skill workflows

**When to use**: For plan content calendar based on goals and priorities

### 14. [metrics-reporter](./metrics-reporter-agent.md)

**Purpose**: Tracks content performance across channels and generates insights

**Key Responsibilities**:
- Collect metrics from all channels
- Calculate success criteria (engagement, conversions, SEO)
- Generate performance reports

**When to use**: For reporting and metrics tracking

### 15. [WorkflowOrchestrator](./workfloworchestrator-agent.md)

**Purpose**: Coordinates multi-skill workflows and manages content production pipelines

**Key Responsibilities**:
- Route content requests to appropriate skills
- Manage multi-stage content workflows
- Handle skill dependencies and sequencing

**When to use**: For route content requests to appropriate skills

### 16. [TaskScheduler](./taskscheduler-agent.md)

**Purpose**: Schedules recurring content production tasks and manages task queue

**Key Responsibilities**:
- Schedule recurring content generation (blogs, social posts)
- Prioritize tasks based on deadlines and importance
- Distribute tasks to available workers

**When to use**: For schedule recurring content generation (blogs, social posts)

### 17. [StateManager](./statemanager-agent.md)

**Purpose**: Tracks content status, history, and workflow state

**Key Responsibilities**:
- Maintain content state through production lifecycle
- Track workflow progress and stage transitions
- Store approval history and review feedback

**When to use**: For maintain content state through production lifecycle

### 18. [QueueManager](./queuemanager-agent.md)

**Purpose**: Manages concurrent content generation requests and task distribution

**Key Responsibilities**:
- Queue content generation requests
- Distribute work across parallel workers
- Implement rate limiting for API calls

**When to use**: For queue content generation requests

### 19. [KnowledgeBaseManager](./knowledgebasemanager-agent.md)

**Purpose**: Manages brand guidelines, product documentation, and reference materials

**Key Responsibilities**:
- Store and retrieve brand voice guidelines
- Maintain product documentation and specifications
- Manage customer personas and journey maps

**When to use**: For store and retrieve brand voice guidelines

### 20. [ContentRepository](./contentrepository-agent.md)

**Purpose**: Stores, versions, and manages all generated content

**Key Responsibilities**:
- Store content with full version history
- Track content lineage and derivatives
- Support content search and retrieval

**When to use**: For store content with full version history

### 21. [TemplateEngine](./templateengine-agent.md)

**Purpose**: Manages content templates and dynamic content generation

**Key Responsibilities**:
- Store and retrieve content templates
- Support template variables and conditionals
- Generate content from templates with data

**When to use**: For store and retrieve content templates

### 22. [MetricsCollector](./metricscollector-agent.md)

**Purpose**: Aggregates performance metrics across channels and campaigns

**Key Responsibilities**:
- Collect metrics from all channels
- Normalize metrics across platforms
- Calculate aggregate statistics

**When to use**: For reporting and metrics tracking

### 23. [LLMConnector](./llmconnector-agent.md)

**Purpose**: Interfaces with LLM APIs (OpenAI, Anthropic) for content generation

**Key Responsibilities**:
- Manage LLM API connections and authentication
- Handle prompt construction and response parsing
- Implement retry logic and error handling

**When to use**: For manage llm api connections and authentication

### 24. [CMSConnector](./cmsconnector-agent.md)

**Purpose**: Publishes content to content management systems (WordPress, Contentful)

**Key Responsibilities**:
- Format content for target CMS
- Publish or schedule content
- Upload media and assets

**When to use**: For format content for target cms

### 25. [SocialMediaConnector](./socialmediaconnector-agent.md)

**Purpose**: Posts content to social media platforms (LinkedIn, Twitter)

**Key Responsibilities**:
- Format posts for each platform
- Post or schedule social content
- Handle media attachments

**When to use**: For format posts for each platform

### 26. [EmailConnector](./emailconnector-agent.md)

**Purpose**: Sends email campaigns through email platforms (HubSpot, Mailchimp)

**Key Responsibilities**:
- Create email campaigns
- Configure segmentation and personalization
- Schedule email sends

**When to use**: For create email campaigns

### 27. [SEOToolsConnector](./seotoolsconnector-agent.md)

**Purpose**: Integrates with SEO tools (SEMrush, Ahrefs) for keyword research and analysis

**Key Responsibilities**:
- Perform keyword research
- Analyze SERP rankings
- Get content optimization suggestions

**When to use**: For perform keyword research

### 28. [AnalyticsConnector](./analyticsconnector-agent.md)

**Purpose**: Pulls performance metrics from analytics platforms (Google Analytics, etc.)

**Key Responsibilities**:
- Query analytics APIs
- Pull traffic and engagement metrics
- Track conversions and attribution

**When to use**: For query analytics apis


## Getting Started

1. **Read the Knowledge Base**: Start with [knowledge-base.md](./knowledge-base.md) for comprehensive domain context
2. **Select the Right Agent**: Use the agent list above to find the most relevant skill for your task
3. **Follow the Agent's Steps**: Each agent provides clear triggers and action steps
4. **Reference Knowledge**: Agents link back to the knowledge base for detailed information

## Domain Context
**Automation** - Workflow automation - task scheduling and system integration

---

*Generated with [Synthient Agent-Builder](https://github.com/your-org/agent-builder) - Ultra-concise skills with automatic knowledge base generation*
