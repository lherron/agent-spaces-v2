# PRD: Phase 0 - Project Initialization

## Introduction

Initialize the Agent Spaces v2 monorepo with Bun workspaces, TypeScript configuration, and the package scaffolding needed for all subsequent phases. This creates the foundation structure before any implementation begins.

## Goals

- Create a properly configured Bun monorepo workspace
- Set up TypeScript with strict settings and path aliases
- Configure Biome for linting and formatting
- Scaffold all package directories with minimal boilerplate
- Establish consistent patterns for package exports and dependencies

## User Stories

### US-001: Initialize Bun Workspace Root
**Description:** As a developer, I need a properly configured monorepo root so that all packages can share dependencies and build configuration.

**Acceptance Criteria:**
- [ ] Root `package.json` with `"workspaces": ["packages/*"]`
- [ ] Root `bun.lockb` generated after install
- [ ] `bun install` succeeds from root
- [ ] Typecheck passes (`bun run typecheck`)

### US-002: Configure TypeScript Base
**Description:** As a developer, I need a base TypeScript configuration so that all packages have consistent compilation settings.

**Acceptance Criteria:**
- [ ] Root `tsconfig.json` with strict mode enabled
- [ ] Path aliases configured for `@asp/*` imports
- [ ] `composite: true` for project references
- [ ] Each package has `tsconfig.json` extending root
- [ ] `bun run typecheck` passes with no errors

### US-003: Configure Biome
**Description:** As a developer, I need consistent linting and formatting so code style is uniform across all packages.

**Acceptance Criteria:**
- [ ] Root `biome.json` with lint and format rules
- [ ] `bun run lint` script works from root
- [ ] `bun run format` script works from root
- [ ] Pre-commit hook runs lint (optional, can defer)

### US-004: Scaffold Core Package
**Description:** As a developer, I need the `packages/core` structure created so subsequent phases can implement it.

**Acceptance Criteria:**
- [ ] `packages/core/package.json` with name `@asp/core`
- [ ] `packages/core/tsconfig.json` extending root
- [ ] `packages/core/src/index.ts` with placeholder export
- [ ] Directory structure: `src/config/`, `src/schemas/`, `src/types/`
- [ ] Package builds without errors

### US-005: Scaffold Git Package
**Description:** As a developer, I need the `packages/git` structure created.

**Acceptance Criteria:**
- [ ] `packages/git/package.json` with name `@asp/git`
- [ ] `packages/git/tsconfig.json` extending root
- [ ] `packages/git/src/index.ts` with placeholder export
- [ ] Package builds without errors

### US-006: Scaffold Claude Package
**Description:** As a developer, I need the `packages/claude` structure created.

**Acceptance Criteria:**
- [ ] `packages/claude/package.json` with name `@asp/claude`
- [ ] `packages/claude/tsconfig.json` extending root
- [ ] `packages/claude/src/index.ts` with placeholder export
- [ ] Package builds without errors

### US-007: Scaffold Engine Package
**Description:** As a developer, I need the `packages/engine` structure created.

**Acceptance Criteria:**
- [ ] `packages/engine/package.json` with name `@asp/engine`
- [ ] `packages/engine/tsconfig.json` extending root
- [ ] `packages/engine/src/index.ts` with placeholder export
- [ ] Package builds without errors

### US-008: Scaffold Resolver Package
**Description:** As a developer, I need the `packages/resolver` structure created.

**Acceptance Criteria:**
- [ ] `packages/resolver/package.json` with name `@asp/resolver`
- [ ] `packages/resolver/tsconfig.json` extending root
- [ ] `packages/resolver/src/index.ts` with placeholder export
- [ ] Package builds without errors

### US-009: Scaffold Store Package
**Description:** As a developer, I need the `packages/store` structure created.

**Acceptance Criteria:**
- [ ] `packages/store/package.json` with name `@asp/store`
- [ ] `packages/store/tsconfig.json` extending root
- [ ] `packages/store/src/index.ts` with placeholder export
- [ ] Package builds without errors

### US-010: Scaffold Materializer Package
**Description:** As a developer, I need the `packages/materializer` structure created.

**Acceptance Criteria:**
- [ ] `packages/materializer/package.json` with name `@asp/materializer`
- [ ] `packages/materializer/tsconfig.json` extending root
- [ ] `packages/materializer/src/index.ts` with placeholder export
- [ ] Package builds without errors

### US-011: Scaffold Lint Package
**Description:** As a developer, I need the `packages/lint` structure created.

**Acceptance Criteria:**
- [ ] `packages/lint/package.json` with name `@asp/lint`
- [ ] `packages/lint/tsconfig.json` extending root
- [ ] `packages/lint/src/index.ts` with placeholder export
- [ ] Directory structure: `src/rules/`
- [ ] Package builds without errors

### US-012: Scaffold CLI Package
**Description:** As a developer, I need the `packages/cli` structure created with Commander.js setup.

**Acceptance Criteria:**
- [ ] `packages/cli/package.json` with name `asp` and `bin` field
- [ ] `packages/cli/tsconfig.json` extending root
- [ ] `packages/cli/src/index.ts` with Commander.js skeleton
- [ ] Directory structure: `src/commands/`, `src/commands/repo/`
- [ ] `asp --help` works after build
- [ ] `asp --version` shows version from package.json

### US-013: Scaffold Integration Tests
**Description:** As a developer, I need the integration test structure created.

**Acceptance Criteria:**
- [ ] `integration-tests/` directory with `fixtures/` and `tests/` subdirs
- [ ] `integration-tests/fixtures/claude-shim/` directory
- [ ] `integration-tests/package.json` for test dependencies
- [ ] Placeholder test file that passes

### US-014: Add Shared Dependencies
**Description:** As a developer, I need common dependencies installed so all packages can use them.

**Acceptance Criteria:**
- [ ] `commander` installed in cli package
- [ ] `@iarna/toml` installed in core package
- [ ] `ajv` installed in core package
- [ ] `semver` installed in resolver package
- [ ] `chalk` installed in cli package
- [ ] `proper-lockfile` installed in core package
- [ ] TypeScript and bun-types as dev dependencies at root
- [ ] All type definitions installed (@types/*)

## Functional Requirements

- FR-1: The monorepo must use Bun workspaces for package management
- FR-2: All packages must use TypeScript with strict mode
- FR-3: Package names must follow `@asp/<name>` convention
- FR-4: The CLI package must expose an `asp` binary
- FR-5: All packages must have consistent directory structures
- FR-6: Root scripts must work: `typecheck`, `lint`, `format`, `build`

## Non-Goals

- No actual implementation of package functionality (just scaffolding)
- No CI/CD pipeline setup
- No publishing configuration
- No documentation beyond code comments

## Technical Considerations

- Use Bun's native workspace support (similar to pnpm)
- TypeScript project references for incremental builds
- Biome preferred over ESLint for speed
- All packages should be buildable independently

## Success Metrics

- `bun install` completes in under 10 seconds
- `bun run typecheck` passes with zero errors
- `bun run lint` passes with zero errors
- `asp --help` displays command list
- All package `index.ts` files export at least a placeholder

## Open Questions

- Should we add a `packages/shared` for truly shared utilities?
- Do we want husky for git hooks or defer that?
