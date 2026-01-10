# PRD: Phase 6 - Linting Rules

## Introduction

Implement the linting system that validates spaces and projects, emitting warnings and errors with standardized codes. The lint package is the single source of truth for all warnings - the resolver only emits errors. Warnings help users catch issues before runtime.

## Goals

- Implement all warning rules from the spec
- Provide clear, actionable warning messages
- Support both space-level and project-level linting
- Enable JSON output for tooling integration
- Make warnings suppressible for specific cases

## User Stories

### US-001: Implement Lint Runner Infrastructure
**Description:** As a developer, I need a lint runner that collects and reports results.

**Acceptance Criteria:**
- [ ] `LintRunner` class in `packages/lint/src/index.ts`
- [ ] `runner.addRule(rule: LintRule)` method
- [ ] `runner.lintSpace(space: Space, snapshotPath: string): Promise<LintResult>` method
- [ ] `runner.lintProject(config: TargetsConfig, closure: Closure): Promise<LintResult>` method
- [ ] `LintResult` includes `warnings: Warning[]`, `errors: Error[]`
- [ ] Unit tests
- [ ] Typecheck passes

### US-002: Implement Lint Rule Interface
**Description:** As a developer, I need a standard interface for lint rules.

**Acceptance Criteria:**
- [ ] `LintRule` interface with `code`, `name`, `description`
- [ ] `check(context: LintContext): Promise<Diagnostic[]>` method
- [ ] `Diagnostic` includes `code`, `severity`, `message`, `location?`
- [ ] `location` includes `file`, `line?`, `column?`
- [ ] Rules can be async (for file I/O)
- [ ] Unit tests
- [ ] Typecheck passes

### US-003: Implement W201 Command Name Collision
**Description:** As a user, I need to know when multiple spaces define the same command name.

**Acceptance Criteria:**
- [ ] Rule code: `W201`
- [ ] Detects when two spaces in load order have same command filename
- [ ] Warning message includes: both space IDs, command name
- [ ] Example: "W201: Command 'build' defined in both 'frontend' and 'backend'. Later space wins."
- [ ] Only triggers for project-level lint (needs multiple spaces)
- [ ] Unit tests
- [ ] Typecheck passes

### US-004: Implement W203 Hook Path Missing Plugin Root
**Description:** As a user, I need to know when hook paths don't use the plugin root variable.

**Acceptance Criteria:**
- [ ] Rule code: `W203`
- [ ] Reads `hooks/hooks.json` if exists
- [ ] Checks each hook command path
- [ ] Warns if path doesn't start with `${CLAUDE_PLUGIN_ROOT}`
- [ ] Warning message: "W203: Hook 'PreToolUse' uses absolute path. Use ${CLAUDE_PLUGIN_ROOT} for portability."
- [ ] Triggers for space-level lint
- [ ] Unit tests
- [ ] Typecheck passes

### US-005: Implement W204 Invalid Hooks Config
**Description:** As a user, I need to know when my hooks configuration is invalid.

**Acceptance Criteria:**
- [ ] Rule code: `W204`
- [ ] Checks if `hooks/` directory exists
- [ ] If exists, checks `hooks/hooks.json` exists
- [ ] Validates hooks.json against schema
- [ ] Checks referenced scripts exist
- [ ] Warning message: "W204: hooks/ directory exists but hooks/hooks.json is missing/invalid"
- [ ] Triggers for space-level lint
- [ ] Unit tests
- [ ] Typecheck passes

### US-006: Implement W205 Plugin Name Collision
**Description:** As a user, I need to know when multiple spaces produce the same plugin name.

**Acceptance Criteria:**
- [ ] Rule code: `W205`
- [ ] Detects when two spaces resolve to same plugin name (from space.toml name field)
- [ ] Warning message: "W205: Spaces 'my-space' and 'other-space' both produce plugin name 'my-plugin'"
- [ ] Only triggers for project-level lint
- [ ] Unit tests
- [ ] Typecheck passes

### US-007: Implement W206 Non-Executable Hook Script
**Description:** As a user, I need to know when hook scripts aren't executable.

