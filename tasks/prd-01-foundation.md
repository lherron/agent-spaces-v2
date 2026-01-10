# PRD: Phase 1 - Foundation Packages

## Introduction

Implement the foundational packages that all other packages depend on: `@asp/core` for types, config parsing, and utilities; `@asp/git` for safe git operations; `@asp/claude` for Claude CLI interaction; and `@asp/engine` for orchestration. These form the bedrock of the Agent Spaces v2 system.

## Goals

- Implement robust TypeScript types matching all JSON schemas
- Parse and validate TOML and JSON configuration files
- Provide safe git operations using argv arrays (no shell injection)
- Wrap Claude CLI with detection and safe invocation
- Create orchestration layer that all CLI commands delegate to
- Implement file locking and atomic writes for concurrency safety

## User Stories

### US-001: Implement Space Types
**Description:** As a developer, I need TypeScript types for `space.toml` so the resolver and materializer can work with typed Space objects.

**Acceptance Criteria:**
- [ ] `Space` interface in `packages/core/src/types/space.ts`
- [ ] Includes: `id`, `name`, `version`, `description`
- [ ] Includes: `deps.spaces` as array of space refs
- [ ] Includes: `components` object (commands, agents, skills, hooks, mcp)
- [ ] Includes: `pluginManifest` override fields
- [ ] Types exported from `@asp/core`
- [ ] Typecheck passes

### US-002: Implement Targets Types
**Description:** As a developer, I need TypeScript types for `asp-targets.toml` so the CLI can parse project configuration.

**Acceptance Criteria:**
- [ ] `TargetsConfig` interface in `packages/core/src/types/targets.ts`
- [ ] `Target` interface with `compose` array of space refs
- [ ] Support for target inheritance via `extends`
- [ ] Types exported from `@asp/core`
- [ ] Typecheck passes

### US-003: Implement Lock Types
**Description:** As a developer, I need TypeScript types for `asp-lock.json` so the resolver can generate and read lock files.

**Acceptance Criteria:**
- [ ] `LockFile` interface in `packages/core/src/types/lock.ts`
- [ ] `SpaceEntry` with `id`, `version`, `commit`, `integrity`
- [ ] `envHash` field for environment fingerprint
- [ ] `loadOrder` array with ordered space keys
- [ ] Types exported from `@asp/core`
- [ ] Typecheck passes

### US-004: Implement Ref Types
**Description:** As a developer, I need types for space references (`space:<id>@<selector>`) to parse and manipulate refs.

**Acceptance Criteria:**
- [ ] `SpaceRef` interface in `packages/core/src/types/refs.ts`
- [ ] `Selector` union type: `DistTagSelector | SemverSelector | GitPinSelector`
- [ ] Parse function: `parseSpaceRef(ref: string): SpaceRef`
- [ ] Stringify function: `stringifySpaceRef(ref: SpaceRef): string`
- [ ] Types exported from `@asp/core`
- [ ] Typecheck passes

### US-005: Implement TOML Parser for space.toml
**Description:** As a developer, I need to parse `space.toml` files into typed `Space` objects.

**Acceptance Criteria:**
- [ ] `parseSpaceToml(content: string): Space` function
- [ ] Uses `@iarna/toml` for parsing
- [ ] Validates against JSON schema using Ajv
- [ ] Throws `ConfigError` with helpful message on invalid input
- [ ] Unit tests for valid and invalid inputs
- [ ] Typecheck passes

### US-006: Implement TOML Parser for asp-targets.toml
**Description:** As a developer, I need to parse `asp-targets.toml` files into typed `TargetsConfig` objects.

**Acceptance Criteria:**
- [ ] `parseTargetsToml(content: string): TargetsConfig` function
- [ ] Uses `@iarna/toml` for parsing
- [ ] Validates against JSON schema using Ajv
- [ ] Resolves `extends` inheritance between targets
- [ ] Throws `ConfigError` with helpful message on invalid input
- [ ] Unit tests for valid and invalid inputs
- [ ] Typecheck passes

