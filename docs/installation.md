# Installation Guide

## Requirements

- Node.js 18 or higher
- Ollama (for embeddings)
- ~500MB disk space for dependencies

## Install EmbedContext

### Global Installation (Recommended)

```bash
npm install -g embedcontext
```

### Local Installation

```bash
npm install embedcontext
npx embedcontext --help
```

## Install Ollama

EmbedContext uses Ollama for generating embeddings locally.

### macOS

```bash
# Using Homebrew
brew install ollama

# Start Ollama server
ollama serve

# Pull the embedding model
ollama pull nomic-embed-text
```

### Linux

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama server
ollama serve

# Pull the embedding model
ollama pull nomic-embed-text
```

### Windows

1. Download from [ollama.com](https://ollama.com/download)
2. Run the installer
3. Open terminal and run:
   ```bash
   ollama serve
   ollama pull nomic-embed-text
   ```

## Verify Installation

```bash
# Check EmbedContext
embedcontext --version

# Check environment
embedcontext doctor
```

## Troubleshooting

### "Ollama server not reachable"

Make sure Ollama is running:
```bash
ollama serve
```

### "Embedding model not found"

Pull the model:
```bash
ollama pull nomic-embed-text
```

### Native dependency errors (FAISS)

EmbedContext will automatically fall back to keyword-only search if FAISS fails to load. This is normal on some systems.

To check your search tier:
```bash
embedcontext doctor
```

If you see "Search tier: keyword-only", semantic search is disabled but keyword search still works.

### Node.js version too old

EmbedContext requires Node.js 18+:
```bash
node --version  # Should be v18.x.x or higher
```

## Uninstall

```bash
npm uninstall -g embedcontext
```

To remove index data:
```bash
rm -rf .embedcontext/
```
