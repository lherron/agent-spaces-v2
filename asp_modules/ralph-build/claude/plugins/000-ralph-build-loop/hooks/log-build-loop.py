#!/usr/bin/env python3
"""
Hook to log tool use and agent use for ralph-build-loop.
Logs to $PWD/build-loop.log

Handles events:
- pre_tool_use: logs tool invocations before execution
- post_tool_use: logs tool invocations after execution
- subagent_stop: logs subagent completions
- stop: logs LLM turn end
- user_prompt_submit: logs user prompts
- session_start: logs session start
"""
import json
import sys
from datetime import datetime
import os

LOG_FILE = os.path.join(os.getcwd(), "build-loop.log")


def load_hook_input():
    raw_input = sys.stdin.read()
    if raw_input.strip():
        try:
            return json.loads(raw_input)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
            sys.exit(1)

    # Pi hook bridge: use env vars
    return {
        "tool_name": os.environ.get("ASP_TOOL_NAME"),
        "tool_args": json.loads(os.environ.get("ASP_TOOL_ARGS", "{}")),
        "tool_result": json.loads(os.environ.get("ASP_TOOL_RESULT", "{}")),
        "source": "pi",
    }


def main():
    hook_input = load_hook_input()

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Determine event type using hook_event_name
    hook_event = hook_input.get("hook_event_name", "")
    tool_name = hook_input.get("tool_name")

    if hook_event == "PreToolUse":
        tool_input = hook_input.get("tool_input", {})
        log_line = f"[{timestamp}] PRE_TOOL: {tool_name} {json.dumps(tool_input)}\n"
    elif hook_event == "PostToolUse":
        log_line = f"[{timestamp}] POST_TOOL: {json.dumps(hook_input)}\n"
    elif hook_event == "SubagentStop":
        log_line = f"[{timestamp}] AGENT_STOP: {json.dumps(hook_input)}\n"
    elif hook_event == "Stop":
        log_line = f"[{timestamp}] END_TURN: {json.dumps(hook_input)}\n"
    elif hook_event == "UserPromptSubmit":
        prompt = hook_input.get("prompt", "")
        summary = prompt[:100] if prompt else "N/A"
        log_line = f"[{timestamp}] PROMPT: {summary}\n"
    elif hook_event == "SessionStart":
        log_line = f"[{timestamp}] SESSION_START: {json.dumps(hook_input)}\n"
    elif hook_event == "Notification":
        log_line = f"[{timestamp}] NOTIFICATION: {json.dumps(hook_input)}\n"
    else:
        # Unknown event - log raw payload for debugging
        log_line = f"[{timestamp}] UNKNOWN: {json.dumps(hook_input)}\n"

    try:
        with open(LOG_FILE, "a") as f:
            f.write(log_line)
    except Exception as e:
        print(f"Error writing to log: {e}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
