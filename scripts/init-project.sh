#!/usr/bin/env bash
set -e

echo "🚀 EmbedContext Initialization"
echo ""

# Detect project root
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Detect project type
detect_project_type() {
  if [ -f "Cargo.toml" ]; then
    echo "rust"
  elif [ -f "package.json" ]; then
    echo "typescript"
  elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    echo "python"
  else
    echo "mixed"
  fi
}

PROJECT_TYPE=$(detect_project_type)
echo "Detected project type: $PROJECT_TYPE"

# Create embedcontext.json
echo ""
echo "📝 Creating configuration file..."

cat > embedcontext.json <<EOF
{
  "projectName": "$(basename $PROJECT_ROOT)",
  "projectType": "$PROJECT_TYPE",
  "rootDir": ".",
  "domains": [
    {
      "name": "main",
      "patterns": ["src/**/*", "lib/**/*"],
      "description": "Main source code"
    }
  ],
  "embeddingsModel": "nomic-embed-text",
  "chunkSize": 512,
  "tagKeywords": [
    "async", "await", "function", "class", "api", "database", "test"
  ]
}
EOF

echo "✅ Created embedcontext.json"

# Create .claude directory
mkdir -p .claude/memory-bank/{core,knowledge}
echo "✅ Created .claude/memory-bank/"

# Create INIT.md template
cat > .claude/INIT.md <<'EOF'
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
EOF

echo "✅ Created .claude/INIT.md"

echo ""
echo "✅ EmbedContext initialized successfully!"
echo ""
echo "Next steps:"
echo "  1. Edit embedcontext.json to configure domains for your project"
echo "  2. Run: embedcontext doctor    (verify setup)"
echo "  3. Run: embedcontext index     (build embeddings)"
echo "  4. Run: embedcontext mcp-config (get Claude Desktop config)"
