# EmbedContext

> **Local-first code indexing + semantic search + MCP tools for Claude**

EmbedContext gives Claude fast, local understanding of your codebase without uploading it anywhere.

## What is EmbedContext?

EmbedContext is a universal development context system that combines:
- **Semantic code search** using Ollama embeddings (local, offline-capable)
- **Auto-generated memory bank** providing persistent LLM context
- **MCP integration** for Claude Code with 5 specialized search tools

Works with ANY codebase through simple JSON configuration.

## Features

- **Semantic Code Search** - Find code by meaning, not just keywords
- **Hybrid Search** - Combines semantic + SQLite FTS5 keyword search
- **Claude Code Integration** - 5 MCP tools for intelligent code assistance
- **Universal** - Works with Rust, TypeScript, Python, Go, Java, and more
- **Configurable** - Simple JSON config for domains and patterns
- **Local & Fast** - Runs entirely on your machine with Ollama

## Quick Start

```bash
# Install globally
npm install -g embedcontext

# Initialize in your project
cd your-project
embedcontext init

# Build embeddings index
embedcontext index

# Search your codebase
embedcontext search "authentication flow"
```

## MCP Tools for Claude

When connected to Claude Desktop, you get 5 specialized tools:

- `semantic_search` - Find code by conceptual similarity
- `find_related_code` - Discover related implementations
- `explain_error` - Search debug logs for solutions
- `find_todos` - List all TODO/FIXME markers
- `trace_request_flow` - Trace features across layers

### Claude Desktop Setup

```bash
# Generate MCP config for Claude Desktop
embedcontext mcp-config
```

Add the output to your Claude Desktop configuration file.

## Configuration

Create `embedcontext.json` in your project root:

```json
{
  "schemaVersion": 1,
  "projectName": "my-project",
  "projectType": "typescript",
  "rootDir": ".",
  "indexDir": ".embedcontext",
  "domains": [
    {
      "name": "src",
      "patterns": ["src/**/*.ts"],
      "description": "Source code"
    }
  ]
}
```

## Commands

| Command | Description |
|---------|-------------|
| `embedcontext init` | Initialize config in current directory |
| `embedcontext index` | Build embeddings index |
| `embedcontext search <query>` | Search codebase |
| `embedcontext stats` | Show index statistics |
| `embedcontext mcp-config` | Output MCP config for Claude Desktop |
| `embedcontext doctor` | Check environment setup |
| `embedcontext clean` | Remove index data |

## Requirements

- Node.js 18+
- Ollama with `nomic-embed-text` model
- Claude Desktop (for MCP integration)

### Install Ollama

```bash
# macOS
brew install ollama
ollama serve
ollama pull nomic-embed-text
```

## How It Works

1. **Configure** - Define project domains in `embedcontext.json`
2. **Index** - Code is chunked and embedded using Ollama
3. **Search** - Semantic + keyword hybrid search with FAISS + SQLite FTS5
4. **MCP** - Claude Code gets 5 specialized search tools

## License

MIT - Tyler Mailman
