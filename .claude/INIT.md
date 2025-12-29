# Claude Code Initialization Protocol

When starting a session in this project:

1. **Read Memory Bank** - Load context from `.claude/memory-bank/`
2. **Initialize Embeddings** - Run embeddings MCP server for semantic search
3. **Review Recent Commits** - Check git history for latest changes

## Memory Bank Structure
- `core/brief.md` - Project overview
- `core/product.md` - Features and capabilities
- `core/architecture.md` - Technical architecture
- `core/tech.md` - Technology stack
- `core/context.md` - Development context
- `knowledge/*.md` - Domain-specific knowledge

## Available MCP Tools
- `semantic_search` - Search code semantically
- `find_related_code` - Find related implementations
- `explain_error` - Search debug logs for solutions
- `find_todos` - List all TODO/FIXME markers
- `trace_request_flow` - Trace feature across layers
