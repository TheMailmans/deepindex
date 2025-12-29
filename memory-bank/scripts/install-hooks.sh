#!/usr/bin/env bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HOOK_PATH="$PROJECT_ROOT/.git/hooks/post-commit"

echo "📦 Installing DevContext Memory Bank git hook..."
echo ""

# Create post-commit hook
cat > "$HOOK_PATH" << 'EOF'
#!/usr/bin/env bash
# DevContext Memory Bank Auto-Update Hook
# Regenerates memory bank files after each commit

MEMORY_SCRIPT="$(git rev-parse --show-toplevel)/.claude/memory-bank/scripts/update.sh"

if [ -f "$MEMORY_SCRIPT" ]; then
  echo ""
  echo "🔄 Updating memory bank..."
  bash "$MEMORY_SCRIPT" 2>&1 | grep -E "(Generating|✅|❌)" || true
  echo ""
fi
EOF

# Make hook executable
chmod +x "$HOOK_PATH"

echo "✅ Git hook installed successfully!"
echo ""
echo "📍 Location: $HOOK_PATH"
echo ""
echo "ℹ️  The memory bank will now auto-update after every git commit."
echo ""
echo "To uninstall: rm $HOOK_PATH"
