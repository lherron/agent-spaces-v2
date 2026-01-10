/**
 * Tests for link-components module.
 *
 * WHY: Component linking is how space content becomes plugin content.
 * These tests verify the component list and directory detection.
 */

import { describe, expect, it } from 'bun:test'
import { COMPONENT_DIRS } from './link-components.js'

describe('COMPONENT_DIRS', () => {
  it('should include all expected directories', () => {
    expect(COMPONENT_DIRS).toContain('commands')
    expect(COMPONENT_DIRS).toContain('skills')
    expect(COMPONENT_DIRS).toContain('agents')
    expect(COMPONENT_DIRS).toContain('hooks')
    expect(COMPONENT_DIRS).toContain('scripts')
    expect(COMPONENT_DIRS).toContain('mcp')
  })

  it('should have 6 component types', () => {
    expect(COMPONENT_DIRS.length).toBe(6)
  })
})
