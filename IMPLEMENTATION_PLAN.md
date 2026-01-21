# Agent Spaces Implementation Plan

## Project Goal
Implement the Codex harness as described in `specs/codex-agent-harness.md` so Codex is supported for:
- `asp install`/`asp run` via the Codex CLI
- programmatic `runTurn()` via the Codex app-server

## Dependencies and External Tasks
- [x] Confirm Codex CLI availability and app-server protocol stability.
  - [x] Ensure a documented minimum Codex CLI version with `codex app-server` support is available for dev/CI (>= 0.1.0).
  - [x] Capture JSON-RPC v2 method/notification shapes from upstream Codex app-server docs/artifacts for use in types/tests.

## Notes
- Approval requests in the v2 app-server protocol are `item/commandExecution/requestApproval` and `item/fileChange/requestApproval` (spec updated to match artifacts).
- Resolved: CLI `install`/`build` now handle codex harness command generation via adapter-backed bundles.
- Resolved: Codex app-server docs in specs/runbook now mirror artifacts (`threadId`, `localImage`).
- Resolved: Global/dev `asp run` now respects non-Claude harness selection (codex) and emits `CODEX_HOME` in dry-run output.
- Resolved: Codex app-server turns now receive `sandboxPolicy` from session config to honor sandbox settings consistently.
- Resolved: Codex app-server error notifications now surface as session failures to avoid hanging turns.
- Tests: `bun run test`.
- Validation: `ASP_HOME=/tmp/asp-test PATH=integration-tests/fixtures/codex-shim:$PATH bun packages/cli/bin/asp.js run integration-tests/fixtures/sample-registry/spaces/base --dry-run --harness codex` + `bun run test`.

## Implementation Tasks (Priority Order)
- [x] 1) Foundation: add codex to shared types and schemas.
  - [x] Update `packages/config/src/core/types/harness.ts` to add `codex` to `HarnessId`/`HARNESS_IDS`, add `SpaceCodexConfig`, and extend `ComposedTargetBundle` with codex paths.
  - [x] Update `packages/config/src/core/types/space.ts` to include `codex` in `SpaceHarnessConfig.supports` and add `codex?: SpaceCodexConfig` on `SpaceManifest`.
  - [x] Update `packages/config/src/core/types/targets.ts` to add `[codex]` options (model, approval_policy, sandbox_mode, profile) plus helpers to resolve defaults.
  - [x] Update schemas `packages/config/src/core/schemas/space.schema.json` and `packages/config/src/core/schemas/targets.schema.json` to validate codex config.
  - [x] Update type exports/tests that rely on harness enums or manifest validation to cover codex.

- [x] 2) Codex harness adapter (materialization + template composition).
  - [x] Create `packages/execution/src/harness/codex-adapter.ts` implementing `HarnessAdapter` with detect/validate/materialize/compose/buildRunArgs/getTargetOutputPath.
  - [x] Materialize per-space artifacts: copy skills, flatten `commands/*.md` into prompts, copy MCP config, and extract instructions from `AGENTS.md` or `AGENT.md` with `SpaceCodexConfig` toggles honored.
  - [x] Compose `codex.home`: merge skills/prompts (last wins), render `AGENTS.md` with per-space blocks, compose MCP into `config.toml`, add `project_doc_fallback_filenames`, and merge `codex.config` dotted keypaths; optionally emit `mcp.json` and `manifest.json`.
  - [x] Populate `ComposedTargetBundle` codex fields and set `pluginDirs`/`mcpConfigPath` (pointing at `codex.home`) for compatibility with existing discovery.

- [x] 3) Execution pipeline updates for CLI run (`asp run --harness codex`).
  - [x] Register the codex adapter in `packages/execution/src/harness/index.ts` (optionally gated by `ASP_EXPERIMENTAL_CODEX`).
  - [x] Update `packages/execution/src/run.ts` to handle `codex` in the non-Claude path: load a codex bundle, set `CODEX_HOME=<output>/codex.home`, and include it in dry-run/print-command output.
  - [x] Wire target-level codex defaults and `--model`/`--yolo` into `buildRunArgs` (model, sandbox mode, approval policy) without swallowing errors.

- [x] 4) Codex app-server session (programmatic `runTurn`).
  - [x] Add `codex` to `SessionKind` and extend `CreateSessionOptions` in `packages/execution/src/session/types.ts` and `packages/execution/src/session/factory.ts`.
  - [x] Implement `packages/execution/src/codex-session/` (RPC client + session + event mapper + approval handler) to spawn `codex app-server`, initialize, start/resume threads, and map notifications into `UnifiedSessionEvent`.
  - [x] Handle attachments (local images vs text references), approvals via `PermissionHandler`, and optional JSONL capture (`eventsOutputPath`).

- [x] 5) Agent-spaces client integration for `harness: "codex"`.
  - [x] Add `CODEX_MODELS` and default model to `HARNESS_DEFS` in `packages/agent-spaces/src/client.ts`, plus `getHarnessCapabilities` coverage.
  - [x] Add `codexSessionPath` and session-home materialization (copy `config.toml`, symlink skills/prompts/AGENTS) and apply `CODEX_HOME` during `runTurn`.
  - [x] Create `CodexSession` via `createSession`, persist `harnessSessionId` as the thread id, and update `packages/agent-spaces/src/client.test.ts`.

- [x] 6) Discovery and compatibility tweaks.
  - [x] Decide on skill discovery for codex: set `bundle.pluginDirs` to `codex.home` or add codex-aware discovery in `packages/config/src/orchestration/materialize-refs.ts`.
  - [x] Ensure tools discovery works for codex by wiring `mcp.json` (or a codex config parser) into `collectTools`.

- [x] 7) Tests.
  - [x] Add codex adapter unit tests (skills merge, prompts flattening, `AGENTS.md` composition, `config.toml` rendering).
  - [x] Add codex session tests using a fake JSON-RPC app-server (initialize, thread start/resume, turn flow, approvals, attachments).
  - [x] Add integration tests for `asp install/build/run --harness codex` using a codex shim or fake server; update harness registry/client tests for new harness IDs.

- [x] 8) Docs and rollout.
  - [x] Update README/USAGE and CLI `asp harnesses` output to list codex as experimental; document `ASP_EXPERIMENTAL_CODEX` if used.
  - [x] Align `docs/codex-smoke-test-runbook.md` with the actual `space.toml` schema and codex target options; document Codex CLI prerequisites.
