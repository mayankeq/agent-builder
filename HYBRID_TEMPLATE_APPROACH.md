# Hybrid Template Approach

## Problem
The original implementation asked Claude to generate complete files (16K tokens), which resulted in:
- **Malformed JSON**: Large outputs often had syntax errors
- **Parser failures**: All 4 fallback strategies failed
- **Inconsistent structure**: Each generation was different
- **Long generation time**: 3-4 minutes for implementation phase

## Solution: Hybrid Template + Logic Injection

### Architecture
1. **Templates provide structure** (deterministic files with placeholders)
2. **Claude generates logic snippets** (5-30 lines of domain-specific code)
3. **Template engine injects logic** into placeholders
4. **Result: Complete, working files** with consistent structure

### Flow
```
User Request → Research (detect domain: aiops)
           → Design (architecture)
           → Implementation (NEW HYBRID APPROACH):
               1. Check if templates/skill/aiops/ exists
               2. If YES:
                  a. Ask Claude for LOGIC SNIPPETS (not full files)
                  b. Parse snippets (simple SNIPPET: marker format)
                  c. Inject into templates
                  d. Render complete files
               3. If NO:
                  - Fall back to Claude generating full files (legacy)
```

### Templates Created

#### Domain: AIOps
**Location**: `templates/skill/aiops/`

**Files**:
- `index.ts.hbs` - Main monitoring loop (structure provided, logic injected)
- `health-checker.ts.hbs` - Health check engine (template + {{{healthCheckCode}}})
- `remediation.ts.hbs` - Auto-remediation engine (template + {{{remediationCode}}})
- `alerts.ts.hbs` - Alert management (template + {{{alertCode}}})
- `config.ts.hbs` - Configuration loading
- `utils/logger.ts.hbs` - Logging utility
- `package.json.hbs` - NPM package config
- `tsconfig.json.hbs` - TypeScript config
- `skill.yaml.hbs` - Claude skill manifest

**Placeholders** (injected by Claude):
- `{{{healthCheckCode}}}` - Kubernetes API health check logic
- `{{{remediationCode}}}` - Pod restart logic
- `{{{validationCode}}}` - Safety validation before remediation
- `{{{alertCode}}}` - Slack/PagerDuty alert sending
- `{{{additionalConfigFields}}}` - Extra config fields needed
- `{{{defaultConfigValues}}}` - Default values

### Logic Snippet Format

Claude is asked to return compact snippets (NOT full files):

```
SNIPPET: healthCheckCode
```typescript
// Check pod status via Kubernetes API
const k8s = new k8s.Client();
const pods = await k8s.listPods(target);
const failed = pods.filter(p => p.status !== 'Running');

if (failed.length > 0) {
  return {
    target,
    healthy: false,
    message: `${failed.length} pods failed`,
    severity: 'critical',
    remediable: true,
  };
}

return { target, healthy: true, message: 'All pods running' };
```\u200b

SNIPPET: remediationCode
```typescript
// Restart failed pod
const validated = await this.validateRemediation(failure.target, 'restart');
if (!validated) {
  throw new Error('Remediation validation failed');
}

const k8s = new k8s.Client();
await k8s.deletePod(failure.target);

return {
  success: true,
  action: 'restart_pod',
  metadata: { target: failure.target },
};
```\u200b
```

### Benefits

1. **Reliable Parsing**
   - Simple SNIPPET: marker format (easy regex)
   - No nested JSON to parse
   - Falls back to defaults if snippet missing

2. **Compact Output**
   - ~2-3K tokens instead of 16K
   - Faster generation (1-2 minutes vs 3-4 minutes)
   - Fewer API errors

3. **Consistent Structure**
   - Templates ensure consistent file organization
   - Same structure every time
   - Easier to test and validate

4. **Domain-Specific Quality**
   - Templates optimized per domain (AIOps, Sales, etc.)
   - Best practices built into templates
   - Claude focuses on business logic only

5. **Extensible**
   - Add new domains by creating templates/{format}/{domain}/
   - Falls back to Claude generation if no templates exist
   - Gradual migration from legacy to hybrid

### Implementation in Code

**`src/agents/implementation-agent.ts`**:

```typescript
async generateCode(design, context) {
  const domain = context.research?.domain || 'general';

  // Check if domain-specific templates exist
  const hasTemplates = await this.checkTemplatesExist(domain, outputType);

  if (hasTemplates) {
    // HYBRID: Templates + Claude logic
    return await this.generateWithTemplates(design, context, domain, ...);
  } else {
    // LEGACY: Claude generates everything
    return await this.generateWithClaude(design, context);
  }
}

async generateWithTemplates(design, context, domain, ...) {
  // 1. Ask Claude for logic snippets
  const logicSnippets = await this.generateLogicSnippets(design, context);

  // 2. Prepare template data
  const templateData = {
    name: 'monitor-kubernetes-pods',
    version: '1.0.0',
    description: 'Monitor Kubernetes pods...',
    dependencies: [...],
    ...logicSnippets, // Inject healthCheckCode, remediationCode, etc.
  };

  // 3. Render templates
  const code = await this.templateManager.renderTemplate(
    outputType,
    domain,
    templateData
  );

  return code;
}
```

### Testing Results

**Before (Legacy Claude Generation)**:
- ✅ Research: 53s
- ✅ Clarification: 8s
- ✅ Design: 4.5min (strategy 1 success)
- ❌ Implementation: FAILED - "Could not parse code from response using any strategy"

**After (Hybrid Template Approach)**:
- ✅ Research: ~42s (domain: aiops detected)
- ✅ Clarification: ~8s
- ✅ Design: ~4min
- ⏳ Implementation: TESTING NOW...

### Expansion Plan

#### Phase 1: Core Domains (Current)
- ✅ AIOps (monitoring, auto-remediation)
- ⬜ Sales (lead qualification, CRM sync)
- ⬜ Automation (workflow orchestration)

#### Phase 2: Additional Formats
- ⬜ MCP Servers (templates/mcp/aiops/)
- ⬜ CLI Tools (templates/cli/aiops/)
- ⬜ Libraries (templates/library/aiops/)

#### Phase 3: All Domains
- ⬜ Code (analysis, generation)
- ⬜ Data (ETL, analytics)
- ⬜ Support (ticketing, knowledge base)

### Metrics to Track

1. **Success Rate**: % of implementations that parse successfully
2. **Token Usage**: Average tokens per implementation (target: <5K)
3. **Generation Time**: Average time for implementation phase (target: <2min)
4. **Quality**: Generated code compiles and passes basic validation

### Rollback Strategy

If hybrid approach fails:
1. Templates still exist (no harm done)
2. `checkTemplatesExist()` returns false → legacy path
3. Can manually disable by moving templates/ dir

### Next Steps

1. ✅ Create AIOps skill templates
2. ✅ Implement logic snippet generation
3. ✅ Implement template injection
4. ⏳ Test with Kubernetes monitoring agent (in progress)
5. ⬜ Create templates for other domains (Sales, Automation, etc.)
6. ⬜ Add MCP/CLI/Library variants
7. ⬜ Optimize snippet prompts for quality

---

**Status**: Hybrid approach implemented for AIOps/Skill format. Testing in progress.
