# Agent-Builder Architecture

## Overview

The agent-builder is a sophisticated system for creating ultra-concise, production-ready LLM-based agents through a five-phase workflow that leverages Claude's extended thinking capabilities and self-improvement through pattern recognition.

## Key Architecture Principles (v2.0)

### 1. Ultra-Concise Skills (200 Token Max)
Each generated skill file is limited to ~50 lines or 200 tokens, containing only:
- **Triggers**: When to activate
- **Steps**: What actions to take
- **Example**: Brief usage demonstration
- **Reference**: Link to knowledge base

### 2. Knowledge Base Separation
Deep domain expertise, integration details, and best practices are separated into `knowledge-base.md`:
- Domain-specific knowledge
- Integration points (APIs, systems, databases)
- Contextual intelligence guidelines
- Best practices and anti-patterns
- Industry standards and compliance

### 3. Pattern Learning
The system can learn from existing agent files in your organization:
- Extracts structure patterns
- Analyzes style conventions
- Applies learned patterns to new agents
- Maintains consistency across agent library

**Benefits:**
- ✅ Clarity: Easy to scan and understand
- ✅ Maintainability: Update individual skills without touching knowledge base
- ✅ Reusability: Knowledge base shared across all skills
- ✅ Consistency: Learn from existing organizational patterns

## System Architecture (v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                          │
│  (yargs, inquirer, chalk - User interaction layer)         │
│  NEW: --existing-agents-dir option                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Existing Agent Reader (Optional)                │
│  Reads existing agent files for pattern learning            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Workflow Coordinator                        │
│  (Orchestrates the 5-phase pipeline)                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Phase 0-2   │  │  Phase 3-4   │  │   Phase 5    │
│Pattern Learn │  │Implementation│  │   Learning   │
│Clarification │  │  + Packaging │  │              │
│   + Design   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Factory                            │
│  (Creates and configures specialized agents)                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Research      │  │ Skill Agent  │  │ Packaging    │
│Agent         │  │ (Ultra-      │  │ Agent        │
│(Enhanced)    │  │  Concise)    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Clarification │  │Implementation│  │Memory System │
│Agent         │  │Agent (Code)  │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Design Agent  │  │Testing Agent │  │Pattern       │
│(Extended     │  │              │  │Recognition   │
│ Thinking)    │  │Documentation │  │              │
│              │  │   Agent      │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Claude API Client                         │
│  (Anthropic SDK with extended thinking support)             │
│  NEW: SKILL_SYSTEM_PROMPT for ultra-concise generation      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Generated Output (v2.0)                   │
│  • skill-1.md (< 200 tokens: Trigger/Steps/Example)        │
│  • skill-2.md (< 200 tokens: Trigger/Steps/Example)        │
│  • skill-N.md (< 200 tokens: Trigger/Steps/Example)        │
│  • knowledge-base.md (Deep expertise, integrations)         │
│  • agents.md (System overview)                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Interface (`src/cli/`)
- **CLIController**: Handles command routing and execution
- **ConfigManager**: Loads and merges configuration files
- **InteractiveMode**: Manages interactive prompts and user input

### 2. Workflow Orchestration (`src/orchestration/`)
- **WorkflowCoordinator**: Main orchestrator managing the 5-phase pipeline
- **PhaseManager**: Validates phase transitions and tracks progress
- **AgentFactory**: Creates and configures agent instances with dependency injection

### 3. Agent System (`src/agents/`)
- **BaseAgent**: Abstract base class providing lifecycle management, timeout, and retry logic
- **ResearchAgent**: Enhanced analysis with integration points, advanced capabilities, and domain depth
- **ClarificationAgent**: Gathers requirements through 2-3 rounds of targeted questions
- **DesignAgent**: Creates architecture using Claude's extended thinking (10K token budget)
- **SkillAgent**: Generates ultra-concise skills (200 token max) + knowledge base
- **ImplementationAgent**: Generates code based on design specifications
- **TestingAgent**: Creates comprehensive unit and integration tests
- **DocumentationAgent**: Generates README, API docs, and usage examples
- **PackagingAgent**: Packages artifacts for Claude Code skills, MCP servers, CLIs, or libraries

### 4. Claude Integration (`src/claude/`)
- **ClaudeClient**: API wrapper with extended thinking support and retry logic
- **PromptTemplates**: System prompts optimized for each agent type
- **ResponseParser**: Extracts structured data from Claude's responses using Zod validation

