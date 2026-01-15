#!/bin/bash
# Ralph Planning Loop
# Usage: ./ralph_plan_loop.sh [max_iterations]

set -euo pipefail
MAX=${1:-0}
ITER=0
BRANCH=$(git branch --show-current)

echo "━━━ Ralph Plan Loop ━━━"
echo "Branch: $BRANCH"
[ $MAX -gt 0 ] && echo "Max: $MAX"

while true; do
    [ $MAX -gt 0 ] && [ $ITER -ge $MAX ] && { echo "Done: $MAX iterations"; break; }
    eval "cat RALPH_PLAN_PROMPT.md | $(asp run ralph-plan --yolo --print-command --no-interactive)"
    git push origin "$BRANCH" 2>/dev/null || git push -u origin "$BRANCH"
    ITER=$((ITER + 1))
    echo -e "\n══════ PLAN ITERATION $ITER ══════\n"
done