### US-007: Implement JSON Parser for asp-lock.json
**Description:** As a developer, I need to parse and write `asp-lock.json` files.

**Acceptance Criteria:**
- [ ] `parseLockJson(content: string): LockFile` function
- [ ] `stringifyLockJson(lock: LockFile): string` function (pretty-printed)
- [ ] Validates against JSON schema using Ajv
- [ ] Throws `ConfigError` on invalid input
- [ ] Unit tests for valid and invalid inputs
- [ ] Typecheck passes

### US-008: Implement Error Classes
**Description:** As a developer, I need typed error classes so errors are consistent and debuggable.

**Acceptance Criteria:**
- [ ] `AspError` base class with `code` property
- [ ] `ConfigError` for config parsing failures
- [ ] `ResolutionError` for dependency resolution failures
- [ ] `GitError` for git operation failures
- [ ] `MaterializationError` for materialization failures
- [ ] All errors include helpful context (file path, line number if applicable)
- [ ] Typecheck passes

### US-009: Implement File Locking
**Description:** As a developer, I need file locking primitives so concurrent `asp` processes don't corrupt state.

**Acceptance Criteria:**
- [ ] `acquireProjectLock(projectPath: string): Promise<Lock>` function
- [ ] `acquireStoreLock(): Promise<Lock>` function
- [ ] `Lock` has `release()` method
- [ ] Uses `proper-lockfile` under the hood
- [ ] Locks are automatically released on process exit
- [ ] Unit tests for lock acquisition and release
- [ ] Typecheck passes

### US-010: Implement Atomic File Writes
**Description:** As a developer, I need atomic file write utilities so interrupted writes don't leave corrupted files.

**Acceptance Criteria:**
- [ ] `atomicWriteFile(path: string, content: string): Promise<void>` function
- [ ] Writes to `<path>.tmp` then renames
- [ ] Handles errors by cleaning up temp file
- [ ] Works on all platforms (macOS, Linux, Windows)
- [ ] Unit tests
- [ ] Typecheck passes

### US-011: Implement Safe Git Exec
**Description:** As a developer, I need a safe git command executor that prevents shell injection.

**Acceptance Criteria:**
- [ ] `gitExec(args: string[], options?: GitExecOptions): Promise<GitResult>` function
- [ ] Uses `Bun.spawn` with argv array (no shell)
- [ ] `GitExecOptions` includes `cwd`, `timeout`
- [ ] `GitResult` includes `stdout`, `stderr`, `exitCode`
- [ ] Throws `GitError` on non-zero exit
- [ ] Unit tests with mock git commands
- [ ] Typecheck passes

### US-012: Implement Git Tag Operations
**Description:** As a developer, I need to list and create git tags for version resolution.

**Acceptance Criteria:**
- [ ] `listTags(pattern: string, cwd: string): Promise<string[]>` function
- [ ] `createTag(name: string, commit: string, cwd: string): Promise<void>` function
- [ ] Pattern supports glob matching (e.g., `space/my-space/v*`)
- [ ] Tags are created as lightweight tags (not annotated)
- [ ] Integration test with real git repo
- [ ] Typecheck passes

### US-013: Implement Git Show
**Description:** As a developer, I need to read file contents at specific commits.

**Acceptance Criteria:**
- [ ] `showFile(path: string, commit: string, cwd: string): Promise<string>` function
- [ ] Returns file content as string
- [ ] Throws `GitError` if file doesn't exist at commit
- [ ] Integration test with real git repo
- [ ] Typecheck passes

### US-014: Implement Git Tree Listing
**Description:** As a developer, I need to list tree entries for integrity hashing.

**Acceptance Criteria:**
- [ ] `listTree(path: string, commit: string, cwd: string): Promise<TreeEntry[]>` function
- [ ] `TreeEntry` includes `path`, `mode`, `type`, `blobOid`
- [ ] Recursive listing of all files in directory
- [ ] Integration test with real git repo
- [ ] Typecheck passes

### US-015: Implement Git Archive
**Description:** As a developer, I need to extract a directory tree at a commit to the filesystem.

