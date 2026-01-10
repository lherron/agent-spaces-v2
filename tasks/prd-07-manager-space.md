# PRD: Phase 7 - Manager Space

## Introduction

Create the `agent-spaces-manager` space that ships with the product. This space provides commands, skills, and an agent that help users create, manage, and publish spaces. It runs after `asp repo init` and provides an AI-powered interface for common workflows.

## Goals

- Help users create new spaces with correct structure
- Provide templates for skills, commands, hooks
- Guide users through publishing workflow
- Help update project asp-targets.toml
- Make space authoring discoverable and easy

## User Stories

### US-001: Create Space Manifest
**Description:** As a shipped space, I need a valid space.toml manifest.

**Acceptance Criteria:**
- [ ] `spaces/agent-spaces-manager/space.toml` exists
- [ ] id: `agent-spaces-manager`
- [ ] name: `agent-spaces-manager`
- [ ] version: `0.1.0`
- [ ] description: "AI assistant for creating and managing Agent Spaces"
- [ ] No dependencies (self-contained)
- [ ] Passes `asp lint`
- [ ] Typecheck passes (N/A - no TS)

### US-002: Implement help Command
**Description:** As a user, I need a help command that shows available asp operations.

**Acceptance Criteria:**
- [ ] `commands/help.md` file
- [ ] Lists all asp CLI commands with brief descriptions
- [ ] Groups commands by category (run, project, repo)
- [ ] Includes examples for common workflows
- [ ] Uses `/agent-spaces-manager:help` fully-qualified form in docs

### US-003: Implement create-space Command
**Description:** As a user, I need help creating a new space with correct structure.

**Acceptance Criteria:**
- [ ] `commands/create-space.md` file
- [ ] Asks for: space name, description, components needed
- [ ] Creates directory structure in registry
- [ ] Creates minimal space.toml
- [ ] Creates placeholder files for selected components
- [ ] Validates name is valid kebab-case
- [ ] Shows next steps after creation

### US-004: Implement add-skill Command
**Description:** As a user, I need help adding a skill to my space.

**Acceptance Criteria:**
- [ ] `commands/add-skill.md` file
- [ ] Asks for: skill name, description
- [ ] Creates `skills/<name>/SKILL.md` with template
- [ ] Template includes standard sections (trigger, process, example)
- [ ] Updates space.toml if needed
- [ ] Shows how to test the skill

### US-005: Implement add-command Command
**Description:** As a user, I need help adding a command to my space.

**Acceptance Criteria:**
- [ ] `commands/add-command.md` file
- [ ] Asks for: command name, description
- [ ] Creates `commands/<name>.md` with template
- [ ] Template includes description and placeholder content
- [ ] Shows how to invoke the command

### US-006: Implement add-hook Command
**Description:** As a user, I need help adding a hook to my space.

**Acceptance Criteria:**
- [ ] `commands/add-hook.md` file
- [ ] Asks for: hook type (PreToolUse, PostToolUse, etc.)
- [ ] Creates `hooks/hooks.json` if not exists
- [ ] Creates hook script with template
- [ ] Sets executable permissions
- [ ] Uses `${CLAUDE_PLUGIN_ROOT}` in paths
- [ ] Validates hook configuration

### US-007: Implement bump-version Command
**Description:** As a user, I need help updating my space's version.

**Acceptance Criteria:**
- [ ] `commands/bump-version.md` file
- [ ] Shows current version
- [ ] Asks for bump type (major, minor, patch) or specific version
- [ ] Updates version in space.toml
- [ ] Suggests running publish after bump

### US-008: Implement publish Command
**Description:** As a user, I need help publishing my space.

**Acceptance Criteria:**
- [ ] `commands/publish.md` file
- [ ] Runs lint first and reports issues
- [ ] Asks for version tag
- [ ] Asks for dist-tag (stable, latest, beta, none)
- [ ] Runs `asp repo publish` with correct args
- [ ] Shows confirmation and next steps

### US-009: Implement update-project-targets Command
**Description:** As a user, I need help modifying my project's asp-targets.toml.

**Acceptance Criteria:**
- [ ] `commands/update-project-targets.md` file
- [ ] Detects project root (finds asp-targets.toml)
- [ ] Shows current targets and their spaces
- [ ] Helps add/remove spaces from targets
- [ ] Helps create new targets
- [ ] Runs install after changes

### US-010: Implement space-authoring Skill
**Description:** As a user, I need guidance on space authoring best practices.

**Acceptance Criteria:**
- [ ] `skills/space-authoring/SKILL.md` file
- [ ] Explains space structure and components
- [ ] Covers commands, skills, agents, hooks
- [ ] Explains MCP configuration
- [ ] Covers versioning and publishing
- [ ] Includes common patterns and anti-patterns

### US-011: Implement manager Agent
**Description:** As a user, I need an agent that coordinates space management workflows.

**Acceptance Criteria:**
- [ ] `agents/manager.md` file
- [ ] Understands user's intent (create, modify, publish)
- [ ] Delegates to appropriate commands
- [ ] Handles multi-step workflows
- [ ] Provides context-aware suggestions
- [ ] Uses fully-qualified command references

### US-012: Validate Space Structure
**Description:** As a shipped space, I need valid structure that passes all checks.

**Acceptance Criteria:**
- [ ] All commands are valid markdown
- [ ] All skills follow SKILL.md format
- [ ] Agent file is valid
- [ ] `asp lint spaces/agent-spaces-manager` passes
- [ ] Space can be materialized successfully
- [ ] Integration test: run with claude-shim

## Functional Requirements

- FR-1: All commands must use fully-qualified `/agent-spaces-manager:` prefix in references
- FR-2: Commands should work with or without registry initialized
- FR-3: Commands should handle errors gracefully with helpful messages
- FR-4: Templates should include comments explaining each section
- FR-5: Commands should validate inputs before making changes

## Non-Goals

- No MCP servers in manager space
- No hooks in manager space
- No external dependencies
- No network operations (beyond what asp commands do)

## Technical Considerations

- Commands are markdown files interpreted by Claude
- Should work with any Claude model
- Keep templates minimal but complete
- Assume user may be new to agent spaces

## Success Metrics

- Manager space passes lint with no warnings
- All commands produce valid output
- Users can create and publish a space using only manager commands
- Commands work on fresh repo init

## Open Questions

- Should we include example spaces for reference?
- Should manager have a "tutorial" command for first-time users?
