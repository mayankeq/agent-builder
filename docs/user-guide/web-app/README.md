# Web Application User Guide

Complete guide to using the Agent-Builder web application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Creating Agents](#creating-agents)
5. [Monitoring Progress](#monitoring-progress)
6. [Managing API Keys](#managing-api-keys)
7. [Downloading Artifacts](#downloading-artifacts)
8. [Session Management](#session-management)
9. [Settings & Preferences](#settings--preferences)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Web App

1. Navigate to **https://app.agent-builder.com**
2. Click **"Sign in with Google"** (or your preferred SSO provider)
3. Authorize the application
4. You'll be redirected to your dashboard

### First-Time Setup

After your first login, you'll see a welcome tutorial. Follow these steps:

1. **Add Your API Key** - You'll need an Anthropic API key
   - Get one from [Anthropic Console](https://console.anthropic.com)
   - Add it in Settings → API Keys

2. **Explore Examples** - Review pre-configured agent templates

3. **Create Your First Agent** - Try a simple example to familiarize yourself

## Authentication

### Supported Providers

Agent-Builder supports multiple SSO providers:

- **Google** - Sign in with your Google account
- **Azure AD** - Enterprise Microsoft accounts
- **Okta** - Enterprise SSO (contact sales for setup)

### Login Process

1. Click your desired provider on the login page
2. Complete OAuth authorization
3. You'll receive a JWT token (valid for 7 days)
4. Token is stored securely in your browser

### Security Features

- **HTTPS Only** - All communication encrypted
- **JWT Tokens** - Secure, stateless authentication
- **7-Day Expiration** - Automatic token refresh
- **Multi-Device Support** - Use multiple browsers/devices
- **Logout Options** - Single device or all devices

### Troubleshooting Login

**Problem: "Authorization Failed"**
- Solution: Clear cookies and try again
- Check if your organization allows OAuth

**Problem: "Token Expired"**
- Solution: Refresh the page (auto-refresh will trigger)
- Or manually logout and login again

## Dashboard Overview

### Main Navigation

```
┌─────────────────────────────────────────────────┐
│ Agent-Builder          [Create] [Settings]      │
├─────────────────────────────────────────────────┤
│ Sidebar:                                        │
│  • Dashboard                                    │
│  • Create Agent                                 │
│  • Sessions                                     │
│  • Settings                                     │
│  • Help                                         │
└─────────────────────────────────────────────────┘
```

### Dashboard Sections

1. **Quick Stats**
   - Total sessions created
   - Completed agents
   - Average build time
   - Current in-progress sessions

2. **Recent Sessions**
   - Last 10 agent creation sessions
   - Status badges (pending, in_progress, completed, failed)
   - Quick actions (view, cancel, download, delete)

3. **Quick Actions**
   - Create new agent
   - View examples
   - Check API key status

### Status Indicators

| Badge | Meaning | Action |
|-------|---------|--------|
| 🔵 Pending | Queued, not started | Wait or cancel |
| 🟡 In Progress | Currently building | Monitor progress |
| 🟢 Completed | Successfully finished | Download artifacts |
| 🔴 Failed | Error occurred | View error details |
| ⚫ Cancelled | User cancelled | No action needed |

## Creating Agents

### Step-by-Step Process

#### Step 1: Navigate to Create Page

Click **"Create Agent"** button on dashboard or sidebar.

#### Step 2: Describe Your Agent

```
┌──────────────────────────────────────────────┐
│ What agent would you like to create?         │
│ ┌──────────────────────────────────────────┐│
│ │ Enter a detailed description...          ││
│ │                                          ││
│ │ Example:                                 ││
│ │ "A web scraper that extracts product    ││
│ │ prices from e-commerce sites, compares   ││
│ │ them, and sends alerts when prices drop" ││
│ └──────────────────────────────────────────┘│
│                                              │
│ 💡 Tip: Be specific about what you want     │
└──────────────────────────────────────────────┘
```

**Best Practices:**
- ✅ Be specific and detailed
- ✅ Include technical requirements
- ✅ Mention data sources or APIs
- ✅ Specify output format if you have preference
- ❌ Don't be too vague ("make a good agent")
- ❌ Don't include personal/sensitive data

#### Step 3: Choose Output Type

Select from four output formats:

**MCP Server** (Model Context Protocol)
- Best for: Tools that extend Claude
- Integrates with: Claude Desktop, Claude Code
- Use case: Data connectors, API wrappers

**CLI Tool** (Command-Line Interface)
- Best for: Standalone utilities
- Runs on: Terminal, scripts, CI/CD
- Use case: Automation, data processing

**Skill** (Claude Code Skill)
- Best for: Claude Code extensions
- Integrates with: Claude Code CLI
- Use case: Development tools, analyzers

**Library** (NPM/Pip Package)
- Best for: Reusable modules
- Integrates with: Any project
- Use case: SDK, utilities, helpers

#### Step 4: Select Language

Choose programming language:

**TypeScript**
- ✅ Type safety
- ✅ Great tooling (VSCode, ESLint)
- ✅ Modern async/await
- 📦 NPM package output

**Python**
- ✅ Rich ecosystem
- ✅ Data science libraries
- ✅ Simple syntax
- 📦 Pip package output

#### Step 5: Review and Create

```
┌──────────────────────────────────────────────┐
│ Review Your Agent                            │
│                                              │
│ Description: A web scraper for...           │
│ Output Type: MCP Server                      │
│ Language: TypeScript                         │
│                                              │
│ Estimated time: 20-35 minutes                │
│ Estimated cost: $0.50-2.00                   │
│                                              │
│        [Go Back]        [Create Agent]       │
└──────────────────────────────────────────────┘
```

Click **"Create Agent"** to start the build process.

## Monitoring Progress

### Real-Time Progress Tracker

After creating an agent, you'll see a live progress screen:

```
┌──────────────────────────────────────────────┐
│ Building Your Agent                          │
│                                              │
│ Current Phase: Implementation                │
│ Progress: ████████░░ 72%                     │
│                                              │
│ ✅ Clarification (completed in 3m 12s)      │
│ ✅ Design (completed in 8m 45s)             │
│ ⏳ Implementation (in progress...)          │
│ ⏹️ Packaging (queued)                        │
│ ⏹️ Learning (queued)                         │
│                                              │
│ Estimated remaining: 8 minutes               │
└──────────────────────────────────────────────┘
```

### Five Phases Explained

**1. Clarification (2-5 minutes)**
- Gathers detailed requirements
- Asks targeted questions
- Validates technical constraints
- Output: Structured requirements document

**2. Design (5-10 minutes)**
- Uses Claude's extended thinking
- Analyzes architectural approaches
- Makes technology choices
- Documents design decisions
- Output: Complete architecture specification

**3. Implementation (10-15 minutes)**
- Generates source code
- Creates comprehensive tests
- Writes documentation
- Runs in parallel for speed
- Output: Working code with tests

**4. Packaging (2-5 minutes)**
- Configures build system
- Adds package metadata
- Creates distribution files
- Output: Ready-to-use package

**5. Learning (< 1 minute)**
- Extracts patterns
- Stores metrics
- Updates recommendation system
- Output: Enhanced future builds

### Progress Indicators

- **Percentage Bar** - Overall completion (0-100%)
- **Phase Status** - Current workflow phase
- **Time Estimates** - Remaining time prediction
- **Live Logs** - Detailed activity stream (optional)

### What to Do During Build

1. **Keep Tab Open** - WebSocket maintains connection
2. **Check Periodically** - Builds take 20-35 minutes
3. **Don't Refresh** - You'll lose WebSocket connection
4. **Can Close Tab** - Progress saved; check back later

## Managing API Keys

### Why You Need an API Key

Agent-Builder uses your own LLM API key (BYOK - Bring Your Own Key):

- **Cost Control** - You only pay for what you use
- **Privacy** - Your key, your data
- **Free Platform** - No subscription fees

### Adding an API Key

1. Navigate to **Settings → API Keys**
2. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
3. Click **"Add API Key"**
4. Paste your key (format: `sk-ant-api03-...`)
5. Click **"Save"**

### Security Features

- **Encrypted Storage** - AES-256-GCM encryption
- **Server-Side Key** - Encryption key in secure environment
- **Never Transmitted** - Key stays encrypted at rest
- **Never Displayed** - Can't view after saving

### Validating Your Key

1. Go to **Settings → API Keys**
2. Click **"Validate Key"**
3. System makes test API call
4. Shows ✅ Valid or ❌ Invalid

**What Validation Checks:**
- Key format is correct
- Key authenticates with Anthropic
- Key has sufficient credits
- API is accessible

### Updating Your Key

1. Go to **Settings → API Keys**
2. Click **"Update Key"**
3. Enter new key
4. Click **"Save"**

Old key is securely deleted.

### Deleting Your Key

1. Go to **Settings → API Keys**
2. Click **"Delete Key"**
3. Confirm deletion
4. Key permanently removed

⚠️ **Warning**: You won't be able to create agents without a valid key.

### Troubleshooting API Keys

**Problem: "Invalid API key format"**
- Solution: Ensure key starts with `sk-ant-`
- Check for spaces or extra characters

**Problem: "API key validation failed"**
- Solution: Verify key works in [Anthropic Console](https://console.anthropic.com)
- Check if key has sufficient credits

**Problem: "Cannot create agent: No API key"**
- Solution: Add a valid API key first
- Validate key after adding

## Downloading Artifacts

### When Downloads Are Available

Downloads become available when session status is **"Completed"**.

### Download Methods

#### Method 1: Direct Download

1. Go to session detail page
2. Click **"Download Artifacts"** button
3. ZIP file downloads automatically
4. Extract locally

```bash
# Extract downloaded artifacts
unzip session-id.zip -d my-agent
cd my-agent
```

#### Method 2: Presigned URL

For large files or programmatic access:

1. Click **"Get Download Link"**
2. Copy presigned URL (valid for 1 hour)
3. Use with wget/curl:

```bash
wget "https://s3.amazonaws.com/..." -O artifacts.zip
```

### What's Included in Downloads

```
artifacts/
├── src/                    # Source code
│   ├── index.ts
│   ├── lib/
│   └── ...
├── tests/                  # Test files
│   ├── unit/
│   └── integration/
├── docs/                   # Documentation
│   ├── README.md
│   ├── API.md
│   └── examples/
├── package.json            # Package config
├── tsconfig.json           # TypeScript config (if TS)
├── .gitignore
└── LICENSE
```

### Using Downloaded Agents

**For TypeScript Projects:**
```bash
cd artifacts
npm install
npm run build
npm test
npm run start
```

**For Python Projects:**
```bash
cd artifacts
pip install -r requirements.txt
pytest
python src/main.py
```

**For MCP Servers:**
```bash
# Add to claude_desktop_config.json
{
  "mcpServers": {
    "my-agent": {
      "command": "node",
      "args": ["/path/to/artifacts/dist/index.js"]
    }
  }
}
```

### Storage Retention

- **First 7 days**: Standard S3 storage (fast access)
- **After 7 days**: Moved to Glacier (slower access)
- **After 90 days**: Automatically deleted

💡 **Tip**: Download important agents within 7 days for best performance.

## Session Management

### Viewing All Sessions

Navigate to **Sessions** page to see all your agent creation history.

### Filtering Sessions

Filter by status:
- **All** - Show everything
- **Completed** - Only successful builds
- **Failed** - Only errors
- **In Progress** - Currently running

### Session Actions

**View Details**
- Click session row
- See full requirements, design, audit log
- View error messages (if failed)

**Cancel Session**
- Click "Cancel" button
- Only works for pending/in_progress
- Frees up resources immediately

**Delete Session**
- Click "Delete" button
- Removes session and artifacts
- Cannot be undone

**Download Artifacts**
- Only for completed sessions
- Click "Download" button
- See [Downloading Artifacts](#downloading-artifacts)

### Session Details Page

Detailed view shows:

1. **Overview**
   - Session ID
   - Creation time
   - Duration
   - Status

2. **Configuration**
   - Original description
   - Output type
   - Language
   - Options

3. **Progress Timeline**
   - All five phases
   - Completion times
   - Status for each

4. **Audit Log**
   - All events
   - Timestamps
   - User actions

5. **Metadata**
   - Requirements document
   - Design decisions
   - Thinking trace (if available)

## Settings & Preferences

### Account Settings

**Profile Information**
- Email (from SSO, cannot change)
- Name
- OAuth provider

**Session Management**
- View active sessions
- Logout from specific devices
- Logout from all devices

### API Keys

See [Managing API Keys](#managing-api-keys) section.

### Preferences

**UI Settings**
- Theme: Light/Dark/Auto
- Compact/Comfortable view
- Show/hide tutorial

**Notifications**
- Email on completion (coming soon)
- Browser notifications (coming soon)

**Privacy**
- Session data retention
- Analytics opt-in/out

### Danger Zone

⚠️ **Delete Account**
- Permanently deletes all data
- Removes all sessions
- Deletes API keys
- Cannot be undone

## Troubleshooting

### Common Issues

**Issue: Cannot login**
- Clear browser cookies
- Try incognito/private mode
- Check OAuth provider status
- Contact support if persistent

**Issue: "No API key configured"**
- Add API key in Settings
- Validate key after adding
- Check key has sufficient credits

**Issue: Session stuck in "pending"**
- Refresh the page
- Wait 5 minutes (queue processing)
- Cancel and retry if > 10 minutes

**Issue: Session failed**
- View error message in session details
- Common causes:
  - Invalid API key
  - Insufficient credits
  - Network timeout
  - Invalid input

**Issue: Download not available**
- Check session status is "completed"
- Artifacts may be in Glacier (wait 3-5 hours)
- Session may be > 90 days old (deleted)

**Issue: Slow performance**
- Check internet connection
- Try different browser
- Clear browser cache
- Disable browser extensions

### Getting Help

**Documentation**
- This guide
- [API Documentation](../../api/README.md)
- [FAQ](../../reference/faq.md)

**Support Channels**
- Email: support@agent-builder.com
- GitHub Issues: [Report bug](https://github.com/agent-builder/issues)
- Community Forum: [Ask question](https://github.com/agent-builder/discussions)

**Enterprise Support**
- Priority support
- SLA guarantees
- Dedicated account manager
- Contact: sales@agent-builder.com

## Best Practices

### Crafting Good Descriptions

✅ **Good Examples:**
```
"A web scraper that monitors product prices on Amazon,
stores historical data in PostgreSQL, and sends email
alerts when prices drop below a threshold. Should handle
rate limiting and use puppeteer for JavaScript rendering."
```

```
"A CLI tool that analyzes Python code quality, checks for
PEP 8 compliance, calculates complexity metrics, and
generates HTML reports. Should integrate with CI/CD pipelines."
```

❌ **Bad Examples:**
```
"Make a scraper"  # Too vague

"A tool that does everything I need"  # Not specific

"[200 word essay about what you want]"  # Too long
```

### Optimizing Build Time

- **Be specific** - Reduces clarification rounds
- **Use examples** - Reference existing patterns
- **Simple first** - Start basic, iterate later
- **Check examples** - Use pre-configured templates

### Cost Management

Average cost per agent: **$0.50-2.00**

**Cost Factors:**
- **Complexity** - More features = more tokens
- **Clarification rounds** - Each round costs tokens
- **Language** - Python slightly cheaper than TypeScript
- **Output type** - MCP servers most complex

**Saving Tips:**
- Use examples as starting points
- Be clear and specific (reduce clarification)
- Start simple, extend later
- Monitor Anthropic console for usage

### Security Best Practices

- **Never share your API key**
- **Use SSO authentication**
- **Logout when done** (on shared computers)
- **Review downloaded code** before running
- **Don't include sensitive data** in descriptions
- **Delete old sessions** you don't need

## Next Steps

Now that you know how to use the web application:

1. **Create Your First Agent** - Try a simple example
2. **Explore Examples** - See pre-configured templates
3. **Read API Docs** - For programmatic access
4. **Join Community** - Share your creations

---

**Questions?** Check our [FAQ](../../reference/faq.md) or [contact support](mailto:support@agent-builder.com).
