# MCP Integration with Claude Desktop

EmbedContext provides an MCP (Model Context Protocol) server that gives Claude Desktop semantic search capabilities for your codebase.

## Setup

### 1. Generate Configuration

```bash
embedcontext mcp-config
```

This outputs JSON configuration for Claude Desktop.

### 2. Add to Claude Desktop

Edit your Claude Desktop config file:

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

Add the `mcpServers` section from the output:

```json
{
  "mcpServers": {
    "embedcontext-my-project": {
      "command": "npx",
      "args": ["embedcontext-mcp"],
      "env": {
        "EMBEDCONTEXT_CONFIG": "/path/to/your/project/embedcontext.json"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

## Available Tools

Once connected, Claude has access to these tools:

### semantic_search

Find code by meaning, not just keywords.

```
"Find authentication middleware"
"How is user validation handled?"
"Show me database connection code"
```

### find_related_code

Discover code related to a specific file.

```
"Find code related to src/auth/login.ts"
"What depends on the User model?"
```

### explain_error

Search debug logs for error patterns and solutions.

```
"Find logs about connection timeout"
"Search for authentication failures"
```

### find_todos

List all TODO/FIXME markers in the codebase.

```
"Show all TODOs"
"Find pending work in the API"
```

### trace_request_flow

Trace features across frontend, backend, and database layers.

```
"Trace the user login flow"
"How does checkout work end-to-end?"
```

## Using with Claude

Once configured, you can ask Claude natural language questions about your codebase:

- "How does authentication work in this project?"
- "Find where API errors are handled"
- "Show me the database schema for users"
- "What tests exist for the payment module?"

Claude will use the semantic search tools to find relevant code and explain it.

## Multiple Projects

You can add multiple EmbedContext servers for different projects:

```json
{
  "mcpServers": {
    "embedcontext-frontend": {
      "command": "npx",
      "args": ["embedcontext-mcp"],
      "env": {
        "EMBEDCONTEXT_CONFIG": "/path/to/frontend/embedcontext.json"
      }
    },
    "embedcontext-backend": {
      "command": "npx",
      "args": ["embedcontext-mcp"],
      "env": {
        "EMBEDCONTEXT_CONFIG": "/path/to/backend/embedcontext.json"
      }
    }
  }
}
```

## Troubleshooting

### MCP server not connecting

1. Check Ollama is running: `ollama serve`
2. Verify index exists: `embedcontext stats`
3. Check config path is correct and absolute

### Slow responses

The first query may be slow while loading the index. Subsequent queries are faster.

### "Index not found" error

Build the index first:
```bash
cd /path/to/your/project
embedcontext index
```

### Stale results

Rebuild the index after code changes:
```bash
embedcontext index
```

The MCP server will warn if the index is stale.
