# Getting Started with EmbedContext

Get semantic code search working in under 5 minutes.

## Quick Start

```bash
# 1. Install
npm install -g embedcontext

# 2. Initialize (in your project)
cd your-project
embedcontext init

# 3. Build index
embedcontext index

# 4. Search!
embedcontext search "authentication flow"
```

## Prerequisites

- **Node.js 18+**
- **Ollama** with `nomic-embed-text` model

### Installing Ollama

```bash
# macOS
brew install ollama
ollama serve
ollama pull nomic-embed-text

# Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull nomic-embed-text
```

## Verify Setup

```bash
embedcontext doctor
```

Expected output:
```
🩺 EmbedContext Doctor

  ✓ Node.js          v20.x.x
  ✓ Config file      /path/to/embedcontext.json
  ✓ Ollama server    Connected
  ✓ Embedding model  nomic-embed-text
  ✓ Search tier      hybrid (semantic + keyword)
```

## Claude Desktop Integration

Generate MCP configuration:

```bash
embedcontext mcp-config
```

Add the output to your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Next Steps

- [Configuration Guide](./configuration.md) - Customize domains and patterns
- [MCP Integration](./mcp-integration.md) - Use with Claude Desktop
- [Installation Guide](./installation.md) - Platform-specific setup