### 5. Template System (`src/templates/`)
- **TemplateManager**: Handles template rendering with Handlebars
- **Templates**: Multi-language templates for different output types
  - Claude Code Skills (TypeScript/Python)
  - MCP Servers (TypeScript/Python)
  - Standalone CLIs (TypeScript/Python)
  - Libraries (TypeScript/Python)

### 6. Memory & Learning (`src/memory/`)
- **MemoryManager**: Captures sessions, finds similar patterns, stores learnings
- **MetricsTracker**: Tracks success rates, token usage, performance over time
- **PatternMatcher**: Extracts patterns from successful sessions for reuse

### 7. Performance Optimization (`src/performance/`)
- **PerformanceOptimizer**: Applies optimizations based on user priorities
- **PerformanceMetrics**: Tracks operation timing and memory usage
- **TradeOffAnalyzer**: Analyzes design trade-offs and provides recommendations

### 8. Validation (`src/validation/`)
- **CodeValidator**: Validates TypeScript/Python syntax and structure
- **TestRunner**: Executes generated tests (vitest/pytest integration)
- **QualityChecker**: Checks complexity, maintainability, documentation quality

### 9. Utility Functions (`src/utils/`)
- **ExistingAgentReader**: Reads and analyzes existing agent files for pattern learning
- **Logger**: Structured logging with log levels
- **FileSystem**: Safe file operations with path validation

## Output Architecture: Skills vs Knowledge Base

### New Two-Tier Structure (v2.0)

```
📁 Generated Output/
├── 📄 skill-1.md                    # Ultra-concise (< 200 tokens)
│   ├── ## Trigger
│   ├── ## Steps
│   ├── ## Example
│   └── > See: [Knowledge Base](knowledge-base.md#section)
│
├── 📄 skill-2.md                    # Ultra-concise (< 200 tokens)
├── 📄 skill-3.md                    # Ultra-concise (< 200 tokens)
│
├── 📚 knowledge-base.md             # Deep domain expertise
│   ├── ## Domain Expertise
│   ├── ## Integration Points
│   ├── ## Best Practices
│   ├── ## Anti-Patterns
│   ├── ## Contextual Intelligence
│   └── ## Advanced Techniques
│
└── 📄 agents.md                     # System overview
```

### Design Rationale

**Why 200-Token Constraint?**
1. **Clarity**: Easy to scan and understand at a glance
2. **Maintainability**: Update individual skills without touching shared knowledge
3. **Consistency**: Uniform structure across all skills
4. **Performance**: Faster to load and process
5. **Separation of Concerns**: Actions separate from knowledge

**Why Knowledge Base Separation?**
1. **Reusability**: All skills reference same knowledge base
2. **Updates**: Change integration details once, affects all skills
3. **Organization**: Deep expertise organized by domain
4. **Discovery**: Easier to find relevant information
5. **Versioning**: Knowledge base can evolve independently

### Pattern Learning from Existing Agents

When `--existing-agents-dir` is provided:

```
📁 ~/my-company/agents/           → Input (existing patterns)
├── agents.md                     → Analyzed for structure
├── billing-agent.md              → Analyzed for sections
├── technical-agent.md            → Analyzed for style
├── CLAUDE.md                     → Optional guidelines
└── .cursorrules                  → Optional rules

        ↓ Analysis Phase

Extracted Patterns:
• Common sections: Trigger, Steps, Example
• Structure: Uses agents.md index file
• Style: Title case, dash bullets
• Integration: References Salesforce, Jira

        ↓ Generation Phase

📁 Generated Output/                → Output (applies patterns)
├── new-skill-1.md                 → Uses learned structure
├── new-skill-2.md                 → Uses learned style
└── knowledge-base.md              → Includes learned integrations
```

## Five-Phase Workflow

### Phase 0: Pattern Learning (Optional)
1. If `--existing-agents-dir` provided, read existing agent files
2. Extract structural patterns (sections, formatting)
3. Analyze style (heading case, bullet format, emoji usage)
4. Identify integration patterns and terminology
5. **Output**: ExistingAgentPattern object for use in generation

### Phase 1: Clarification (2-3 rounds)
1. User provides initial agent description
2. Clarification agent generates targeted questions across categories:
   - Functional requirements
   - Technical constraints
   - Architectural preferences
   - Performance priorities (speed/quality/trust/budget)
   - Output format and language
