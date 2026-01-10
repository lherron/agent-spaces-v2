# PRD: Phase 4 - Materialization

## Introduction

Implement the materialization pipeline that transforms stored space snapshots into Claude Code plugin directories. This includes generating `plugin.json`, linking/copying components, validating hooks, composing MCP configurations, and managing the materialization cache.

## Goals

- Generate valid `.claude-plugin/plugin.json` from space.toml
- Link components from store using hardlinks (fast, disk-efficient)
- Fall back to copying when hardlinks aren't possible
- Validate and process hooks configuration
- Compose MCP server configurations from multiple spaces
- Cache materialized plugins by content hash

## User Stories

### US-001: Implement Plugin JSON Generation
**Description:** As a developer, I need to generate `.claude-plugin/plugin.json` from a space's manifest.

**Acceptance Criteria:**
- [ ] `generatePluginJson(space: Space): PluginManifest` function in `packages/materializer/src/plugin-json.ts`
- [ ] `name` is required, derived from space.id (kebab-case)
- [ ] `version` optional, from space.version
- [ ] `description` optional, from space.description
- [ ] Respects `pluginManifest` overrides in space.toml
- [ ] Output matches Claude Code plugin.json schema
- [ ] Unit tests
- [ ] Typecheck passes

### US-002: Implement Plugin JSON Writer
**Description:** As a developer, I need to write the plugin.json to the correct location.

**Acceptance Criteria:**
- [ ] `writePluginJson(manifest: PluginManifest, pluginDir: string): Promise<void>` function
- [ ] Writes to `<pluginDir>/.claude-plugin/plugin.json`
- [ ] Creates `.claude-plugin` directory if needed
- [ ] Pretty-prints JSON (2-space indent)
- [ ] Atomic write (temp file + rename)
- [ ] Unit tests
- [ ] Typecheck passes

### US-003: Implement Hardlink Component Copier
**Description:** As a developer, I need to link components from store to plugin dir using hardlinks.

**Acceptance Criteria:**
- [ ] `linkComponents(snapshotPath: string, pluginDir: string, options: LinkOptions): Promise<LinkResult>` function
- [ ] Creates hardlinks for all files in commands/, agents/, skills/, hooks/, scripts/
- [ ] Preserves directory structure
- [ ] Preserves file permissions (especially executable bits)
- [ ] `LinkResult` includes `linkedFiles`, `linkedBytes`
- [ ] Returns success even if some components don't exist (spaces may not have all component types)
- [ ] Unit tests
- [ ] Typecheck passes

### US-004: Implement Fallback Copy
**Description:** As a developer, I need to fall back to copying when hardlinks fail.

**Acceptance Criteria:**
- [ ] `copyComponents(snapshotPath: string, pluginDir: string): Promise<CopyResult>` function
- [ ] Copies all component directories
- [ ] Preserves directory structure
- [ ] Preserves file permissions
- [ ] `CopyResult` includes `copiedFiles`, `copiedBytes`
- [ ] Unit tests
- [ ] Typecheck passes

### US-005: Implement Smart Component Transfer
**Description:** As a developer, I need a unified function that tries hardlink first, falls back to copy.

**Acceptance Criteria:**
- [ ] `transferComponents(snapshotPath: string, pluginDir: string): Promise<TransferResult>` function
- [ ] Attempts hardlink first
- [ ] Falls back to copy if hardlink fails (cross-device, permissions, etc.)
- [ ] `TransferResult` includes `method: 'hardlink' | 'copy'`, file counts
- [ ] Logs which method was used
- [ ] Unit tests for both paths
- [ ] Typecheck passes

### US-006: Implement Hooks Validator
**Description:** As a developer, I need to validate hooks configuration before materialization.

**Acceptance Criteria:**
- [ ] `validateHooks(snapshotPath: string): Promise<HooksValidation>` function in `packages/materializer/src/hooks-builder.ts`
- [ ] If `hooks/` exists, `hooks/hooks.json` must exist
- [ ] Validates `hooks.json` against Claude Code hooks schema
- [ ] Checks all referenced scripts exist
- [ ] `HooksValidation` includes `valid: boolean`, `errors: string[]`, `warnings: string[]`
- [ ] Unit tests
- [ ] Typecheck passes

### US-007: Implement Hook Script Permissions
**Description:** As a developer, I need to ensure hook scripts are executable.

**Acceptance Criteria:**
- [ ] `ensureHooksExecutable(pluginDir: string): Promise<void>` function
- [ ] Reads `hooks/hooks.json` to find script paths
- [ ] Sets executable bit on all referenced scripts
- [ ] Handles scripts without executable bit gracefully
- [ ] Unit tests
- [ ] Typecheck passes

### US-008: Implement Hook Path Validation
**Description:** As a developer, I need to validate that hook paths use `${CLAUDE_PLUGIN_ROOT}`.

**Acceptance Criteria:**
- [ ] Part of `validateHooks` function
- [ ] Checks that hook command paths start with `${CLAUDE_PLUGIN_ROOT}`
- [ ] Returns warning (not error) if missing (for lint rule W203)
- [ ] Unit tests
- [ ] Typecheck passes

