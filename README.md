# DevContext - Universal Development Context System

Semantic embeddings + auto-generated memory bank for ANY codebase.

## What is DevContext?

DevContext is a universal development tool that combines:
- **Semantic code search** using Ollama embeddings (offline, local)
- **Auto-generated memory bank** providing LLM context about your project
- **MCP integration** for Claude Code with 5 specialized search tools

Unlike project-specific tools, DevContext works with ANY codebase through simple JSON configuration.

## Features

- 🔍 **Semantic Code Search** - Find code by meaning, not just keywords
- 📚 **Auto-Generated Documentation** - Memory bank files from your codebase
- 🔌 **Claude Code Integration** - 5 MCP tools for intelligent code assistance
- 🎯 **Universal** - Works with Rust, TypeScript, Python, Go, Java, and more
- ⚙️ **Configurable** - Simple JSON config for domains and keywords
- 🚀 **Local & Fast** - Runs entirely on your machine with Ollama

## Quick Start

```bash
# 1. Clone DevContext
git clone https://github.com/yourusername/DevContext.git
cd DevContext

# 2. Install dependencies
cd embeddings && npm install && npm run build

# 3. Initialize in your project
cd /path/to/your/project
bash /path/to/DevContext/scripts/init-project.sh

# 4. Configure domains (edit devcontext.json)
# 5. Build embeddings index
devcontext-embed index

# 6. Generate memory bank
devcontext-generate

# 7. Setup Claude Desktop MCP
bash /path/to/DevContext/scripts/setup-mcp.sh
```

## How It Works

1. **Configuration** - Define project domains in `devcontext.json`
2. **Indexing** - Code is chunked and embedded using Ollama (nomic-embed-text)
3. **Search** - Semantic + keyword hybrid search with FAISS and SQLite FTS5
4. **Memory Bank** - Templates generate context files from embeddings queries
5. **MCP Tools** - Claude Code gets 5 specialized search tools via MCP

## MCP Tools

- `semantic_search` - Find code by conceptual similarity
- `find_related_code` - Discover related implementations
- `explain_error` - Search debug logs for solutions
- `find_todos` - List all TODO/FIXME markers
- `trace_request_flow` - Trace features across layers

## Documentation

- [Setup Guide](docs/setup.md) - Installation and configuration
- [Configuration Reference](docs/configuration.md) - Complete config options
- [Customization Guide](docs/customization.md) - Templates and generators
- [MCP Integration](docs/mcp-integration.md) - Claude Desktop setup

## Requirements

- Node.js 18+
- Ollama with `nomic-embed-text` model
- Claude Desktop (for MCP integration)

## License

MIT

## Credits

Extracted from PlexMCP development tools on December 28, 2025.
