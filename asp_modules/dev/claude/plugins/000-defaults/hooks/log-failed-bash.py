#!/usr/bin/env python3
"""
Hook to log failed Bash command executions.
Triggered by PostToolUseFailure - only fires when tool fails.
Logs full request payload and error message to ~/.claude/bash-failures.log
"""
import json
import sys
from datetime import datetime
import os
import re

LOG_FILE = os.path.expanduser("~/.claude/bash-failures.log")

def main():
    try:
        raw_input = sys.stdin.read()
        hook_input = json.loads(raw_input)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    # Only process Bash tool failures
    if hook_input.get("tool_name") != "Bash":
        sys.exit(0)

    # Extract error message (PostToolUseFailure uses "error" field)
    error_message = hook_input.get("error", "")

    # Parse exit code from error string (format: "Exit code N\n...")
    exit_code = None
    if error_message:
        match = re.match(r"Exit code (\d+)", error_message)
        if match:
            exit_code = int(match.group(1))

    tool_input = hook_input.get("tool_input", {})
    timestamp = datetime.now().isoformat()

    log_entry = {
        "timestamp": timestamp,
        "exit_code": exit_code,
        "command": tool_input.get("command"),
        "description": tool_input.get("description"),
        "error_message": error_message,
        "is_interrupt": hook_input.get("is_interrupt", False),
        "session_id": hook_input.get("session_id"),
        "cwd": hook_input.get("cwd"),
        "tool_use_id": hook_input.get("tool_use_id"),
    }

    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(log_entry, indent=2) + "\n---\n")
        cmd = tool_input.get("command", "N/A")[:40]
        print(f"[LOGGED FAILURE] exit={exit_code} cmd={cmd}...")
    except Exception as e:
        print(f"Error writing to log: {e}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)

if __name__ == "__main__":
    main()
