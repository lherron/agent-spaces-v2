/**
 * W204: Invalid or missing hooks.json.
 *
 * WHY: When a hooks/ directory exists but hooks.json is missing or invalid,
 * the hooks won't be registered with Claude.
 */

import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { LintContext, LintWarning } from '../types.js'
import { WARNING_CODES } from '../types.js'

/**
 * Check if hooks directory exists.
 */
async function hooksDirectoryExists(pluginPath: string): Promise<boolean> {
  const hooksDir = join(pluginPath, 'hooks')
  try {
    const stats = await stat(hooksDir)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if hooks.json is valid.
 */
async function isHooksConfigValid(pluginPath: string): Promise<{ valid: boolean; error?: string }> {
  const hooksJsonPath = join(pluginPath, 'hooks', 'hooks.json')

  try {
    const content = await readFile(hooksJsonPath, 'utf-8')
    const config = JSON.parse(content)

    // Basic validation
    if (!config || typeof config !== 'object') {
      return { valid: false, error: 'hooks.json is not an object' }
    }

    if (!Array.isArray(config.hooks)) {
      return { valid: false, error: "hooks.json missing 'hooks' array" }
    }

    for (const [i, hook] of config.hooks.entries()) {
      if (!hook.event || typeof hook.event !== 'string') {
        return { valid: false, error: `hooks[${i}] missing 'event' string` }
      }
      if (!hook.script || typeof hook.script !== 'string') {
        return { valid: false, error: `hooks[${i}] missing 'script' string` }
      }
    }

    return { valid: true }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { valid: false, error: 'hooks.json does not exist' }
    }
    return {
      valid: false,
      error: `Failed to parse hooks.json: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * W204: Detect invalid or missing hooks configuration.
 */
export async function checkHooksConfig(context: LintContext): Promise<LintWarning[]> {
  const warnings: LintWarning[] = []

  for (const space of context.spaces) {
    // Only check if hooks directory exists
    if (!(await hooksDirectoryExists(space.pluginPath))) {
      continue
    }

    const result = await isHooksConfigValid(space.pluginPath)
    if (!result.valid) {
      warnings.push({
        code: WARNING_CODES.INVALID_HOOKS_CONFIG,
        message: `hooks/ directory exists but hooks.json is invalid: ${result.error}`,
        severity: 'warning',
        spaceKey: space.key,
        path: join(space.pluginPath, 'hooks', 'hooks.json'),
        details: {
          error: result.error,
        },
      })
    }
  }

  return warnings
}