**Acceptance Criteria:**
- [ ] `archive(path: string, commit: string, cwd: string, outDir: string): Promise<void>` function
- [ ] Extracts to `outDir` preserving directory structure
- [ ] Handles file permissions correctly
- [ ] Integration test with real git repo
- [ ] Typecheck passes

### US-016: Implement Git Repo Operations
**Description:** As a developer, I need basic git repo operations (clone, fetch, init, status).

**Acceptance Criteria:**
- [ ] `clone(url: string, dest: string): Promise<void>` function
- [ ] `fetch(cwd: string, remote?: string): Promise<void>` function
- [ ] `init(cwd: string): Promise<void>` function
- [ ] `status(cwd: string): Promise<RepoStatus>` function
- [ ] Integration tests with real git repos
- [ ] Typecheck passes

### US-017: Implement Claude Detection
**Description:** As a developer, I need to detect the Claude CLI binary and its capabilities.

**Acceptance Criteria:**
- [ ] `detectClaude(): Promise<ClaudeInfo | null>` function
- [ ] Checks `ASP_CLAUDE_PATH` env var first
- [ ] Falls back to `which claude`
- [ ] `ClaudeInfo` includes `path`, `version`, `supportsPluginDir`
- [ ] Returns `null` if not found (doesn't throw)
- [ ] Unit tests with mocked environment
- [ ] Typecheck passes

### US-018: Implement Claude Invocation
**Description:** As a developer, I need to safely invoke Claude with plugin directories.

**Acceptance Criteria:**
- [ ] `invokeClaude(options: InvokeOptions): Promise<void>` function
- [ ] `InvokeOptions` includes `pluginDirs`, `mcpConfig`, `args`
- [ ] Uses argv array (no shell)
- [ ] Forwards stdio to parent process
- [ ] Waits for Claude to exit
- [ ] Throws if Claude not found
- [ ] Integration test with claude-shim
- [ ] Typecheck passes

### US-019: Implement Engine Orchestration Skeleton
**Description:** As a developer, I need the engine package to provide high-level orchestration functions.

**Acceptance Criteria:**
- [ ] `resolve(target: string, options: ResolveOptions): Promise<ResolvedGraph>` stub
- [ ] `install(options: InstallOptions): Promise<void>` stub
- [ ] `build(target: string, options: BuildOptions): Promise<BuildResult>` stub
- [ ] `run(target: string, options: RunOptions): Promise<void>` stub
- [ ] `explain(target: string, options: ExplainOptions): Promise<ExplainResult>` stub
- [ ] All functions throw "not implemented" for now
- [ ] Types defined for all options and results
- [ ] Typecheck passes

## Functional Requirements

- FR-1: All config parsers must validate against JSON schemas
- FR-2: All git operations must use argv arrays, never shell strings
- FR-3: File locks must use advisory locking compatible with multiple processes
- FR-4: Atomic writes must handle process interruption gracefully
- FR-5: Claude invocation must support the `ASP_CLAUDE_PATH` override for testing
- FR-6: All errors must include enough context to debug (file path, operation, etc.)

## Non-Goals

- No actual resolution logic (that's Phase 2)
- No store/integrity logic (that's Phase 3)
- No materialization logic (that's Phase 4)
- No full engine implementation (just skeletons)

## Technical Considerations

- Use `@iarna/toml` for TOML parsing (better error messages than alternatives)
- Use `Ajv` for JSON Schema validation (fast, well-maintained)
- Use `proper-lockfile` for cross-platform file locking
- Git operations should work with both local paths and bare repos
- All async functions should be cancellable where possible

## Success Metrics

- All unit tests pass
- Integration tests with real git repos pass
- `@asp/core` can parse all example configs from the schemas doc
- `@asp/git` can clone, fetch, and read files from a test repo
- `@asp/claude` can detect the claude binary (or shim)
- Typecheck passes with zero errors

## Open Questions

- Should we support git submodules in the registry repo?
- Do we need to handle git LFS for large files in spaces?
