# PRD: Phase 5 - CLI Commands

## Introduction

Implement the `asp` CLI as a thin layer that parses arguments and delegates to the engine package. Commands cover the full lifecycle: running targets, building plugins, explaining resolution, installing dependencies, managing targets, repository operations, and maintenance tasks.

## Goals

- Provide intuitive CLI interface using Commander.js
- Keep CLI thin - all logic lives in engine package
- Support structured output (`--json`) for tooling integration
- Implement all commands from the spec
- Provide helpful error messages and usage hints

## User Stories

### US-001: Implement CLI Entry Point
**Description:** As a user, I need the `asp` command to parse arguments and show help.

**Acceptance Criteria:**
- [ ] `asp` with no args shows help
- [ ] `asp --help` shows all commands with descriptions
- [ ] `asp --version` shows version from package.json
- [ ] `asp <unknown>` shows "unknown command" error with suggestions
- [ ] Exit codes: 0 for success, 1 for error
- [ ] Typecheck passes

### US-002: Implement asp run Command
**Description:** As a user, I need `asp run` to launch Claude with my configured plugins.

**Acceptance Criteria:**
- [ ] `asp run <target>` runs a named target from asp-targets.toml
- [ ] `asp run space:my-space@stable` runs a single space in global mode
- [ ] `asp run ./path/to/space` runs from local filesystem (dev mode)
- [ ] Resolves dependencies, materializes plugins, invokes Claude
- [ ] Passes `--plugin-dir` flags in load order
- [ ] Passes `--mcp-config` if MCP is configured
- [ ] Shows progress/status during resolution
- [ ] Forwards remaining args to Claude (`asp run dev -- --model sonnet`)
- [ ] Integration test with claude-shim
- [ ] Typecheck passes

### US-003: Implement asp build Command
**Description:** As a user, I need `asp build` to materialize plugins without launching Claude.

**Acceptance Criteria:**
- [ ] `asp build <target> --output <dir>` materializes to output directory
- [ ] `asp build space:my-space@stable --output ./plugins` works in global mode
- [ ] Creates one subdirectory per space in output
- [ ] Prints summary of materialized plugins
- [ ] `--json` outputs structured result
- [ ] Integration test
- [ ] Typecheck passes

### US-004: Implement asp explain Command
**Description:** As a user, I need `asp explain` to show how my target resolves.

**Acceptance Criteria:**
- [ ] `asp explain <target>` shows human-readable resolution info
- [ ] Shows: resolved spaces with versions/commits
- [ ] Shows: load order
- [ ] Shows: cache hit/miss status
- [ ] Shows: warnings (if any)
- [ ] `--json` outputs structured result for tooling
- [ ] Works in project mode, global mode, and dev mode
- [ ] Integration test
- [ ] Typecheck passes

### US-005: Implement asp install Command
**Description:** As a user, I need `asp install` to resolve and lock my project's dependencies.

**Acceptance Criteria:**
- [ ] `asp install` parses asp-targets.toml
- [ ] Resolves all targets
- [ ] Generates/updates asp-lock.json (atomic write)
- [ ] Populates store with snapshots
- [ ] Shows progress during resolution
- [ ] Shows summary: added/updated/unchanged spaces
- [ ] `--json` outputs structured result
- [ ] Acquires project lock during operation
- [ ] Integration test
- [ ] Typecheck passes

### US-006: Implement asp add Command
**Description:** As a user, I need `asp add` to add a space to a target.

**Acceptance Criteria:**
- [ ] `asp add <spaceRef> --target <name>` adds space to target's compose list
- [ ] Updates asp-targets.toml (atomic write)
- [ ] Runs install automatically after update
- [ ] `--target` defaults to first target if only one exists
- [ ] Shows confirmation of what was added
- [ ] Errors if target doesn't exist
- [ ] Integration test
- [ ] Typecheck passes

### US-007: Implement asp remove Command
**Description:** As a user, I need `asp remove` to remove a space from a target.

**Acceptance Criteria:**
- [ ] `asp remove <spaceId> --target <name>` removes space from target's compose list
- [ ] Updates asp-targets.toml (atomic write)
- [ ] Runs install automatically after update
- [ ] Errors if space not in target
- [ ] Shows confirmation of what was removed
- [ ] Integration test
- [ ] Typecheck passes

### US-008: Implement asp upgrade Command
**Description:** As a user, I need `asp upgrade` to update locked versions.

**Acceptance Criteria:**
- [ ] `asp upgrade` updates all spaces to latest matching versions
- [ ] `asp upgrade <spaceId>` updates specific space only
- [ ] `--target <name>` limits to specific target
- [ ] Respects semver ranges in compose refs
- [ ] Updates asp-lock.json
- [ ] Shows what was upgraded (old → new version)
- [ ] `--json` outputs structured result
- [ ] Integration test
- [ ] Typecheck passes

### US-009: Implement asp diff Command
**Description:** As a user, I need `asp diff` to preview lock changes before installing.

**Acceptance Criteria:**
- [ ] `asp diff` shows what would change if install ran now
- [ ] Shows: added, removed, upgraded spaces
- [ ] Shows: version changes (old → new)
- [ ] `--target <name>` limits to specific target
- [ ] `--json` outputs structured result
- [ ] Does NOT write any files
- [ ] Integration test
- [ ] Typecheck passes

