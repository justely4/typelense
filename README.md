# TypeLense

A modular and scalable TypeScript error collector for monorepos. TypeLense automatically detects your monorepo structure and extracts TypeScript errors across all packages into a convenient TSV file.

## Features

- **Multi-Monorepo Support**: Automatically detects and supports:
  - PNPM workspaces
  - Yarn workspaces
  - NPM workspaces
  - Lerna
  - Nx
  - Turborepo
- **Modular Architecture**: Pluggable detector and collector system
- **TypeScript Compiler API**: Uses official TS compiler for accurate error detection
- **Clean Output**: Generates TSV files with serial IDs for easy tracking
- **Beautiful CLI**: Color-coded output with ASCII icons and progress indicators
- **Zero Config**: Works out of the box with sensible defaults

## Usage

No installation required! Run TypeLense directly using `npx`:

### Basic Usage

Run in the current directory:

```bash
npx typelense
```

Run in a specific directory:

```bash
npx typelense /path/to/monorepo
```

### With Bun

```bash
bunx typelense
```

### With PNPM

```bash
pnpm dlx typelense
```

### CLI Options

```bash
npx typelense [directory] [options]
```

**Options:**

- `-o, --output <path>` - Output path for the TSV file (default: `typescript-errors.tsv`)
- `-q, --quiet` - Suppress non-error output
- `-V, --version` - Output the version number
- `-h, --help` - Display help information

### Examples

```bash
# Scan current directory and save to default file
npx typelense

# Scan specific directory with custom output
npx typelense ./my-monorepo -o errors.tsv

# Run in quiet mode
npx typelense -q

# Scan parent directory
npx typelense ..

# Using Bun
bunx typelense

# Using PNPM
pnpm dlx typelense
```

## Installation (Optional)

If you want to install TypeLense globally:

```bash
# Using NPM
npm install -g typelense

# Using Bun
bun install -g typelense

# Using PNPM
pnpm add -g typelense

# Using Yarn
yarn global add typelense
```

Then run directly:

```bash
typelense /path/to/project
```

## Output Format

TypeLense generates a TSV (Tab-Separated Values) file with the following columns:

| Column | Description |
|--------|-------------|
| `id` | Sequential error number (1, 2, 3...) |
| `package_name` | Name of the package where the error occurred |
| `file_name` | Relative path to the file with the error |
| `error_code` | TypeScript error code (e.g., 2322, 2345) |
| `description` | Error message description |

### Example Output

```tsv
id	package_name	file_name	error_code	description
1	@myapp/web	src/index.tsx	2322	Type 'string' is not assignable to type 'number'.
2	@myapp/api	src/server.ts	2304	Cannot find name 'Express'.
3	@myapp/shared	src/utils.ts	2532	Object is possibly 'undefined'.
```

## Supported Monorepo Types

TypeLense automatically detects the following monorepo configurations:

### Turborepo
Detected by: `turbo.json` + workspace configuration

### PNPM Workspaces
Detected by: `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Yarn Workspaces
Detected by: `package.json` with `workspaces` field + `yarn.lock`

```json
{
  "workspaces": ["packages/*"]
}
```

### NPM Workspaces
Detected by: `package.json` with `workspaces` field

```json
{
  "workspaces": ["packages/*"]
}
```

### Lerna
Detected by: `lerna.json`

```json
{
  "packages": ["packages/*"]
}
```

### Nx
Detected by: `nx.json` or `workspace.json`

## Roadmap

Planned features for future releases:

- [ ] **Per-package TSV files** - Generate separate TSV files for each package
- [ ] **Multiple output formats** - Support JSON and CSV in addition to TSV
- [ ] **Error severity filtering** - Filter by error, warning, or suggestion
- [ ] **Watch mode** - Continuous monitoring with incremental updates
- [ ] **Git integration** - Show errors only in changed files since a commit
- [ ] **Error statistics** - Summary dashboard with error trends and hotspots
- [ ] **Custom formatters** - Plugin system for custom output formats
- [ ] **CI/CD integration** - GitHub Actions, GitLab CI templates
- [ ] **Configuration file** - `.typelenserc` for project-specific settings
- [ ] **IDE extensions** - VSCode and other editor integrations
- [ ] **Incremental mode** - Only re-check modified packages
- [ ] **Error suppression** - Ignore specific errors by code or pattern

Have a feature request? [Open an issue](https://github.com/monawwar/typelense/issues) on GitHub!

## Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - Learn about TypeLense's modular design and how to extend it
- **[Contributing](./CONTRIBUTING.md)** - Guidelines for contributing to the project

## Requirements

- TypeScript 5.x (peer dependency)
- Bun 1.x or Node.js 18+ (runtime)

## License

MIT - See [LICENSE](./LICENSE) file for details

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) to get started.
