# Contributing to TypeLense

Thank you for your interest in contributing to TypeLense! We welcome contributions from the community.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Getting Started

Before contributing, please:

1. Check existing [issues](https://github.com/mxvsh/typelense/issues) and [pull requests](https://github.com/mxvsh/typelense/pulls)
2. Read the [Architecture documentation](./ARCHITECTURE.md)
3. Familiarize yourself with the codebase structure

## Development Setup

### Prerequisites

- **Bun 1.x** or **Node.js 18+**
- **Git**
- **TypeScript 5.x** (peer dependency)

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/mxvsh/typelense.git
cd typelense

# Install dependencies
bun install
```

## Project Structure

```
typelense/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Library exports
│   ├── types/              # TypeScript interfaces
│   ├── detectors/          # Monorepo detection plugins
│   ├── collectors/         # Error collection logic
│   └── generators/         # Output format generators
├── docs/                   # Documentation
├── dist/                   # Built output (generated)
├── build.ts               # Build script
├── package.json
├── tsconfig.json
└── README.md
```

## Development Workflow

### Running Locally

```bash
# Run the CLI directly
bun run start

# Run with hot reload during development
bun run dev

# Run on a specific directory
bun run start /path/to/test-project

# With options
bun run start /path/to/test --output errors.tsv
```

### Building

```bash
# Build the project
bun run build

# Test the built version
node dist/cli.js --help
node dist/cli.js /path/to/test
```

### Testing Changes

```bash
# Test locally with Bun
bun run start

# Test built version with Node.js (important for compatibility)
bun run build
node dist/cli.js

# Test as if installed globally
npm link
typelense --help
npm unlink typelense
```

## Code Standards

### Node.js Compatibility

**CRITICAL**: TypeLense must work with both Bun and Node.js!

#### ❌ DO NOT Use:
- `Bun.file()` → Use `readFileSync()` from `node:fs`
- `Bun.write()` → Use `writeFile()` from `node:fs/promises`
- `Bun.Glob` → Use `fast-glob` package
- `Bun.$` → Use standard Node.js `child_process`
- Any Bun-specific APIs

#### ✅ DO Use:
- Standard Node.js APIs: `node:fs`, `node:path`, `node:crypto`
- Cross-runtime packages: `fast-glob`, `yaml`, etc.
- TypeScript Compiler API (works everywhere)

### Code Style

We use **Biome** for linting and formatting:

```bash
# Format code
bunx @biomejs/biome format --write .

# Lint code
bunx @biomejs/biome lint .
```

**Guidelines:**
- Use `node:` protocol for Node.js built-ins (`node:fs`, `node:path`)
- Prefer `async/await` over callbacks
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use TypeScript strict mode

### File Organization

- **One class per file** (with same name)
- **Export from index.ts** in each directory
- **Group related functionality** in directories
- **Keep types separate** in `src/types/`

### TypeScript

- Use **strict mode** (enabled in `tsconfig.json`)
- Define **explicit types** for function parameters and returns
- Use **interfaces** for public APIs, **types** for internal structures
- Export types from `src/types/index.ts`

## Testing

### Manual Testing

Create test repositories with different structures:

```bash
# Test single package
mkdir test-single && cd test-single
npm init -y
npm install typescript
# Add some TypeScript errors
npx typelense

# Test PNPM monorepo
mkdir test-pnpm && cd test-pnpm
# Create pnpm-workspace.yaml
npx typelense

# Test with errors
npx typelense --output test-errors.tsv
cat test-errors.tsv
```

### Test Checklist

Before submitting a PR, verify:

- [ ] Works with Node.js (not just Bun)
- [ ] Detects all supported monorepo types
- [ ] Handles missing `tsconfig.json` gracefully
- [ ] Produces valid TSV output
- [ ] CLI options work correctly
- [ ] Error messages are helpful
- [ ] Build completes without errors
- [ ] No Bun-specific APIs used

## Submitting Changes

### Before Submitting

1. **Test thoroughly** (see Testing section)
2. **Update documentation** if you changed functionality
3. **Follow code standards** (run Biome)
4. **Write clear commit messages**

### Commit Messages

Use conventional commit format:

```
type(scope): brief description

Detailed explanation if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(detectors): add support for Rush monorepo
fix(collectors): handle missing tsconfig.json
docs(readme): update installation instructions
refactor(cli): improve error message formatting
```

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feat/my-feature`)
3. **Make your changes**
4. **Test your changes** thoroughly
5. **Commit with clear messages**
6. **Push to your fork** (`git push origin feat/my-feature`)
7. **Open a Pull Request** with description of changes

### PR Description Template

```markdown
## What does this PR do?

Brief description of the changes

## Why is this needed?

Explain the motivation

## How was it tested?

- [ ] Tested with Node.js
- [ ] Tested with Bun
- [ ] Tested with various monorepo types
- [ ] Verified output correctness

## Related Issues

Fixes #123
Related to #456
```

## Adding New Features

### New Monorepo Detector

1. Create `src/detectors/your-detector.ts`
2. Extend `BaseDetector` class
3. Implement `detect()` and `getPackages()`
4. Export from `src/detectors/index.ts`
5. Add to `DEFAULT_DETECTORS` array
6. Update README with new monorepo type
7. Add test case

See [ARCHITECTURE.md](./ARCHITECTURE.md#adding-a-new-monorepo-detector) for details.

### New Output Format

1. Create `src/generators/your-generator.ts`
2. Implement `OutputGenerator` interface
3. Export from `src/generators/index.ts`
4. Add CLI option (if needed)
5. Update documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md#adding-a-new-output-format) for details.

### New Error Collector

1. Create `src/collectors/your-collector.ts`
2. Implement `ErrorCollector` interface
3. Export from `src/collectors/index.ts`
4. Update CLI to allow selection (optional)

## Release Process

Releases are managed by maintainers using `release-it`:

```bash
# Bump version and publish
bun run release
```

This will:
1. Run build
2. Update version in `package.json`
3. Create git tag
4. Push to GitHub
5. Publish to npm

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/mxvsh/typelense/discussions)
- **Bug reports?** Open an [Issue](https://github.com/mxvsh/typelense/issues)
- **Need clarification?** Comment on the relevant issue/PR

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing to TypeLense, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TypeLense! 🎉
