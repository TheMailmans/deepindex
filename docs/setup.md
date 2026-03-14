# EmbedContext Setup Guide

Full step-by-step setup from scratch to first search.

## Requirements

- Node.js 18+
- Ollama (for local embeddings)

---

## Step 1 — Install Ollama

**macOS:**
```bash
brew install ollama
```

**Windows:** Download from [ollama.com](https://ollama.com) and run the installer.

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Start Ollama:
```bash
ollama serve
```

---

## Step 2 — Pull the Embedding Model

```bash
ollama pull nomic-embed-text
```

This is the only model EmbedContext needs. ~270MB, runs fully offline.

---

## Step 3 — Install EmbedContext

```bash
npm install -g embedcontext
```

Verify it's installed:
```bash
embedcontext --version
```

---

## Step 4 — Verify Your Setup

```bash
embedcontext doctor
```

All checks should be green:
```
✓ Node.js         v20.x.x
✓ Ollama server   Connected (http://localhost:11434)
✓ Embedding model nomic-embed-text
✓ Search tier     Hybrid (semantic + keyword)
```

If Ollama shows red: make sure `ollama serve` is running in another terminal.

---

## Step 5 — Initialize Your Project

Navigate to your project root:
```bash
cd /path/to/your/project
embedcontext init
```

This creates `embedcontext.json`. Review it and adjust the `domains` section to match your project structure.

---

## Step 6 — Build the Index

```bash
embedcontext index
```

This crawls your codebase, chunks the files, runs them through Ollama, and builds a FAISS vector index. Takes ~30 seconds for small projects, a few minutes for large ones.

---

## Step 7 — Test a Search

```bash
embedcontext search "authentication flow"
```

You should see ranked results with file paths, line numbers, and code snippets.

---

## Step 8 — Connect to Claude Code (MCP)

Generate your MCP config:
```bash
embedcontext mcp-config
```

Copy the output and add it to your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop. You'll now have 5 semantic search tools available in every coding session.

---

## Keeping the Index Fresh

Re-index after significant code changes:
```bash
embedcontext index
```

Check if your index is stale:
```bash
embedcontext stats
```

---

## Excluding Files

Create `.embedcontextignore` in your project root (same syntax as `.gitignore`):
```
node_modules/
dist/
*.lock
secrets/
```

---

## Troubleshooting

**"Ollama not reachable"**
→ Run `ollama serve` in a separate terminal

**"nomic-embed-text not found"**
→ Run `ollama pull nomic-embed-text`

**"Index not found"**
→ Run `embedcontext index` first

**Slow indexing**
→ Normal for large codebases. Reduce scope by tightening domain patterns in `embedcontext.json`

**Wrong files being indexed**
→ Add exclusions to `.embedcontextignore`