**Acceptance Criteria:**
- [ ] Rule code: `W206`
- [ ] Checks scripts referenced in hooks.json
- [ ] Warns if script exists but not executable
- [ ] Warning message: "W206: Hook script 'hooks/pre-tool.sh' is not executable"
- [ ] Suggests fix: `chmod +x hooks/pre-tool.sh`
- [ ] Triggers for space-level lint
- [ ] Unit tests
- [ ] Typecheck passes

### US-008: Implement Lock Coherence Check
**Description:** As a user, I need to know when my lock file is out of sync with targets.

**Acceptance Criteria:**
- [ ] Detects when asp-lock.json doesn't match asp-targets.toml
- [ ] Warns on: missing spaces, extra spaces, version mismatches
- [ ] Error (not warning) for critical mismatches
- [ ] Message: "Lock file out of sync. Run 'asp install' to update."
- [ ] Triggers for project-level lint
- [ ] Unit tests
- [ ] Typecheck passes

### US-009: Implement Space Manifest Validator
**Description:** As a user, I need to validate my space.toml is well-formed.

**Acceptance Criteria:**
- [ ] Validates space.toml against schema
- [ ] Checks required fields present
- [ ] Checks id matches directory name convention
- [ ] Checks name is valid kebab-case
- [ ] Errors for invalid manifest (blocks publish)
- [ ] Triggers for space-level lint
- [ ] Unit tests
- [ ] Typecheck passes

### US-010: Implement Lint Reporter
**Description:** As a developer, I need formatted output for lint results.

**Acceptance Criteria:**
- [ ] `LintReporter` class in `packages/lint/src/reporter.ts`
- [ ] `formatHuman(result: LintResult): string` for terminal output
- [ ] `formatJson(result: LintResult): string` for JSON output
- [ ] Human format: colored, grouped by file, with context
- [ ] JSON format: structured array of diagnostics
- [ ] Summary line: "X warnings, Y errors"
- [ ] Unit tests
- [ ] Typecheck passes

### US-011: Implement Warning Suppression
**Description:** As a user, I need to suppress specific warnings I've acknowledged.

**Acceptance Criteria:**
- [ ] Support `# asp-lint-ignore: W201` comment in space.toml
- [ ] Support `asp.lint.ignore` array in space.toml
- [ ] Suppressed warnings still collected but marked `suppressed: true`
- [ ] Human output shows suppressed count
- [ ] JSON output includes suppressed diagnostics
- [ ] Unit tests
- [ ] Typecheck passes

### US-012: Implement Project-Level Lint Entry Point
**Description:** As a developer, I need a function that lints an entire project.

**Acceptance Criteria:**
- [ ] `lintProject(projectPath: string): Promise<LintResult>` function
- [ ] Loads asp-targets.toml
- [ ] Loads asp-lock.json if exists
- [ ] Runs lock coherence check
- [ ] Runs collision checks across all targets
- [ ] Aggregates results from all rules
- [ ] Integration test
- [ ] Typecheck passes

### US-013: Implement Space-Level Lint Entry Point
**Description:** As a developer, I need a function that lints a single space.

**Acceptance Criteria:**
- [ ] `lintSpace(spacePath: string): Promise<LintResult>` function
- [ ] Loads space.toml
- [ ] Runs manifest validation
- [ ] Runs hooks validation
- [ ] Runs all space-level rules
- [ ] Integration test
- [ ] Typecheck passes

## Functional Requirements

- FR-1: All warnings must have unique codes (W2XX format)
- FR-2: Warning messages must be actionable (say what to do)
- FR-3: Location information must be included when available
- FR-4: Suppressed warnings must still be tracked
- FR-5: JSON output must be machine-parseable
- FR-6: Exit codes: 0 for warnings-only, 1 for errors

## Non-Goals

- No auto-fix functionality
- No IDE integration (LSP)
- No custom rule plugins

## Technical Considerations

- Rules should be stateless and parallelizable
- File I/O should be cached within a lint run
- Use consistent diagnostic format matching other tools (ESLint-like)

## Success Metrics

- All warning codes from spec implemented
- Warning messages are actionable
- JSON output integrates with CI tools
- Lint runs in < 1 second for typical project

## Open Questions

- Should we add severity levels (warning vs info)?
- Should we support .asplintrc config file?
