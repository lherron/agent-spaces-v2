/**
 * W202: Agent command namespace detection.
 *
 * WHY: When an agent doc references an unqualified `/command` that is provided
 * by a plugin Space, the agent may fail to resolve the command due to known
 * Claude Code agent namespace discovery issues (GitHub #11328). We recommend
 * using `/space:command` format for reliability.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { LintContext, LintWarning, SpaceLintData } from '../types.js'
import { WARNING_CODES } from '../types.js'

/**
 * Pattern to match unqualified command references in markdown.
 * Matches `/command-name` but not `/plugin:command` or `/plugin-name:command`
 * or URLs like /path/to/something
 */
const UNQUALIFIED_COMMAND_PATTERN = /(?<![:/\w])\/([a-z][a-z0-9-]*)(?![:/\w])/gi

/**
 * Get all command names from a space's commands directory.
 */
async function getCommandNames(pluginPath: string): Promise<string[]> {
  const commandsDir = join(pluginPath, 'commands')

  try {
    const stats = await stat(commandsDir)
    if (!stats.isDirectory()) {
      return []
    }

    const entries = await readdir(commandsDir, { withFileTypes: true })
    const commands: string[] = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        // Remove .md extension to get command name
        commands.push(entry.name.slice(0, -3))
      }
    }

    return commands
  } catch {
    return []
  }
}

/**
 * Get all agent markdown files from a space's agents directory.
 */
async function getAgentFiles(pluginPath: string): Promise<string[]> {
  const agentsDir = join(pluginPath, 'agents')

  try {
    const stats = await stat(agentsDir)
    if (!stats.isDirectory()) {
      return []
    }

    const entries = await readdir(agentsDir, { withFileTypes: true })
    const agentFiles: string[] = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        agentFiles.push(join(agentsDir, entry.name))
      }
    }

    return agentFiles
  } catch {
    return []
  }
}

/**
 * Find unqualified command references in text.
 */
function findUnqualifiedCommands(text: string): string[] {
  const matches = new Set<string>()
  let match: RegExpExecArray | null

  // Reset the regex before using
  UNQUALIFIED_COMMAND_PATTERN.lastIndex = 0

  while ((match = UNQUALIFIED_COMMAND_PATTERN.exec(text)) !== null) {
    const command = match[1]
    if (command !== undefined) {
      matches.add(command)
    }
  }

  return Array.from(matches)
}

/**
 * Get the plugin name for a space (used for namespace recommendation).
 */
function getPluginName(space: SpaceLintData): string {
  return space.manifest.plugin?.name ?? String(space.manifest.id)
}

/**
 * W202: Detect unqualified command references in agent docs.
 */
export async function checkAgentCommandNamespace(context: LintContext): Promise<LintWarning[]> {
  const warnings: LintWarning[] = []

  // Build a map of command name -> list of spaces that define it
  const commandToSpaces = new Map<string, SpaceLintData[]>()

  for (const space of context.spaces) {
    const commands = await getCommandNames(space.pluginPath)

    for (const command of commands) {
      const spaces = commandToSpaces.get(command) ?? []
      spaces.push(space)
      commandToSpaces.set(command, spaces)
    }
  }

  // If no commands defined, nothing to check
  if (commandToSpaces.size === 0) {
    return warnings
  }

  // Scan all agent files in all spaces
  for (const space of context.spaces) {
    const agentFiles = await getAgentFiles(space.pluginPath)

    for (const agentFile of agentFiles) {
      try {
        const content = await readFile(agentFile, 'utf-8')
        const unqualifiedCommands = findUnqualifiedCommands(content)

        for (const command of unqualifiedCommands) {
          const providingSpaces = commandToSpaces.get(command)

          // Only warn if the command is provided by one of the composed spaces
          if (providingSpaces !== undefined && providingSpaces.length > 0) {
            // Build suggestion with qualified names
            const suggestions = providingSpaces
              .map((s) => `/${getPluginName(s)}:${command}`)
              .join(' or ')

            warnings.push({
              code: WARNING_CODES.AGENT_COMMAND_NAMESPACE,
              message:
                `Agent references unqualified command '/${command}' which is provided by a plugin Space. ` +
                `Use fully-qualified form (${suggestions}) for reliable agent command resolution.`,
              severity: 'warning',
              spaceKey: space.key,
              path: agentFile,
              details: {
                command,
                unqualifiedRef: `/${command}`,
                providingSpaces: providingSpaces.map((s) => String(s.manifest.id)),
                suggestedForms: providingSpaces.map((s) => `/${getPluginName(s)}:${command}`),
              },
            })
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return warnings
}
