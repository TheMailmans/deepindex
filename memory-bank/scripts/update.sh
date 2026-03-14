#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🔄 Updating EmbedContext Memory Bank..."
echo ""

# Run generation script
echo "⚙️  Generating memory files..."
cd "$SCRIPT_DIR"
node generate.js

echo ""
echo "✅ Memory Bank Updated!"
echo ""
echo "📁 Updated files:"
ls -lh "$SCRIPT_DIR/../core/" 2>/dev/null | tail -n +2 | awk '{print "  - core/" $9 " (" $5 ")"}'
ls -lh "$SCRIPT_DIR/../knowledge/" 2>/dev/null | tail -n +2 | awk '{print "  - knowledge/" $9 " (" $5 ")"}'
echo ""
