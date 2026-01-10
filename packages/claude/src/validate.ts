/**
 * Plugin validation utilities.
 *
 * WHY: Before launching Claude with plugins, we can validate:
 * 1. Plugin directory structure is correct
 * 2. Required files exist (plugin.json)
 * 3. Optional components are valid if present
 *
 * This provides early feedback on configuration issues.
 */

import { constants, access, stat } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Validation result for a single plugin.
 */
export interface PluginValidationResult {
  /** Path to the plugin directory */
  path: string
  /** Whether the plugin is valid */
  valid: boolean
  /** Validation errors (if any) */
  errors: string[]
  /** Validation warnings (non-fatal issues) */
  warnings: string[]
  /** Plugin name from plugin.json (if valid) */
  pluginName?: string | undefined
  /** Plugin version from plugin.json (if present) */
  pluginVersion?: string | undefined
}

/**
 * Plugin.json structure (partial, for validation).
 */
interface PluginJson {
  name?: string
  version?: string
  description?: string
  commands?: string
  agents?: string
  skills?: string
  hooks?: string
}

/**
 * Known component directories in a plugin.
 */
const COMPONENT_DIRS = ['commands', 'agents', 'skills', 'hooks', 'scripts', 'mcp']

/**
 * Validate a single plugin directory.
 *
 * @param pluginDir - Path to the plugin directory
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = await validatePlugin('/path/to/plugin');
 * if (!result.valid) {
 *   console.error('Plugin errors:', result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Plugin warnings:', result.warnings);
 * }
 * ```
 */
export async function validatePlugin(pluginDir: string): Promise<PluginValidationResult> {
  const result: PluginValidationResult = {
    path: pluginDir,
    valid: true,
    errors: [],
    warnings: [],
  }

  // Check if directory exists
  try {
    const stats = await stat(pluginDir)
    if (!stats.isDirectory()) {
      result.valid = false
      result.errors.push(`Not a directory: ${pluginDir}`)
      return result
    }
  } catch (error) {
    result.valid = false
    result.errors.push(`Directory not accessible: ${pluginDir}`)
    return result
  }

  // Check for .claude-plugin/plugin.json (required)
  const pluginJsonPath = join(pluginDir, '.claude-plugin', 'plugin.json')
  let pluginJson: PluginJson | null = null

  try {
    const content = await Bun.file(pluginJsonPath).text()
    pluginJson = JSON.parse(content) as PluginJson
  } catch (error) {
    result.valid = false
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      result.errors.push('Missing required .claude-plugin/plugin.json file')
    } else if (error instanceof SyntaxError) {
      result.errors.push(`Invalid JSON in .claude-plugin/plugin.json: ${error.message}`)
    } else {
      result.errors.push(
        `Cannot read .claude-plugin/plugin.json: ${error instanceof Error ? error.message : String(error)}`
      )
    }
    return result
  }

  // Validate plugin.json structure
  if (!pluginJson.name) {
    result.valid = false
    result.errors.push("plugin.json missing required 'name' field")
  } else if (typeof pluginJson.name !== 'string') {
    result.valid = false
    result.errors.push("plugin.json 'name' must be a string")
  } else {
    result.pluginName = pluginJson.name

    // Validate name format (kebab-case)
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(pluginJson.name)) {
      result.warnings.push(`Plugin name '${pluginJson.name}' should be kebab-case`)
    }
  }

  if (pluginJson.version) {
    if (typeof pluginJson.version !== 'string') {
      result.warnings.push("plugin.json 'version' should be a string")
    } else {
      result.pluginVersion = pluginJson.version

      // Validate semver format
      if (!/^\d+\.\d+\.\d+/.test(pluginJson.version)) {
        result.warnings.push(`Plugin version '${pluginJson.version}' should be semver format`)
      }
    }
  }

  // Validate component directories if specified in plugin.json
  const componentPaths: { key: keyof PluginJson; value: string }[] = [
    { key: 'commands', value: pluginJson.commands || '' },
    { key: 'agents', value: pluginJson.agents || '' },
    { key: 'skills', value: pluginJson.skills || '' },
    { key: 'hooks', value: pluginJson.hooks || '' },
  ]

  for (const { key, value } of componentPaths) {
    if (value) {
      // Path should be relative and start with ./
      if (!value.startsWith('./')) {
        result.warnings.push(`plugin.json '${key}' path '${value}' should start with './'`)
      }

      // Check if path exists
      const componentPath = join(pluginDir, value.replace(/^\.\//, ''))
      try {
        await access(componentPath, constants.R_OK)
      } catch {
        result.warnings.push(`plugin.json '${key}' path '${value}' does not exist`)
      }
    }
  }

  // Check for hooks/hooks.json if hooks directory exists
  const hooksDir = join(pluginDir, 'hooks')
  try {
    const hooksStats = await stat(hooksDir)
    if (hooksStats.isDirectory()) {
      const hooksJsonPath = join(hooksDir, 'hooks.json')
      try {
        await access(hooksJsonPath, constants.R_OK)

        // Validate hooks.json content
        const hooksContent = await Bun.file(hooksJsonPath).text()
        const hooksJson = JSON.parse(hooksContent)

        // Check for ${CLAUDE_PLUGIN_ROOT} in hook paths
        await validateHooksJson(pluginDir, hooksJson, result)
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          result.warnings.push('hooks/ directory exists but hooks/hooks.json is missing')
        } else if (error instanceof SyntaxError) {
          result.errors.push(`Invalid JSON in hooks/hooks.json: ${error.message}`)
          result.valid = false
        }
      }
    }
  } catch {
    // hooks directory doesn't exist, which is fine
  }

  return result
}

