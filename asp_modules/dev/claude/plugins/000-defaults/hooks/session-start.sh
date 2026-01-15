#!/bin/bash
# Session start hook for Claude Code
# Checks for Justfile and shows tasks, then runs wrkq info

# Check for Justfile/justfile and run just --list if found
if [ -f "Justfile" ] || [ -f "justfile" ]; then
    echo "=== This project uses Justfile ==="
    just --list 2>/dev/null || echo "(just --list failed)"
    echo ""
fi

# Run wrkq info
echo "=== This project uses wrkq ==="
wrkq agent-info 2>/dev/null || echo "(wrkq info failed or not available)"

exit 0
