# DEEPINDEX Roadmap

Known gaps, planned improvements, and future ideas.

## Active TODOs in Code

### `embeddings/src/cli.ts:158`
```typescript
const searchTier: SearchTier = 'hybrid'; // TODO: detect actual tier
```
The manifest records the search tier used at index time, but the `index` command always writes `'hybrid'` rather than detecting which tier actually ran. Should call `detectSearchTier()` after indexing completes and write the real tier to the manifest.

---

## Planned Features

### Better File Watching
`chokidar` is a dependency but no watcher implementation exists yet. The plan is an `DEEPINDEX watch` command that incrementally re-indexes changed files without a full rebuild.

### Python + Go Chunkers
Current chunkers cover TypeScript, Rust, and Markdown. Python and Go get the generic base-chunker fallback. Dedicated chunkers for these languages would improve chunk quality for those codebases.

### Reranking Tier
The three-tier search design (hybrid → rerank → keyword) is scaffolded in `search-tier.ts` but the rerank tier is not implemented. Would use a cross-encoder model (likely a small local one via Ollama) to rerank FAISS results by relevance.

### `DEEPINDEX update`
Incremental re-indexing of only files changed since last index (using manifest timestamps), rather than full rebuild every time.

### Windows MCP Path Generation
`mcp-config.ts` generates correct paths but should auto-detect OS and format the config path hint accordingly (`%APPDATA%` vs `~/Library/...`).

### Testing
No test suite exists yet. Priority areas:
- Config loader (path resolution edge cases, Windows paths)
- Chunkers (symbol extraction, TODO detection)
- Manifest (stale detection)

---

## Done (v0.1.0)

- ✅ Hybrid semantic + FTS5 keyword search
- ✅ FAISS vector index with SQLite metadata
- ✅ MCP server with 5 tools
- ✅ CLI: init, index, search, stats, doctor, clean, mcp-config
- ✅ Config auto-discovery (walks up directories)
- ✅ Stale index detection via manifest
- ✅ Security: path traversal prevention, query sanitization, resource limits
- ✅ `.DEEPINDEXignore` support
- ✅ TypeScript, Rust, Markdown chunkers
- ✅ Cross-platform path handling
