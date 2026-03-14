# GitHub Repository Setup Checklist

When creating or updating the GitHub repo, configure these settings.

## About Section (sidebar)

**Description:**
> Local-first semantic code search + MCP tools for Claude Code. No cloud, no cost, runs on your machine.

**Website:**
> https://www.npmjs.com/package/embedcontext *(add after first npm publish)*

**Topics (add all of these):**
```
embeddings  semantic-search  mcp  claude  claude-code  ollama
code-search  rag  typescript  faiss  sqlite  developer-tools
ai  llm  local-ai  context-window
```

## Repository Settings

- **Visibility:** Public
- **Default branch:** `main`
- **Features to enable:** Issues ✓, Discussions ✓, Projects (optional)
- **Features to disable:** Wiki (use docs/ folder instead)

## Branch Protection (main)

- Require PR reviews: No (solo project for now)
- Require status checks to pass: `build` (CI)
- Do not allow force pushes: ✓

## Secrets Required

For the release workflow to work, add these repository secrets:

| Secret | Value | Where to get it |
|--------|-------|-----------------|
| `NPM_TOKEN` | npm access token | npmjs.com → Account → Access Tokens → Generate (Automation type) |

## First Release Steps

1. Make sure `embeddings/package.json` version is set to `0.1.0`
2. Tag the release: `git tag v0.1.0 && git push origin v0.1.0`
3. The release workflow auto-publishes to npm and creates a GitHub Release

## Social Preview Image

Consider creating a banner image (1280×640px) showing:
- EmbedContext logo/name
- Tagline: "Semantic code search for Claude Code"
- Simple diagram or code snippet showing the CLI in action

Upload at: Settings → General → Social preview
