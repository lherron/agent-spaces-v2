# PRD: Phase 3 - Store & Integrity

## Introduction

Implement the content-addressed store that caches space snapshots and computes integrity hashes. The store enables fast, reproducible builds by extracting spaces once and referencing them by content hash. Integrity hashing uses git tree metadata for speed, avoiding full file I/O when possible.

## Goals

- Define ASP_HOME directory structure and path helpers
- Implement fast git-tree-based integrity hashing
- Implement file-walk integrity hashing as fallback for dev mode
- Extract and store space snapshots at specific commits
- Compute environment hashes for cache invalidation
- Support garbage collection of unreferenced entries

## User Stories

### US-001: Implement ASP_HOME Path Resolution
**Description:** As a developer, I need consistent path resolution for the ASP home directory.

**Acceptance Criteria:**
- [ ] `getAspHome(): string` function in `packages/store/src/paths.ts`
- [ ] Uses `ASP_HOME` env var if set
- [ ] Falls back to `~/.asp` on macOS/Linux
- [ ] Falls back to `%USERPROFILE%\.asp` on Windows
- [ ] Creates directory if it doesn't exist
- [ ] Unit tests for env var override
- [ ] Typecheck passes

### US-002: Implement Store Path Helpers
**Description:** As a developer, I need path builders for store subdirectories.

**Acceptance Criteria:**
- [ ] `getStorePath(): string` → `$ASP_HOME/store`
- [ ] `getSpaceStorePath(integrity: string): string` → `$ASP_HOME/store/spaces/sha256/<integrity>`
- [ ] `getCachePath(): string` → `$ASP_HOME/cache`
- [ ] `getMaterializedCachePath(cacheKey: string, pluginName: string): string` → `$ASP_HOME/cache/materialized/<key>/<pluginName>`
- [ ] `getRepoPath(): string` → `$ASP_HOME/repo`
- [ ] `getGlobalLockPath(): string` → `$ASP_HOME/global-lock.json`
- [ ] Unit tests
- [ ] Typecheck passes

### US-003: Implement Git Tree Listing
**Description:** As a developer, I need to list git tree entries for fast integrity hashing.

**Acceptance Criteria:**
- [ ] `listTreeEntries(spacePath: string, commit: string, repoPath: string): Promise<TreeEntry[]>` function
- [ ] Uses `git ls-tree -r` for recursive listing
- [ ] `TreeEntry` includes `path`, `mode`, `blobOid`
- [ ] Paths are relative to space directory
- [ ] Sorted alphabetically by path
- [ ] Unit tests with mock git
- [ ] Typecheck passes

### US-004: Implement Git-Based Integrity Hash
**Description:** As a developer, I need fast integrity hashing using git tree metadata (no file I/O).

**Acceptance Criteria:**
- [ ] `computeGitIntegrity(entries: TreeEntry[]): string` function
- [ ] Hash format: `sha256-<hex>` per spec
- [ ] Hashes: `path + '\0' + mode + '\0' + blobOid + '\n'` for each entry
- [ ] Entries must be sorted alphabetically before hashing
- [ ] Deterministic: same entries → same hash
- [ ] Unit tests with known test vectors
- [ ] Typecheck passes

### US-005: Implement File-Walk Integrity Hash
**Description:** As a developer, I need file-walk integrity hashing for dev mode (local paths not in git).

**Acceptance Criteria:**
- [ ] `computeFileIntegrity(dirPath: string): Promise<string>` function
- [ ] Walks directory recursively
- [ ] Hashes: `relativePath + '\0' + fileContent` for each file
- [ ] Files sorted alphabetically by path
- [ ] Ignores `.git`, `node_modules`, `.DS_Store`
- [ ] Deterministic: same files → same hash
- [ ] Unit tests
- [ ] Typecheck passes

### US-006: Implement Unified Integrity Function
**Description:** As a developer, I need a single function that computes integrity based on source type.

**Acceptance Criteria:**
- [ ] `computeIntegrity(source: IntegritySource): Promise<string>` function
- [ ] `IntegritySource` is `{ type: 'git', spacePath: string, commit: string, repoPath: string }` or `{ type: 'filesystem', path: string }`
- [ ] Dispatches to git-based or file-walk based on type
- [ ] Unit tests for both types
- [ ] Typecheck passes

### US-007: Implement Space Snapshot Extraction
**Description:** As a developer, I need to extract a space at a specific commit into the store.