/**
 * Validate hooks.json content.
 */
async function validateHooksJson(
  pluginDir: string,
  hooksJson: unknown,
  result: PluginValidationResult
): Promise<void> {
  if (!hooksJson || typeof hooksJson !== 'object' || Array.isArray(hooksJson)) {
    result.errors.push('hooks/hooks.json must be an object')
    result.valid = false
    return
  }

  const hooks = hooksJson as Record<string, unknown>

  for (const [hookName, hookConfig] of Object.entries(hooks)) {
    if (!hookConfig || typeof hookConfig !== 'object' || Array.isArray(hookConfig)) {
      result.warnings.push(`Hook '${hookName}' configuration should be an object`)
      continue
    }

    const config = hookConfig as Record<string, unknown>

    // Check command path uses ${CLAUDE_PLUGIN_ROOT}
    const configCommand = config['command']
    if (typeof configCommand === 'string') {
      if (configCommand.includes('/') && !configCommand.startsWith('${CLAUDE_PLUGIN_ROOT}')) {
        result.warnings.push(
          `Hook '${hookName}' command path should use \${CLAUDE_PLUGIN_ROOT}: ${configCommand}`
        )
      }
    }

    // Check hooks array
    const configHooks = config['hooks']
    if (Array.isArray(configHooks)) {
      for (const hookDef of configHooks) {
        if (hookDef && typeof hookDef === 'object') {
          const def = hookDef as Record<string, unknown>
          const defCommand = def['command']
          if (typeof defCommand === 'string') {
            if (defCommand.includes('/') && !defCommand.startsWith('${CLAUDE_PLUGIN_ROOT}')) {
              result.warnings.push(
                `Hook '${hookName}' command path should use \${CLAUDE_PLUGIN_ROOT}: ${defCommand}`
              )
            }
          }
        }
      }
    }
  }
}

/**
 * Validate multiple plugin directories.
 *
 * @param pluginDirs - Array of plugin directory paths
 * @returns Array of validation results
 */
export async function validatePlugins(pluginDirs: string[]): Promise<PluginValidationResult[]> {
  return Promise.all(pluginDirs.map(validatePlugin))
}

/**
 * Check for plugin name collisions across multiple plugins.
 *
 * @param results - Validation results from validatePlugins
 * @returns Array of collision warnings
 */
export function checkPluginNameCollisions(results: PluginValidationResult[]): string[] {
  const warnings: string[] = []
  const nameToPath = new Map<string, string[]>()

  for (const result of results) {
    if (result.pluginName) {
      const paths = nameToPath.get(result.pluginName) || []
      paths.push(result.path)
      nameToPath.set(result.pluginName, paths)
    }
  }

  for (const [name, paths] of nameToPath) {
    if (paths.length > 1) {
      warnings.push(
        `Plugin name collision: '${name}' is used by multiple plugins:\n  ${paths.join('\n  ')}`
      )
    }
  }

  return warnings
}

/**
 * Validate plugins and check for collisions.
 *
 * @param pluginDirs - Array of plugin directory paths
 * @returns Combined validation result
 */
export async function validatePluginsWithCollisionCheck(pluginDirs: string[]): Promise<{
  results: PluginValidationResult[]
  collisions: string[]
  allValid: boolean
}> {
  const results = await validatePlugins(pluginDirs)
  const collisions = checkPluginNameCollisions(results)
  const allValid = results.every((r) => r.valid)

  return { results, collisions, allValid }
}
