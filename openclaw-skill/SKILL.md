---
name: DEEPINDEX
description: Use DEEPINDEX CLI for semantic code search in any codebase. Use when: working on a coding task and need to find relevant files, understand architecture, locate TODOs, or trace a feature across layers. Requires DEEPINDEX installed globally (npm install -g DEEPINDEX) and Ollama running with nomic-embed-text. Do NOT use for simple one-file reads — just use the read tool directly.
---

# DEEPINDEX Skill

DEEPINDEX gives you semantic search over any codebase. It runs locally via Ollama — no cloud, no cost, fully offline.

## Before You Search: Check Index Freshness

Always verify the index exists and is current:

```bash
DEEPINDEX stats
```

If the output says "stale" or "missing", re-index first:

```bash
DEEPINDEX index
```

Re-indexing is fast (~30s for most projects). Do it after significant code changes.

---

## CLI Search (Quick)

Use `DEEPINDEX search` for fast lookups when you don't need full MCP tool context:

```bash
# Find by concept
DEEPINDEX search "authentication flow"

# Filter to a domain
DEEPINDEX search "error handling" --domain src

# More results
DEEPINDEX search "database connection" --max-results 10
```

---

## MCP Tools (In Claude Code Sessions)

When the MCP server is connected, you have 5 tools. Use them in this order of preference:

### 1. `semantic_search` — Your primary tool
Find code by meaning, not keywords. Use this first for any "find the code that does X" question.
```
semantic_search "FAISS index loading logic"
semantic_search "config file discovery" --domain config-system
semantic_search "error response formatting" --file_type typescript
```

### 2. `find_related_code` — Before making changes
Always run this before editing a file. It shows everything that depends on or relates to the file you're touching.
```
find_related_code "src/query-engine.ts"
find_related_code "embeddings/src/indexer.ts"
```

### 3. `find_todos` — Know the backlog
Run at session start or when planning what to work on next.
```
find_todos
find_todos --domain typescript-embeddings
```

### 4. `explain_error` — When debugging
Search past debug logs for similar errors and solutions.
```
explain_error "FAISS index not found"
explain_error "SQLite database locked"
```

### 5. `trace_request_flow` — For cross-layer features
Trace how a feature flows from one layer to another.
```
trace_request_flow "search query processing"
trace_request_flow "config loading"
```

---

## Setting Up MCP for a New Project

```bash
cd /path/to/project
DEEPINDEX init        # creates DEEPINDEX.json
DEEPINDEX index       # builds the vector index
DEEPINDEX mcp-config  # outputs Claude Desktop config to paste
```

Add the output JSON to your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

---

## When NOT to Use DEEPINDEX

- Reading a single known file → use `read` tool directly
- Project has fewer than ~20 files → just read them
- Index is missing and you can't run Ollama → fall back to `read` + `exec grep`
- Simple keyword grep → `exec grep -r "pattern" src/` is faster

---

## Workflow Example

Working on a bug in DEEPINDEX itself:

```
1. find_todos                          → see what's unfinished
2. semantic_search "FAISS search bug"  → find relevant code
3. find_related_code "faiss-store.ts"  → understand impact before changing
4. <make the fix>
5. DEEPINDEX index                  → re-index after changes
```
