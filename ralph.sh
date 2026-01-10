#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Runs Claude Code repeatedly until all PRD items are complete
# Usage: ./ralph.sh [prd-file] [max_iterations]
# Examples:
#   ./ralph.sh                     # Uses prd.json, 10 iterations
#   ./ralph.sh prd-00.json         # Uses prd-00.json, 10 iterations
#   ./ralph.sh prd-01.json 20      # Uses prd-01.json, 20 iterations

set -e

# Parse arguments
PRD_ARG="${1:-prd.json}"
MAX_ITERATIONS="${2:-10}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Determine PRD file path
if [[ "$PRD_ARG" == /* ]]; then
  # Absolute path
  PRD_FILE="$PRD_ARG"
else
  # Relative to script dir
  PRD_FILE="$SCRIPT_DIR/$PRD_ARG"
fi

# Validate PRD file exists
if [ ! -f "$PRD_FILE" ]; then
  echo "Error: PRD file not found: $PRD_FILE"
  echo ""
  echo "Available PRD files:"
  ls -1 "$SCRIPT_DIR"/prd*.json 2>/dev/null || echo "  (none found)"
  exit 1
fi

PRD_BASENAME=$(basename "$PRD_FILE" .json)
PROGRESS_FILE="$SCRIPT_DIR/progress-${PRD_BASENAME}.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch-${PRD_BASENAME}"

echo "Using PRD: $PRD_FILE"
echo "Progress file: $PROGRESS_FILE"

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "PRD: $PRD_BASENAME" >> "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "PRD: $PRD_BASENAME" >> "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph - Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "  PRD: $PRD_BASENAME"
  echo "═══════════════════════════════════════════════════════"

  # Create a temp prompt file that includes the PRD path
  PROMPT_CONTENT=$(cat "$SCRIPT_DIR/prompt.md")
  PROMPT_WITH_PRD="$PROMPT_CONTENT

## PRD File Location
The PRD file for this run is: \`$PRD_FILE\`
The progress file for this run is: \`$PROGRESS_FILE\`
"

  # Run Claude Code with the ralph prompt
  OUTPUT=$(echo "$PROMPT_WITH_PRD" | claude -p - --dangerously-skip-permissions 2>&1 | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
exit 1
