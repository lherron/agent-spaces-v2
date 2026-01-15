#!/usr/bin/env python3
"""
Hook to log ALL Bash tool calls (request + response).
Triggered by PostToolUse - fires after every tool execution.
Logs to ~/.claude/bash-all.log
"""
import json
import sys
from datetime import datetime
import os

LOG_FILE = os.path.expanduser("~/.claude/bash-all.log")

def main():
    try:
        raw_input = sys.stdin.read()
        hook_input = json.loads(raw_input)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    # Only process Bash tool
    if hook_input.get("tool_name") != "Bash":
        sys.exit(0)

    timestamp = datetime.now().isoformat()

    # Log the ENTIRE raw payload to see all available fields
    log_entry = {
        "timestamp": timestamp,
        "raw_hook_payload": hook_input,  # Full payload for investigation
    }

    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(log_entry, indent=2) + "\n---\n")
        cmd = hook_input.get("tool_input", {}).get("command", "N/A")[:40]
        print(f"[LOGGED ALL] {cmd}...")
    except Exception as e:
        print(f"Error writing to log: {e}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)

if __name__ == "__main__":
    main()