**Acceptance Criteria:**
- [ ] `extractSnapshot(spaceId: string, commit: string, repoPath: string): Promise<SnapshotResult>` function
- [ ] Computes integrity hash first
- [ ] If already in store (by integrity), returns existing path (cache hit)
- [ ] If not in store, extracts using `git archive`
- [ ] Stores at `$ASP_HOME/store/spaces/sha256/<integrity>/`
- [ ] `SnapshotResult` includes `integrity`, `path`, `cached: boolean`
- [ ] Integration test with real git repo
- [ ] Typecheck passes

### US-008: Implement Atomic Snapshot Storage
**Description:** As a developer, I need snapshot storage to be atomic to prevent corruption.

**Acceptance Criteria:**
- [ ] Extraction writes to temp directory first
- [ ] Renames to final path atomically
- [ ] Handles concurrent extractions (second process waits or uses existing)
- [ ] Cleans up temp directory on failure
- [ ] Integration test for concurrent access
- [ ] Typecheck passes

### US-009: Implement Snapshot Lookup
**Description:** As a developer, I need to look up existing snapshots by integrity.

**Acceptance Criteria:**
- [ ] `lookupSnapshot(integrity: string): SnapshotInfo | null` function
- [ ] Returns `{ path, integrity }` if exists
- [ ] Returns `null` if not in store
- [ ] Validates directory structure (has space.toml)
- [ ] Unit tests
- [ ] Typecheck passes

### US-010: Implement Environment Hash
**Description:** As a developer, I need to compute an environment hash for cache invalidation.

**Acceptance Criteria:**
- [ ] `computeEnvHash(loadOrder: LoadOrderEntry[]): string` function
- [ ] `LoadOrderEntry` includes `spaceKey`, `integrity`, `pluginName`
- [ ] Hashes ordered list of entries
- [ ] Different load orders → different hashes
- [ ] Deterministic
- [ ] Unit tests
- [ ] Typecheck passes

### US-011: Implement Store Garbage Collection
**Description:** As a developer, I need to remove unreferenced store entries.

**Acceptance Criteria:**
- [ ] `collectGarbage(referencedIntegrities: Set<string>): Promise<GCResult>` function
- [ ] Lists all entries in store
- [ ] Removes entries not in referenced set
- [ ] `GCResult` includes `removed: string[]`, `kept: number`, `freedBytes: number`
- [ ] Does not remove entries currently being written (checks for .tmp)
- [ ] Unit tests
- [ ] Typecheck passes

### US-012: Implement Reference Collection
**Description:** As a developer, I need to collect all referenced integrities from lock files.

**Acceptance Criteria:**
- [ ] `collectReferences(lockPaths: string[]): Promise<Set<string>>` function
- [ ] Reads each lock file
- [ ] Extracts all integrity values
- [ ] Returns union of all referenced integrities
- [ ] Handles missing/invalid lock files gracefully
- [ ] Unit tests
- [ ] Typecheck passes

### US-013: Implement Store Statistics
**Description:** As a developer, I need to query store statistics for `asp list` and `asp doctor`.

**Acceptance Criteria:**
- [ ] `getStoreStats(): Promise<StoreStats>` function
- [ ] `StoreStats` includes `entryCount`, `totalBytes`, `oldestEntry`, `newestEntry`
- [ ] Efficient implementation (doesn't read file contents)
- [ ] Unit tests
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Git-based integrity must be preferred when source is from git
- FR-2: Integrity hash format must be `sha256-<64-char-hex>`
- FR-3: Snapshot storage must be atomic (no partial writes)
- FR-4: Store must handle concurrent access from multiple processes
- FR-5: Garbage collection must not remove entries being written
- FR-6: All paths must work cross-platform (macOS, Linux, Windows)

## Non-Goals

- No network operations (fetching from remote registries)
- No compression of stored snapshots
- No deduplication across spaces (each space stored independently)

## Technical Considerations

- Use `crypto.createHash('sha256')` for hashing
- Use streaming hashes for large files in file-walk mode
- Git tree listing is much faster than extracting + hashing files
- Store should work on case-insensitive filesystems (macOS default)

## Success Metrics

- Git-based integrity hash completes in < 100ms for typical space
- File-walk integrity hash completes in < 1 second for typical space
- Snapshot extraction is atomic and handles concurrent access
- Garbage collection correctly identifies unreferenced entries
- All operations work on macOS, Linux, and Windows

## Open Questions

- Should we compress stored snapshots to save disk space?
- Should we add a max store size with LRU eviction?