3. Process repeats until requirements are sufficiently clear
4. **Output**: Structured Requirements object

### Phase 2: Design (Extended Thinking)
1. Design agent receives requirements and similar patterns from memory
2. Claude's extended thinking (10K tokens) analyzes:
   - Multiple architectural approaches
   - Component responsibilities and dependencies
   - Technology stack choices with justifications
   - Data flow and integration points
   - Design decisions and trade-offs
3. Thinking trace captured for learning
4. **Output**: Comprehensive Design object with components, decisions, optimizations

### Phase 3: Implementation (Parallel Execution)

**For Skills (output=skill):**
1. **SkillAgent**: Generates ultra-concise skills (200 token max each)
   - Creates multiple skill files with Trigger/Steps/Example format
   - Removes all embedded knowledge sections
   - Adds references to knowledge base at bottom
2. **SkillAgent**: Generates separate knowledge-base.md
   - Deep domain expertise
   - Integration points with APIs and systems
   - Best practices and anti-patterns
   - Contextual intelligence guidelines
3. **SkillAgent**: Generates agents.md index
   - System overview
   - Links to all skill files
   - Usage instructions
4. **Output**: Map of filename → content (skills + knowledge base + index)

**For Code (output=mcp/cli/library):**
1. Three agents run concurrently (semaphore-controlled):
   - **Implementation Agent**: Generates core code
   - **Testing Agent**: Creates tests (unit + integration)
   - **Documentation Agent**: Writes README, API docs, examples
2. Each agent works independently from the design
3. **Output**: Implementation object with code, tests, docs

### Phase 4: Packaging
1. Packaging agent selects appropriate template based on output type
2. Merges generated code with package configuration:
   - For MCP servers: Add stdio transport, Zod schemas, bin entry
   - For CLIs: Add yargs/click setup, command structure
   - For Skills: Add skill.yaml manifest, entry points
   - For Libraries: Add proper exports, type definitions
3. **Output**: Complete distributable artifact set

### Phase 5: Learning
1. Session data captured in JSONL format
2. Pattern matcher extracts successful patterns
3. Metrics recorded for future optimization
4. **Output**: Updated memory store for next builds

## Data Flow

```
User Request
    ↓
[Requirements Gathering]
    ├─> Questions Generated
    ├─> User Answers
    └─> Requirements Object
         ↓
[Architecture Design]
    ├─> Extended Thinking Analysis
    ├─> Similar Patterns Retrieved
    └─> Design Object
         ↓
[Parallel Implementation]
    ├─> Code Generation
    ├─> Test Generation
    └─> Documentation Generation
         ↓
[Packaging]
    ├─> Template Selection
    ├─> Artifact Assembly
    └─> Package Configuration
         ↓
[Learning & Storage]
    ├─> Session Capture
    ├─> Pattern Extraction
    └─> Metrics Recording
         ↓
Generated Agent Files
```

## Key Design Decisions

### 1. TypeScript Core
**Why**: Type safety critical for code generation, excellent tooling, Node.js cross-platform

### 2. 200-Token Ultra-Concise Skills (v2.0)
**Why**:
- Clarity: Easy to scan and understand
- Maintainability: Update skills without touching knowledge base
- Performance: Faster to load and process
- Separation: Actions separate from knowledge
**Trade-off**: Requires separate knowledge base file

### 3. Knowledge Base Separation (v2.0)
**Why**:
- Reusability: All skills reference same knowledge base
- Organization: Deep expertise organized by domain
- Updates: Change integration details once, affects all skills
- Discovery: Easier to find relevant information
**Trade-off**: Additional file to maintain

### 4. Pattern Learning from Existing Agents (v2.0)
**Why**:
- Consistency: New agents match existing organizational style
- Integration: Reuse proven integration patterns
- Terminology: Use company-specific terms
- Adoption: Lower friction when agents match existing patterns
**Trade-off**: Requires existing agent directory as input

### 5. Extended Thinking for Design
**Why**: Architectural decisions benefit from deep analysis; one-time cost justified by quality

### 6. Parallel Agent Execution
**Why**: Code, tests, and docs can be generated independently; 40% speed improvement

### 7. JSONL for Memory
**Why**: Efficient streaming format, easy appending, works well for time-series data

### 8. Template System with Inline Fallbacks
**Why**: Flexibility to use files or inline templates; graceful degradation

