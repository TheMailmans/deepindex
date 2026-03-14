# Changelog

All notable changes to DEEPINDEX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Removed broken `watch` script referencing non-existent `watcher.ts`
- Fixed `init-project.sh` hardcoding absolute `rootDir` path (now uses `"."`)

### Added
- `prepublishOnly` build step in `embeddings/package.json` — ensures dist is always fresh on publish
- `scripts/init-project.js` — cross-platform Node.js init script (works on Windows, macOS, Linux)
- `docs/setup.md` — full step-by-step setup guide from Ollama install through MCP config
- `openclaw-skill/SKILL.md` — OpenClaw agent skill for using DEEPINDEX in AI assistant workflows
- `*.faiss` to `.gitignore`

### Changed
- Rewrote `README.md` — sharper, faster to scan, 30-second install path up front

## [0.1.0] - 2026-01-09

### Added

- Initial release of DEEPINDEX
- Semantic code search using Ollama embeddings (nomic-embed-text)
- Hybrid search combining FAISS vector search + SQLite FTS5 keyword search
- MCP server with 5 specialized tools for Claude Code integration
- Three-tier search fallback (hybrid → rerank → keyword)
- CLI commands:
  - `DEEPINDEX init` - Initialize project configuration
  - `DEEPINDEX index` - Build embeddings index
  - `DEEPINDEX search` - Search codebase semantically
  - `DEEPINDEX stats` - Show index statistics
  - `DEEPINDEX doctor` - Environment health check
  - `DEEPINDEX clean` - Remove index data
  - `DEEPINDEX mcp-config` - Output Claude Desktop configuration
  - `DEEPINDEX mcp` - Run MCP server
- Configuration auto-discovery (walks up directories to find DEEPINDEX.json)
- Manifest system for stale index detection
- Security hardening:
  - Path validation and traversal prevention
  - Input sanitization
  - Resource limits
  - Concurrency control
- Support for multiple languages: TypeScript, Rust, Python, Go, Java, Markdown
- Chunking by semantic boundaries (functions, classes, sections)

### Security

- Path traversal prevention in file operations
- Query sanitization for FTS5 searches
- Resource limits to prevent runaway processes
- `.DEEPINDEXignore` for excluding sensitive files

[Unreleased]: https://github.com/themailmans/DEEPINDEX/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/themailmans/DEEPINDEX/releases/tag/v0.1.0
