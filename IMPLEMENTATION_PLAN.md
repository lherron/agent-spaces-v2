# Implementation Plan: Modular Harness Architecture

Status: Core refactor complete per spec. Remaining work is validation/downstream verification.

## Remaining work
- [ ] Run `bun run --filter 'agent-spaces' typecheck` after deps are available to confirm `spaces-execution` re-exports compile.
- [ ] Run CLI dry-run smoke tests per `AGENTS.md` for each harness fixture.
- [ ] Run `bun run build`, `bun run typecheck`, `bun run lint`, and `bun run test`.

## Blockers / notes
- `bun install` fails in this environment (registry access errors). Without deps, `bun packages/cli/bin/asp.js ... --dry-run` fails (`Cannot find package 'chalk'`).
- Prior attempts with `BUN_INSTALL_CACHE_DIR=/tmp/bun-cache bun install` still fail (ConnectionRefused/FailedToOpenSocket for registry manifests like `@types/bun`, `typescript`, `@anthropic-ai/claude-agent-sdk`).
