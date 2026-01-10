# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in EmbedContext, please report it responsibly.

### How to Report

1. **Do NOT open a public issue** for security vulnerabilities
2. **Email:** themailmaninbox@gmail.com (preferred for fastest response)
3. **GitHub:** [Create a private security advisory](https://github.com/themailmans/embedcontext/security/advisories/new)
4. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution Timeline**: Depends on severity

### Security Model

EmbedContext is designed to run locally on your machine:

- **No network access** except to local Ollama server (localhost:11434)
- **No data upload** - all embeddings are stored locally
- **No telemetry** - we don't collect any usage data
- **Path sandboxing** - file access is restricted to configured root directory

### Known Limitations

- Ollama API is accessed over HTTP (localhost only)
- SQLite database files are not encrypted
- FAISS index files are not encrypted

### Best Practices

1. Don't index sensitive files (credentials, keys, etc.)
2. Use `.embedcontextignore` to exclude sensitive directories
3. Keep Ollama and dependencies updated
4. Run in isolated environments for sensitive projects
