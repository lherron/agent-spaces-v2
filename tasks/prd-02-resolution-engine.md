# PRD: Phase 2 - Resolution Engine

## Introduction

Implement the resolution engine that converts space references and targets into a fully resolved dependency graph with a deterministic load order. This includes parsing refs, resolving selectors against the registry, computing the dependency closure, detecting cycles, and generating lock files.

## Goals

- Parse space references (`space:<id>@<selector>`) into structured objects
- Resolve dist-tags from committed `registry/dist-tags.json`
- Resolve semver selectors against git tags
- Compute dependency closure with ordered DFS postorder
- Detect circular dependencies and fail with clear error
- Generate and update `asp-lock.json` files

## User Stories

### US-001: Implement Ref Parser
**Description:** As a developer, I need to parse space reference strings into structured objects for processing.

**Acceptance Criteria:**
- [ ] `parseRef(ref: string): SpaceRef` function in `packages/resolver/src/ref-parser.ts`
- [ ] Parses `space:my-space@stable` → `{ protocol: 'space', id: 'my-space', selector: { type: 'dist-tag', tag: 'stable' } }`
- [ ] Parses `space:my-space@^1.0.0` → `{ protocol: 'space', id: 'my-space', selector: { type: 'semver', range: '^1.0.0' } }`
- [ ] Parses `space:my-space@git:abc123` → `{ protocol: 'space', id: 'my-space', selector: { type: 'git', sha: 'abc123' } }`
- [ ] Parses `space:my-space` (no selector) → defaults to `@stable`
- [ ] Throws `ResolutionError` on invalid format
- [ ] Unit tests for all cases
- [ ] Typecheck passes

### US-002: Implement Dist-Tag Reader
**Description:** As a developer, I need to read dist-tags from the registry's committed metadata file.

**Acceptance Criteria:**
- [ ] `readDistTags(repoPath: string): Promise<DistTagsMap>` function
- [ ] Reads `registry/dist-tags.json` from HEAD commit
- [ ] Returns `{ [spaceId]: { [tag]: version } }` structure
- [ ] Returns empty map if file doesn't exist (new registry)
- [ ] Caches result for duration of resolution
- [ ] Unit tests with mock git
- [ ] Typecheck passes

### US-003: Implement Dist-Tag Resolution
**Description:** As a developer, I need to resolve dist-tags (stable, latest, beta) to specific versions.

**Acceptance Criteria:**
- [ ] `resolveDistTag(spaceId: string, tag: string, distTags: DistTagsMap): string` function
- [ ] Returns version string (e.g., `v1.2.3`) for the tag
- [ ] Throws `ResolutionError` if space not found in dist-tags
- [ ] Throws `ResolutionError` if tag not found for space
- [ ] Unit tests
- [ ] Typecheck passes

### US-004: Implement Semver Tag Discovery
**Description:** As a developer, I need to discover all version tags for a space from git.

**Acceptance Criteria:**
- [ ] `discoverVersions(spaceId: string, repoPath: string): Promise<VersionInfo[]>` function
- [ ] Lists tags matching `space/<id>/v*`
- [ ] Parses version from tag name
- [ ] Returns array with `{ version: string, tag: string, commit: string }`
- [ ] Sorted by semver descending (newest first)
- [ ] Unit tests with mock git
- [ ] Typecheck passes

### US-005: Implement Semver Resolution
**Description:** As a developer, I need to resolve semver ranges to specific versions.

**Acceptance Criteria:**
- [ ] `resolveSemver(spaceId: string, range: string, versions: VersionInfo[]): VersionInfo` function
- [ ] Uses `semver.maxSatisfying` to find best match
- [ ] Throws `ResolutionError` if no version satisfies range
- [ ] Handles exact versions, ranges (`^1.0.0`), and wildcards (`*`)
- [ ] Unit tests for various semver scenarios
- [ ] Typecheck passes

### US-006: Implement Git Pin Resolution
**Description:** As a developer, I need to resolve `git:<sha>` pins to commits.

**Acceptance Criteria:**
- [ ] `resolveGitPin(spaceId: string, sha: string, repoPath: string): Promise<ResolvedSpace>` function
- [ ] Validates commit exists in repo
- [ ] Reads `space.toml` at that commit
- [ ] Returns resolved space with commit info
- [ ] Throws `ResolutionError` if commit not found
- [ ] Unit tests with mock git
- [ ] Typecheck passes

### US-007: Implement Unified Selector Resolution
**Description:** As a developer, I need a single function that resolves any selector type.

**Acceptance Criteria:**
- [ ] `resolveSelector(ref: SpaceRef, context: ResolutionContext): Promise<ResolvedSpace>` function
- [ ] Dispatches to dist-tag, semver, or git pin resolver based on selector type
- [ ] `ResolutionContext` includes `repoPath`, `distTags`, cached `versions`
- [ ] `ResolvedSpace` includes `id`, `version`, `commit`, `space` (parsed space.toml)
- [ ] Caches resolution results to avoid redundant git operations
- [ ] Unit tests for all selector types
- [ ] Typecheck passes

