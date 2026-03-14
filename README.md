# EmbedContext

Local-first semantic code search + MCP tools for Claude Code. No cloud. No cost. Runs on your machine.

## What it does

EmbedContext indexes your codebase with local Ollama embeddings and exposes 5 search tools to Claude Code via MCP. Instead of pasting files into context, Claude searches your codebase semantically — finding the right code by meaning, not just keywords.

## Quick Install

Requires [Ollama](https://ollama.com) running with `nomic-embed-text`:

```bash
ollama pull nomic-embed-text
npm install -g embedcontext

cd your-project
embedcontext init     # creates embedcontext.json
embedcontext index    # builds vector index (~30s)
embedcontext mcp-config  # outputs Claude Desktop config
```

Add the MCP config output to your Claude Desktop settings and restart. Done.

→ Full guide: [docs/setup.md](docs/setup.md)

## 5 MCP Tools

| Tool | What it does |
|------|-------------|
| `semantic_search` | Find code by meaning, not keywords |
| `find_related_code` | Show everything related to a file before you change it |
| `explain_error` | Search debug history for similar errors and solutions |
| `find_todos` | List every TODO/FIXME in the codebase by domain |
| `trace_request_flow` | Trace a feature across frontend, backend, and database layers |

## CLI Commands

```bash
embedcontext doctor      # check environment health
embedcontext init        # create embedcontext.json
embedcontext index       # build/rebuild vector index
embedcontext search "query"  # search from the terminal
embedcontext stats       # index status and chunk counts
embedcontext clean       # remove index data
embedcontext mcp-config  # output Claude Desktop MCP config
```

## Why local?

- **Free:** No API calls, no per-query cost
- **Private:** Your code never leaves your machine
- **Fast:** FAISS + SQLite FTS5 hybrid search, results in milliseconds
- **Works offline:** No internet required after setup

## Configuration

`embedcontext.json` in your project root controls what gets indexed:

```json
{
  "projectName": "my-project",
  "projectType": "typescript",
  "rootDir": ".",
  "domains": [
    {
      "name": "src",
      "patterns": ["src/**/*.ts"],
      "description": "Source code"
    }
  ],
  "embeddingsModel": "nomic-embed-text",
  "chunkSize": 512
}
```

Use `.embedcontextignore` to exclude files (same syntax as `.gitignore`).

## Requirements

- Node.js 18+
- Ollama with `nomic-embed-text` model

## License

MIT — Tyler Mailman
