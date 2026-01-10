# Configuration Guide

EmbedContext is configured via `embedcontext.json` in your project root.

## Quick Setup

```bash
embedcontext init
```

This creates a default configuration based on your project type.

## Configuration File

```json
{
  "schemaVersion": 1,
  "projectName": "my-project",
  "projectType": "typescript",
  "rootDir": ".",
  "indexDir": ".embedcontext",
  "domains": [
    {
      "name": "src",
      "patterns": ["src/**/*.ts", "src/**/*.tsx"],
      "description": "Source code"
    },
    {
      "name": "tests",
      "patterns": ["**/*.test.ts", "**/*.spec.ts"],
      "description": "Test files"
    }
  ],
  "embeddingsModel": "nomic-embed-text",
  "chunkSize": 512,
  "tagKeywords": ["async", "function", "class", "interface"]
}
```

## Options

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | number | Always `1` for current version |
| `projectName` | string | Human-readable project name |
| `projectType` | string | One of: `typescript`, `rust`, `python`, `go`, `java`, `mixed` |
| `domains` | array | List of domain configurations |

### Optional Fields

| Field | Default | Description |
|-------|---------|-------------|
| `rootDir` | `"."` | Root directory for indexing |
| `indexDir` | `".embedcontext"` | Where to store index data |
| `embeddingsModel` | `"nomic-embed-text"` | Ollama model for embeddings |
| `chunkSize` | `512` | Target chunk size in characters |
| `tagKeywords` | (built-in) | Keywords to detect in code |

## Domains

Domains organize your codebase into logical sections for targeted searching.

```json
{
  "domains": [
    {
      "name": "api",
      "patterns": ["src/api/**/*.ts", "src/routes/**/*.ts"],
      "description": "API endpoints and routes"
    },
    {
      "name": "components",
      "patterns": ["src/components/**/*.tsx"],
      "description": "React components"
    },
    {
      "name": "utils",
      "patterns": ["src/utils/**/*.ts", "src/lib/**/*.ts"],
      "description": "Utility functions"
    }
  ]
}
```

### Glob Patterns

- `**/*.ts` - All TypeScript files recursively
- `src/**/*.ts` - TypeScript files under src/
- `*.md` - Markdown files in root only
- `{src,lib}/**/*.ts` - Multiple directories

## Ignore Patterns

Create `.embedcontextignore` to exclude files:

```
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Secrets
.env
*.key
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EMBEDCONTEXT_CONFIG` | Path to config file (overrides auto-discovery) |
| `OLLAMA_HOST` | Ollama server URL (default: http://localhost:11434) |

## Examples

### TypeScript/React Project

```json
{
  "schemaVersion": 1,
  "projectName": "my-react-app",
  "projectType": "typescript",
  "domains": [
    { "name": "components", "patterns": ["src/components/**/*.tsx"], "description": "React components" },
    { "name": "hooks", "patterns": ["src/hooks/**/*.ts"], "description": "Custom hooks" },
    { "name": "api", "patterns": ["src/api/**/*.ts"], "description": "API client" },
    { "name": "pages", "patterns": ["src/pages/**/*.tsx"], "description": "Page components" }
  ]
}
```

### Rust Project

```json
{
  "schemaVersion": 1,
  "projectName": "my-rust-app",
  "projectType": "rust",
  "domains": [
    { "name": "src", "patterns": ["src/**/*.rs"], "description": "Source code" },
    { "name": "tests", "patterns": ["tests/**/*.rs"], "description": "Integration tests" }
  ]
}
```

### Monorepo

```json
{
  "schemaVersion": 1,
  "projectName": "my-monorepo",
  "projectType": "mixed",
  "domains": [
    { "name": "frontend", "patterns": ["packages/frontend/src/**/*.{ts,tsx}"], "description": "Frontend app" },
    { "name": "backend", "patterns": ["packages/backend/src/**/*.ts"], "description": "Backend API" },
    { "name": "shared", "patterns": ["packages/shared/src/**/*.ts"], "description": "Shared code" }
  ]
}
```