### US-008: Implement Dependency Closure
**Description:** As a developer, I need to compute the full dependency graph with load order.

**Acceptance Criteria:**
- [ ] `computeClosure(roots: SpaceRef[], context: ResolutionContext): Promise<Closure>` function
- [ ] Uses DFS postorder traversal
- [ ] Processes dependencies in declared order
- [ ] `Closure` includes `loadOrder: ResolvedSpace[]` (dependencies before dependents)
- [ ] `Closure` includes `graph: Map<string, ResolvedSpace>` keyed by spaceKey
- [ ] Handles diamond dependencies (same space via multiple paths)
- [ ] Unit tests for various graph structures
- [ ] Typecheck passes

### US-009: Implement Cycle Detection
**Description:** As a developer, I need cycle detection that fails fast with a clear error.

**Acceptance Criteria:**
- [ ] Cycle detection integrated into `computeClosure`
- [ ] Detects cycles during DFS traversal (back edge detection)
- [ ] Throws `ResolutionError` with cycle path (A → B → C → A)
- [ ] Fails on first cycle found (no need to find all cycles)
- [ ] Unit tests for cyclic graphs
- [ ] Typecheck passes

### US-010: Implement Lock File Generation
**Description:** As a developer, I need to generate `asp-lock.json` from a resolved closure.

**Acceptance Criteria:**
- [ ] `generateLock(closure: Closure, existingLock?: LockFile): LockFile` function
- [ ] Generates `spaces` map with all resolved spaces
- [ ] Each entry has `id`, `version`, `commit`, `integrity` (placeholder for Phase 3)
- [ ] Generates `loadOrder` array in correct order
- [ ] Generates `envHash` (placeholder for Phase 3)
- [ ] Preserves manually-pinned entries from existing lock if compatible
- [ ] Unit tests
- [ ] Typecheck passes

### US-011: Implement Lock File Diff
**Description:** As a developer, I need to compute differences between lock files for `asp diff`.

**Acceptance Criteria:**
- [ ] `diffLocks(oldLock: LockFile, newLock: LockFile): LockDiff` function
- [ ] `LockDiff` includes `added`, `removed`, `changed` space entries
- [ ] `changed` includes old and new version/commit
- [ ] Human-readable format method
- [ ] JSON format method
- [ ] Unit tests
- [ ] Typecheck passes

### US-012: Implement Structural Validator
**Description:** As a developer, I need validation of the resolved graph structure (errors only, not warnings).

**Acceptance Criteria:**
- [ ] `validateClosure(closure: Closure): ValidationResult` function
- [ ] Checks all deps are resolved (no dangling refs)
- [ ] Checks space.toml is valid for each resolved space
- [ ] `ValidationResult` includes `errors: ValidationError[]`
- [ ] Does NOT include warnings (warnings are in lint package)
- [ ] Unit tests
- [ ] Typecheck passes

### US-013: Implement Target Resolution
**Description:** As a developer, I need to resolve a named target from `asp-targets.toml`.

**Acceptance Criteria:**
- [ ] `resolveTarget(targetName: string, config: TargetsConfig, context: ResolutionContext): Promise<Closure>` function
- [ ] Resolves target's `compose` array as roots
- [ ] Handles `extends` inheritance
- [ ] Returns full closure
- [ ] Throws `ResolutionError` if target not found
- [ ] Unit tests
- [ ] Typecheck passes

### US-014: Implement Global Mode Resolution
**Description:** As a developer, I need to resolve a single space ref in global mode (outside a project).

**Acceptance Criteria:**
- [ ] `resolveGlobal(ref: SpaceRef, context: ResolutionContext): Promise<Closure>` function
- [ ] Resolves single space ref as root
- [ ] Uses global lock file at `$ASP_HOME/global-lock.json`
- [ ] Returns full closure with dependencies
- [ ] Unit tests
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Dist-tags must be read from committed `registry/dist-tags.json`, not from git tags
- FR-2: Semver tags must be immutable (`space/<id>/vX.Y.Z`)
- FR-3: Dependency closure must use DFS postorder (dependencies load before dependents)
- FR-4: Circular dependencies must cause immediate failure with clear error message
- FR-5: Resolution results must be cached within a single resolution run
- FR-6: Lock file generation must be deterministic (same inputs → same output)

## Non-Goals

- No integrity hashing (that's Phase 3)
- No warning emission (that's Phase 6 lint package)
- No actual store operations (that's Phase 3)

## Technical Considerations

- Use `semver` package for all semver operations
- Cache git operations aggressively (tag listing, file reads)
- Resolution context should be passed explicitly, not as global state
- Lock file format should be JSON for easy diffing and tooling

## Success Metrics

- Unit tests cover all selector types
- Integration tests with real git repo pass
- Cycle detection catches all cyclic graphs
- Lock file generation is deterministic
- Resolution completes in under 1 second for typical graphs (< 20 spaces)

## Open Questions

- Should we support `workspace:` protocol for local development?
- How should we handle yanked versions (if we add that feature later)?
