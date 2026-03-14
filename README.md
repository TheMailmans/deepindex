![DeepIndex Banner](assets/banner.svg)

# DeepIndex

[![npm version](https://img.shields.io/npm/v/deepindex?color=blue)](https://www.npmjs.com/package/deepindex)
[![CI](https://github.com/themailmans/deepindex/actions/workflows/ci.yml/badge.svg)](https://github.com/themailmans/deepindex/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**Local-first semantic code search + MCP tools for Claude Code. No cloud. No cost. Runs on your machine.**

## What it does

DeepIndex indexes your codebase with local Ollama embeddings and exposes 5 search tools to Claude Code via MCP. Instead of pasting files into context, Claude searches your codebase semantically — finding the right code by meaning, not just keywords.

## How it works

```
Your Codebase
     │
     ▼
┌──────────────┐    chunks     ┌──────────────────┐    vectors    ┌────────────┐
│   deepindex  │──────────────▶│  Ollama (local)  │──────────────▶│ FAISS Index│
│    index     │               │ nomic-embed-text  │               │ + SQLite   │
└──────────────┘               └──────────────────┘               └─────┬──────┘
                                                                         │
                                                                         ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│  Claude Code (MCP)                                                            │
│  semantic_search · find_related_code · find_todos · explain_error · trace     │
└───────────────────────────────────────────────────────────────────────────────┘
```

1. **Index** — your code is chunked by semantic boundaries (functions, classes, sections)
2. **Embed** — each chunk runs through Ollama locally, no data leaves your machine
3. **Search** — Claude Code calls the MCP tools, running hybrid semantic + keyword search
4. **Result** — Claude gets exact files and line ranges, without you pasting anything

## Quick Install

Requires [Ollama](https://ollama.com) running with `nomic-embed-text`:

```bash
ollama pull nomic-embed-text
npm install -g deepindex

cd your-project
deepindex init        # creates deepindex.json
deepindex index       # builds vector index (~30s)
deepindex mcp-config  # outputs Claude Desktop config
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
deepindex doctor      # check environment health
deepindex init        # create deepindex.json
deepindex index       # build/rebuild vector index
deepindex search "query"  # search from the terminal
deepindex stats       # index status and chunk counts
deepindex clean       # remove index data
deepindex mcp-config  # output Claude Desktop MCP config
```

## Why local?

- **Free:** No API calls, no per-query cost
- **Private:** Your code never leaves your machine
- **Fast:** FAISS + SQLite FTS5 hybrid search, results in milliseconds
- **Works offline:** No internet required after setup

## Who is this for?

- **Claude Code users** who work from the CLI and don't have IDE workspace context
- **Teams with private codebases** that can't be uploaded to cloud services
- **Any project** — works with TypeScript, Rust, Python, Go, Java, or mixed repos via simple JSON config

## Configuration

`deepindex.json` in your project root controls what gets indexed:

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

Use `.deepindexignore` to exclude files (same syntax as `.gitignore`).

## Requirements

- Node.js 18+
- Ollama with `nomic-embed-text` model

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports, feature requests, and PRs are welcome.

## License

MIT © [Tyler Mailman](https://github.com/themailmans)
