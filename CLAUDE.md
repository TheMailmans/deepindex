# EmbedContext - Claude Code Project Configuration

> **EmbedContext** — local-first code indexing + semantic search + MCP tools for Claude

## Project Overview

EmbedContext is a **universal development context system** that provides semantic code search and auto-generated memory banks for any codebase. It gives Claude fast, local understanding of your codebase without uploading it anywhere.

**Status:** v0.1.0 (beta) - actively being developed for open-source release
**Author:** Tyler Mailman

## Quick Context

- **What:** Semantic embeddings + memory bank system for AI-assisted development
- **Why:** Give Claude Code persistent project context across sessions
- **How:** Ollama embeddings (nomic-embed-text), FAISS indexes, MCP server

## Architecture

```
EmbedContext/
├── embeddings/           # Core semantic search system (TypeScript)
│   ├── src/
│   │   ├── cli.ts              # CLI interface (index, search commands)
│   │   ├── mcp-server.ts       # MCP server exposing tools to Claude
│   │   ├── query-engine.ts     # Hybrid semantic + keyword search
│   │   ├── faiss-store.ts      # FAISS vector index management
│   │   ├── metadata-store.ts   # SQLite FTS5 for keyword search
│   │   ├── ollama-embedding.ts # Ollama API integration
│   │   ├── config/
│   │   │   └── config-loader.ts    # JSON config loading
│   │   └── chunkers/
│   │       ├── base-chunker.ts     # Abstract chunking logic
│   │       ├── rust-chunker.ts     # Rust-specific parsing
│   │       ├── typescript-chunker.ts
│   │       └── markdown-chunker.ts
│   └── dist/             # Compiled output
├── memory-bank/          # Auto-generated context files
│   ├── scripts/
│   │   └── generate.js   # Memory bank generator
│   └── templates/        # Mustache-style templates
├── config/               # JSON schemas and examples
├── scripts/              # Installation helpers
├── .embedcontext/
│   └── data/             # Embeddings index (FAISS, SQLite)
├── .claude/
│   ├── INIT.md           # Session initialization protocol
│   └── memory-bank/      # Generated context files
│       ├── core/         # Project-wide context
│       └── knowledge/    # Domain-specific knowledge
└── embedcontext.json     # Project configuration
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `embedcontext.json` | Project config: domains, patterns, keywords |
| `embeddings/src/mcp-server.ts` | MCP server with 5 search tools |
| `embeddings/src/query-engine.ts` | Core search logic (hybrid semantic + FTS5) |
| `embeddings/src/config/config-loader.ts` | Configuration management |
| `memory-bank/scripts/generate.js` | Memory bank content generation |

## MCP Tools Available

When working in this project, you have access to these semantic search tools:

1. **semantic_search** - Find code by meaning
   ```
   semantic_search "configuration loading" --domain config-system
   ```

2. **find_related_code** - Find related implementations
   ```
   find_related_code "embeddings/src/query-engine.ts"
   ```

3. **explain_error** - Search debug logs (if any)
   ```
   explain_error "FAISS index not found"
   ```

4. **find_todos** - List TODO/FIXME markers
   ```
   find_todos --domain typescript-embeddings
   ```

5. **trace_request_flow** - Trace across layers
   ```
   trace_request_flow "search query processing"
   ```

## Domains

- **typescript-embeddings** - Core search engine (`embeddings/src/**/*.ts`)
- **javascript-memory-bank** - Generation scripts (`memory-bank/scripts/**/*.js`)
- **templates** - Mustache templates (`memory-bank/templates/**/*.template`)
- **config-system** - Configuration (`config/**/*.json`, `embeddings/src/config/**/*.ts`)
- **scripts** - Shell/JS utilities (`scripts/**/*.{sh,js}`)
- **docs** - Documentation (`*.md`, `docs/**/*.md`)

## Development Workflows

### Re-index Embeddings
```bash
cd /Users/tylermailman/Documents/GitHub/DevContext
node embeddings/dist/cli.js index
```

### Regenerate Memory Bank
```bash
node memory-bank/scripts/generate.js
```

### Test MCP Server
```bash
node embeddings/dist/mcp-server.js
```

### Build Embeddings TypeScript
```bash
cd embeddings && npm run build
```

## Current Development Focus

This project is being actively developed for open-source release. Key areas:

1. **Rename to EmbedContext** - Complete branding and package renaming
2. **Three-Tier Fallback** - hybrid → rerank → keyword search modes
3. **Security Hardening** - Input validation, path sandboxing, resource limits
4. **New Commands** - doctor, mcp-config, clean, init improvements
5. **Documentation** - Complete setup guides and API docs

## Session Initialization

When starting a session:

1. Read `.claude/memory-bank/core/brief.md` for project overview
2. Use `semantic_search` to explore unfamiliar code
3. Check `find_todos` to see pending work
4. Review recent `git log --oneline -10` for context

## Important Notes

- **Ollama Required** - Ensure `ollama serve` is running with `nomic-embed-text` model
- **Config Auto-Discovery** - Commands auto-find `embedcontext.json` by walking up directories
- **Self-Documenting** - This project uses itself for its own development context
