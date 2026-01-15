# TypeLense Architecture

TypeLense is built with a modular, scalable architecture designed for extensibility and maintainability.

## Project Structure

```
src/
├── cli.ts           # CLI entry point
├── index.ts         # Library exports
├── types/           # TypeScript interfaces and types
├── detectors/       # Monorepo detection plugins
│   ├── base-detector.ts
│   ├── pnpm-detector.ts
│   ├── npm-detector.ts
│   ├── yarn-detector.ts
│   ├── lerna-detector.ts
│   ├── nx-detector.ts
│   └── turbo-detector.ts
├── collectors/      # Error collection logic
│   └── ts-error-collector.ts
└── generators/      # Output format generators
    └── tsv-generator.ts
```

## Core Components

### 1. Detectors

Detectors identify monorepo types and discover packages within them. Each detector implements the `MonorepoDetector` interface:

```typescript
interface MonorepoDetector {
  name: MonorepoType;
  detect(rootPath: string): Promise<boolean>;
  getPackages(rootPath: string): Promise<PackageInfo[]>;
}
```

**Available Detectors:**
- **TurboDetector**: Detects Turborepo configurations
- **PnpmDetector**: Reads `pnpm-workspace.yaml`
- **YarnDetector**: Reads `package.json` workspaces with `yarn.lock`
- **NpmDetector**: Reads `package.json` workspaces
- **LernaDetector**: Reads `lerna.json`
- **NxDetector**: Reads `nx.json` or `workspace.json`

Detectors are checked in priority order (Turbo first, as it wraps other tools).

### 2. Collectors

Collectors gather TypeScript errors using the TypeScript Compiler API. The `TypeScriptErrorCollector` class:

1. Finds `tsconfig.json` in each package
2. Creates a TypeScript program
3. Gathers diagnostics (semantic, syntactic, declaration)
4. Formats errors with serial IDs

### 3. Generators

Generators transform collected errors into output formats. Currently implements:

- **TsvGenerator**: Creates tab-separated value files with columns:
  - `id` - Sequential number
  - `package_name` - Package name
  - `file_name` - Relative file path
  - `error_code` - TypeScript error code
  - `description` - Error message

## Extending TypeLense

### Adding a New Monorepo Detector

1. Create a new file in `src/detectors/`:

```typescript
import { BaseDetector } from './base-detector';
import type { PackageInfo } from '../types';

export class CustomDetector extends BaseDetector {
  name = 'custom' as const;

  async detect(rootPath: string): Promise<boolean> {
    // Check if custom monorepo marker exists
    return this.fileExists(this.resolvePath(rootPath, 'custom.config'));
  }

  async getPackages(rootPath: string): Promise<PackageInfo[]> {
    // Read custom config and discover packages
    const config = await this.readJSON(this.resolvePath(rootPath, 'custom.config'));

    // Return array of packages
    return [
      {
        name: 'my-package',
        path: this.resolvePath(rootPath, 'packages/my-package'),
        version: '1.0.0'
      }
    ];
  }
}
```

2. Export from `src/detectors/index.ts`:

```typescript
export * from './custom-detector';
```

3. Add to `DEFAULT_DETECTORS` array in `src/detectors/index.ts`:

```typescript
const DEFAULT_DETECTORS: MonorepoDetector[] = [
  new TurboDetector(),
  new CustomDetector(), // Add your detector
  new PnpmDetector(),
  // ...
];
```

### Adding a New Output Format

1. Create a new file in `src/generators/`:

```typescript
import type { OutputGenerator, TypeScriptError } from '../types';
import { writeFile } from 'node:fs/promises';

export class JsonGenerator implements OutputGenerator {
  async generate(errors: TypeScriptError[], outputPath: string): Promise<void> {
    const json = JSON.stringify(errors, null, 2);
    await writeFile(outputPath, json, 'utf-8');
  }
}
```

2. Export from `src/generators/index.ts`:

```typescript
export * from './json-generator';
```

3. Use in CLI or programmatically:

```typescript
import { JsonGenerator } from './generators';

const generator = new JsonGenerator();
await generator.generate(errors, 'output.json');
```

### Adding a Custom Error Collector

1. Implement the `ErrorCollector` interface:

```typescript
import type { ErrorCollector, MonorepoInfo, TypeScriptError } from '../types';

export class CustomCollector implements ErrorCollector {
  async collect(
    rootPath: string,
    monorepoInfo: MonorepoInfo
  ): Promise<TypeScriptError[]> {
    // Custom error collection logic
    return [];
  }
}
```

## Design Principles

### 1. Modularity
Each component (detector, collector, generator) is independent and can be used separately.

### 2. Extensibility
New monorepo types, error sources, or output formats can be added without modifying existing code.

### 3. Node.js Compatibility
All code uses standard Node.js APIs (no Bun-specific features) to ensure compatibility across runtimes.

### 4. Type Safety
Comprehensive TypeScript types ensure compile-time correctness and excellent IDE support.

### 5. Pluggable Architecture
Custom detectors can be passed to `detectMonorepo()` function:

```typescript
import { detectMonorepo } from 'typelense';
import { CustomDetector } from './custom-detector';

const monorepoInfo = await detectMonorepo('/path/to/repo', [
  new CustomDetector()
]);
```

## Data Flow

```
┌─────────────┐
│  CLI Entry  │
│  (cli.ts)   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│    Detectors    │  ← Identify monorepo type
│  (detectMonorepo)│  ← Discover packages
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Collectors    │  ← Use TypeScript API
│  (collectErrors)│  ← Gather diagnostics
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Generators    │  ← Format errors
│  (generateTSV)  │  ← Write output file
└─────────────────┘
```

## Build System

The build process (`build.ts`):

1. Recursively finds all `.ts` files in `src/`
2. Reads dependencies from `package.json`
3. Uses Bun's bundler to create Node.js-compatible ESM output
4. Preserves folder structure in `dist/`
5. Marks external dependencies (not bundled)

Output:
```
dist/
├── cli.js              # Executable CLI
├── index.js            # Library entry point
├── types/index.js
├── detectors/*.js
├── collectors/*.js
└── generators/*.js
```

## Testing Strategy

### Unit Testing
Test individual components in isolation:
- Detector logic
- Error formatting
- Output generation

### Integration Testing
Test complete flows:
- Monorepo detection → error collection → output
- Multiple package scenarios
- Edge cases (missing tsconfig, no errors, etc.)

### Manual Testing
```bash
# Test locally
bun run start /path/to/test-repo

# Test built version
bun run build
node dist/cli.js /path/to/test-repo
```

## Performance Considerations

1. **Parallel Package Processing**: Can be added to process packages concurrently
2. **Incremental Compilation**: Future enhancement to only check changed files
3. **Caching**: Could cache TypeScript program instances for repeated runs
4. **Stream Processing**: For very large codebases, stream errors instead of loading all in memory

## Contributing

When contributing to TypeLense:

1. Follow the modular architecture
2. Ensure Node.js compatibility (no Bun-specific APIs)
3. Add types for all new interfaces
4. Export new components from index files
5. Update this documentation for architectural changes