### 9. Zod for Validation
**Why**: Runtime validation ensures Claude's output matches expected structure

## Performance Characteristics

- **Clarification**: 2-5 minutes (depending on rounds)
- **Design**: 5-10 minutes (extended thinking)
- **Implementation**: 10-15 minutes (parallel execution)
- **Packaging**: 2-5 minutes
- **Total**: 20-35 minutes per agent

**Token Usage**:
- Clarification: ~4K tokens per round
- Design: ~15K tokens (with extended thinking)
- Implementation: ~12K tokens (code + tests + docs)
- Total: ~35-50K tokens per agent

## Extensibility Points

1. **New Agent Types**: Extend BaseAgent, implement execute()
2. **New Templates**: Add directory in templates/ with .hbs files
3. **New Output Formats**: Add case in PackagingAgent
4. **Custom Optimizations**: Add strategies in PerformanceOptimizer
5. **Additional Validations**: Extend CodeValidator or QualityChecker
6. **Pattern Learning Extensions**: Add new analysis in ExistingAgentReader
7. **Knowledge Base Customization**: Modify SKILL_SYSTEM_PROMPT template

## Knowledge Base Generation Details

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SkillAgent Execution                      │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   generateAgents()    │       │ generateKnowledgeBase()│
│                       │       │                        │
│ Claude API Call #1    │       │  Claude API Call #2    │
│                       │       │                        │
│ Prompt:               │       │ Prompt:                │
│ - Use research data   │       │ - Extract domain       │
│ - Generate skills     │       │   expertise            │
│ - Max 200 tokens each │       │ - List integrations    │
│ - Trigger/Steps/Ex    │       │ - Best practices       │
│ - Reference KB        │       │ - Anti-patterns        │
└───────────────────────┘       └───────────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│ skill-1.md            │       │ knowledge-base.md     │
│ skill-2.md            │       │                       │
│ skill-3.md            │       │ ## Domain Expertise   │
│ ...                   │       │ ## Integrations       │
│ agents.md             │       │ ## Best Practices     │
└───────────────────────┘       └───────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
                ┌───────────────────────┐
                │  Combined Output      │
                │  (all files together) │
                └───────────────────────┘
```

### Knowledge Base Content Structure

```markdown
# Knowledge Base: [Domain Name]

## [Component 1] Expertise
### Integration Points
- **System A**: API details, endpoints, authentication
- **System B**: Database queries, schemas
- **System C**: Message formats, protocols

### Best Practices
- Industry standard 1
- Framework approach 2
- Proven pattern 3

### Anti-Patterns
- Common mistake 1 (and why to avoid)
- Pitfall 2 (and better approach)

### Contextual Intelligence
- Audience variation (customer vs internal vs management)
- Urgency considerations (SLA, tier, severity)
- Compliance requirements (GDPR, HIPAA, SOC2)

### Advanced Techniques
- **Correlation**: How to link to past patterns
- **Learning**: How to improve from outcomes
- **Prediction**: How to proactively detect issues
- **Context-Awareness**: How to adapt behavior

## [Component 2] Expertise
[Same structure repeated...]

## Cross-Component Knowledge
### System Architecture
- How components interact
- Data flow between components
- Shared resources and dependencies

### Domain Standards
- Industry regulations (GDPR, ISO, etc.)
- Company policies
- Legal requirements
```

### Prompt Template for Knowledge Base

The system uses the SKILL_SYSTEM_PROMPT which enforces:
- Ultra-concise skills (< 200 tokens)
- No embedded knowledge sections
- Reference to knowledge base
- Trigger/Steps/Example format only

Separate prompt for knowledge base generation:
- Extract domain expertise from research
- Organize by component
- Include integration details
- List best practices and anti-patterns
- Add contextual intelligence guidelines

## Configuration

Configuration cascade:
1. Built-in defaults (src/cli/config-manager.ts)
2. Project config (config/agent-builder.config.yaml)
3. User config (.agent-builder.yaml in cwd)
4. CLI flags (highest priority)

## Error Handling

- **Retry Logic**: Exponential backoff for API calls (max 3 attempts)
- **Timeouts**: Per-phase timeouts with graceful degradation
- **Validation**: Multiple validation layers (Zod, syntax, quality)
- **Graceful Failures**: Best-effort parsing with fallbacks

## Security Considerations

- API keys via environment variables only
- No credentials in config files
- Input sanitization in code generation
- Safe file operations with proper path validation
