# Contributing to DEEPINDEX

Thank you for your interest in contributing to DEEPINDEX!

## Project Status

DEEPINDEX is currently maintained by a single developer. While I appreciate community interest, please understand that response times may vary.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** first to avoid duplicates
2. **Use the bug report template** when creating a new issue
3. **Include reproduction steps** with minimal examples
4. **Share your environment** (OS, Node.js version, Ollama version)

### Suggesting Features

1. **Open a discussion** before creating a feature request
2. **Explain the use case** - why is this feature needed?
3. **Consider alternatives** - are there workarounds?

### Pull Requests

Before submitting a PR:

1. **Open an issue first** to discuss the change
2. **Keep PRs focused** - one feature or fix per PR
3. **Follow existing code style** - run `npm run lint` if available
4. **Add tests** for new functionality
5. **Update documentation** if needed

### Code Style

- TypeScript with strict mode
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Development Setup

```bash
# Clone the repository
git clone https://github.com/themailmans/DEEPINDEX.git
cd DEEPINDEX

# Install dependencies
npm install

# Build
cd embeddings && npm run build

# Run tests (if available)
npm test

# Test CLI locally
node dist/cli.js doctor
```

## Testing Your Changes

Before submitting:

```bash
# Build the project
npm run build

# Run the doctor command
node embeddings/dist/cli.js doctor

# Test indexing (in a test project)
node embeddings/dist/cli.js index

# Test search
node embeddings/dist/cli.js search "your query"
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` code change that neither fixes a bug nor adds a feature
- `test:` adding or updating tests
- `chore:` maintenance tasks

Example:
```
feat: add support for Python chunking

- Add PythonChunker class
- Support function and class detection
- Add tests for Python files
```

## Questions?

- Open a [GitHub Discussion](https://github.com/themailmans/DEEPINDEX/discussions)
- Check the [documentation](./docs/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