### US-009: Implement MCP Config Reader
**Description:** As a developer, I need to read MCP configuration from a space.

**Acceptance Criteria:**
- [ ] `readMcpConfig(snapshotPath: string): Promise<McpConfig | null>` function in `packages/materializer/src/mcp-composer.ts`
- [ ] Reads `mcp/mcp.json` if it exists
- [ ] Validates against MCP config schema
- [ ] Returns `null` if file doesn't exist (not all spaces have MCP)
- [ ] Unit tests
- [ ] Typecheck passes

### US-010: Implement MCP Config Composer
**Description:** As a developer, I need to compose MCP configs from multiple spaces into one.

**Acceptance Criteria:**
- [ ] `composeMcpConfigs(configs: McpConfig[], loadOrder: string[]): McpConfig` function
- [ ] Merges `mcpServers` objects from all configs
- [ ] Later spaces in load order override earlier ones (if same server name)
- [ ] Preserves all server configuration
- [ ] Unit tests
- [ ] Typecheck passes

### US-011: Implement MCP Config Writer
**Description:** As a developer, I need to write the composed MCP config to a file for Claude.

**Acceptance Criteria:**
- [ ] `writeMcpConfig(config: McpConfig, outputPath: string): Promise<void>` function
- [ ] Writes JSON to specified path
- [ ] Atomic write
- [ ] Unit tests
- [ ] Typecheck passes

### US-012: Implement Materialization Cache Key
**Description:** As a developer, I need to compute cache keys for materialized plugins.

**Acceptance Criteria:**
- [ ] `computeCacheKey(integrity: string, pluginName: string, materializerVersion: string): string` function in `packages/materializer/src/cache.ts`
- [ ] Hash of: materializer version + space integrity + plugin name
- [ ] Format: `sha256-<hex>` (truncated to 16 chars for readability)
- [ ] Deterministic
- [ ] Unit tests
- [ ] Typecheck passes

### US-013: Implement Cache Lookup
**Description:** As a developer, I need to look up cached materialized plugins.

**Acceptance Criteria:**
- [ ] `lookupCache(cacheKey: string, pluginName: string): string | null` function
- [ ] Returns path if cached plugin exists
- [ ] Validates plugin structure (has .claude-plugin/plugin.json)
- [ ] Returns `null` if not cached or invalid
- [ ] Unit tests
- [ ] Typecheck passes

### US-014: Implement Cache Storage
**Description:** As a developer, I need to store materialized plugins in the cache.

**Acceptance Criteria:**
- [ ] `storeInCache(pluginDir: string, cacheKey: string, pluginName: string): Promise<string>` function
- [ ] Copies/moves plugin dir to cache location
- [ ] Returns cache path
- [ ] Handles concurrent storage (second process uses existing)
- [ ] Atomic storage
- [ ] Unit tests
- [ ] Typecheck passes

### US-015: Implement Full Materialization Pipeline
**Description:** As a developer, I need a single function that materializes a space to a plugin directory.

**Acceptance Criteria:**
- [ ] `materialize(snapshot: SnapshotInfo, options: MaterializeOptions): Promise<MaterializeResult>` function in `packages/materializer/src/index.ts`
- [ ] Checks cache first, returns cached if hit
- [ ] Creates temp directory for atomic materialization
- [ ] Generates plugin.json
- [ ] Transfers components (hardlink/copy)
- [ ] Validates and processes hooks
- [ ] Stores in cache
- [ ] `MaterializeResult` includes `pluginPath`, `cached: boolean`, `warnings: string[]`
- [ ] Integration test
- [ ] Typecheck passes

### US-016: Implement Multi-Space Materialization
**Description:** As a developer, I need to materialize multiple spaces with MCP composition.

**Acceptance Criteria:**
- [ ] `materializeAll(snapshots: SnapshotInfo[], loadOrder: string[]): Promise<MaterializeAllResult>` function
- [ ] Materializes each space
- [ ] Composes MCP configs from all spaces
- [ ] Writes composed MCP config
- [ ] `MaterializeAllResult` includes `pluginPaths: string[]`, `mcpConfigPath: string | null`
- [ ] Integration test
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Hardlinks must be preferred over copying for performance
- FR-2: All writes must be atomic (temp + rename)
- FR-3: Hook scripts must be executable after materialization
- FR-4: MCP config composition must follow load order (later overrides earlier)
- FR-5: Cache hits must skip all materialization work
- FR-6: Materialization must work offline (no network)

## Non-Goals

- No TypeScript compilation of hooks (future enhancement)
- No minification or bundling
- No symlink support (hardlinks only)

## Technical Considerations

- Hardlinks require same filesystem (won't work cross-device)
- File permissions must be preserved for hooks
- MCP config is passthrough - we don't validate server availability
- Cache should be keyed by content, not by version string

## Success Metrics

- Cache hit returns in < 10ms
- Full materialization completes in < 500ms for typical space
- Hardlinks used successfully on same-filesystem scenarios
- Hook scripts are executable after materialization
- MCP config correctly merges multiple spaces

## Open Questions

- Should we support hook script compilation (TypeScript → JavaScript)?
- Should we validate MCP server commands exist?
