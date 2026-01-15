# Implementation Plan (pi-sdk harness)

- Confirm `pi-sdk` harness requirements vs existing `pi` adapter (compare `specs/pisdk-spec.md` vs `packages/engine/src/harness/pi-adapter.ts`).
- Add new harness id `pi-sdk` to core harness typing (`packages/core/src/types/harness.ts`).
- Expand space schema to allow `harness.supports` to include `pi-sdk` (`packages/core/src/schemas/space.schema.json`).
- Add a new `PiSdkAdapter` in engine (`packages/engine/src/harness/pi-sdk-adapter.ts`) with `detect`, `validateSpace`, `materializeSpace`, `composeTarget`, and `buildRunArgs`.
- Register `PiSdkAdapter` in the engine harness registry (`packages/engine/src/harness/index.ts`) and update harness registry tests/fixtures to expect it.
- Refactor `packages/engine/src/run.ts` to stop treating “non-claude” as “pi” (remove `buildPiBundle()` shortcut) so each non-Claude harness loads/uses its own composed bundle metadata.
- Define and implement a `pi-sdk` bundle output contract under `asp_modules/<target>/pi-sdk/` including a versioned `bundle.json` manifest and directories for `extensions/`, `skills/`, `hooks/`, and `context/`.
- Implement a `pi-sdk` runner script (shipped inside `spaces-engine` dist) that reads `bundle.json`, loads extension factories via dynamic import, and creates/runs a pi-sdk `createAgentSession()`.
- Implement hook execution semantics for `pi-sdk` using pi-sdk’s ability to block tool calls (support `blocking` hooks; add `--yolo` to disable blocking behavior).
- Decide runtime strategy for runner (`node` vs `bun`) and document constraints for extension bundling/third-party deps.
- Ensure `asp run --harness pi-sdk --dry-run` prints a copy/pasteable command that includes `PI_CODING_AGENT_DIR=<bundle root>` and uses `--no-extensions` when there are none and `--no-skills` to disable default discovery (per project AGENTS.md).
- Add tests for `pi-sdk` bundle composition ordering + `bundle.json` generation (mirror `packages/engine/src/harness/pi-adapter.test.ts`) and CLI/integration tests for `--harness pi-sdk` acceptance and error messages.
- Update docs (`README.md`/`USAGE.md`/`ARCHITECTURE.md`) to mention the new harness and its expected `--model` semantics (e.g., `provider:model`).