### US-010: Implement asp lint Command
**Description:** As a user, I need `asp lint` to validate my project and spaces.

**Acceptance Criteria:**
- [ ] `asp lint` validates project (targets + lock coherence)
- [ ] `asp lint <spacePath>` validates individual space
- [ ] Emits warnings with codes (W201, W203, etc.)
- [ ] Exit code 0 if no errors (warnings OK)
- [ ] Exit code 1 if errors
- [ ] `--json` outputs structured warnings/errors
- [ ] Integration test
- [ ] Typecheck passes

### US-011: Implement asp list Command
**Description:** As a user, I need `asp list` to see my targets and resolved spaces.

**Acceptance Criteria:**
- [ ] `asp list` shows all targets with their compose lists
- [ ] Shows resolved versions from lock file
- [ ] Shows cache status (cached/not cached)
- [ ] `--json` outputs structured result
- [ ] Works without lock file (shows unresolved refs)
- [ ] Integration test
- [ ] Typecheck passes

### US-012: Implement asp doctor Command
**Description:** As a user, I need `asp doctor` to diagnose my setup.

**Acceptance Criteria:**
- [ ] Checks Claude binary exists and shows version
- [ ] Checks ASP_HOME directory exists and is writable
- [ ] Checks registry repo exists
- [ ] Checks registry remote is reachable (if configured)
- [ ] Shows store statistics (entry count, size)
- [ ] Shows cache statistics
- [ ] Color-coded pass/fail indicators
- [ ] Exit code 0 if all checks pass
- [ ] Integration test
- [ ] Typecheck passes

### US-013: Implement asp gc Command
**Description:** As a user, I need `asp gc` to clean up unused cache entries.

**Acceptance Criteria:**
- [ ] `asp gc` removes unreferenced store entries
- [ ] Removes unreferenced cache entries
- [ ] Collects references from all project lock files found
- [ ] Collects references from global lock file
- [ ] Shows summary: removed entries, freed space
- [ ] `--dry-run` shows what would be removed without removing
- [ ] `--json` outputs structured result
- [ ] Integration test
- [ ] Typecheck passes

### US-014: Implement asp repo init Command
**Description:** As a user, I need `asp repo init` to set up my registry.

**Acceptance Criteria:**
- [ ] `asp repo init` creates new registry at $ASP_HOME/repo
- [ ] `asp repo init --clone <url>` clones existing registry
- [ ] Creates registry/dist-tags.json
- [ ] Creates spaces/ directory
- [ ] Installs agent-spaces-manager space
- [ ] Runs `asp run agent-spaces-manager` at the end (optional, can skip with --no-run)
- [ ] Errors if repo already exists (use --force to overwrite)
- [ ] Integration test
- [ ] Typecheck passes

### US-015: Implement asp repo publish Command
**Description:** As a user, I need `asp repo publish` to version and tag my spaces.

**Acceptance Criteria:**
- [ ] `asp repo publish <spaceId> --tag vX.Y.Z` creates version tag
- [ ] `--dist-tag stable` also updates stable in dist-tags.json
- [ ] `--dist-tag latest` also updates latest
- [ ] Validates space passes lint before publishing
- [ ] Creates immutable git tag `space/<id>/vX.Y.Z`
- [ ] Commits dist-tags.json change
- [ ] Shows confirmation with tag and commit
- [ ] Integration test
- [ ] Typecheck passes

### US-016: Implement asp repo status Command
**Description:** As a user, I need `asp repo status` to see my registry state.

**Acceptance Criteria:**
- [ ] Shows registry path
- [ ] Shows git status (clean/dirty)
- [ ] Shows remote URL (if configured)
- [ ] Shows last fetch time
- [ ] Shows space count
- [ ] `--json` outputs structured result
- [ ] Integration test
- [ ] Typecheck passes

### US-017: Implement asp repo tags Command
**Description:** As a user, I need `asp repo tags` to see versions of a space.

**Acceptance Criteria:**
- [ ] `asp repo tags <spaceId>` lists all version tags
- [ ] Shows semver tags and their commits
- [ ] Shows dist-tags and what versions they point to
- [ ] `--json` outputs structured result
- [ ] Integration test
- [ ] Typecheck passes

## Functional Requirements

- FR-1: CLI must be a thin layer - all logic in engine package
- FR-2: All commands that modify files must use atomic writes
- FR-3: All commands must support `--json` for structured output
- FR-4: All commands must have helpful `--help` text
- FR-5: Error messages must include actionable suggestions
- FR-6: Exit codes must be consistent (0 success, 1 error)

## Non-Goals

- No interactive prompts (batch-friendly)
- No TUI/visual interface
- No shell completion (can add later)

## Technical Considerations

- Use Commander.js for argument parsing
- Use chalk for colored output (respect NO_COLOR env)
- JSON output should include same info as human output
- Long-running operations should show progress

## Success Metrics

- All commands have help text
- All commands support --json
- Integration tests pass for all commands
- Error messages are actionable
- Commands complete in reasonable time (< 5s for typical operations)

## Open Questions

- Should we add shell completion scripts?
- Should we add a `--quiet` flag for minimal output?
