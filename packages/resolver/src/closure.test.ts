/**
 * Tests for closure module.
 *
 * WHY: The dependency closure is critical for correct space loading.
 * These tests verify:
 * - Correct DFS postorder traversal
 * - Cycle detection
 * - Diamond dependency handling
 * - Helper function correctness
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import type { SpaceKey, SpaceManifest } from '@agent-spaces/core'
import { CyclicDependencyError, MissingDependencyError } from '@agent-spaces/core'
import {
  type ClosureResult,
  type ResolvedSpace,
  computeClosure,
  getDependents,
  getSpace,
  getSpacesInOrder,
  isRoot,
} from './closure.js'
import * as manifestModule from './manifest.js'
import * as selectorModule from './selector.js'

describe('closure helper functions', () => {
  // Create a sample closure for testing helpers
  const createSampleClosure = (): ClosureResult => {
    const spaceA: ResolvedSpace = {
      key: 'space-a@abc123' as SpaceKey,
      id: 'space-a' as any,
      commit: 'abc123abc123abc123abc123abc123abc123abc1' as any,
      path: 'spaces/space-a',
      manifest: { schema: 1, id: 'space-a' as any, version: '1.0.0' },
      resolvedFrom: {
        commit: 'abc123abc123abc123abc123abc123abc123abc1' as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      },
      deps: [],
    }

    const spaceB: ResolvedSpace = {
      key: 'space-b@def456' as SpaceKey,
      id: 'space-b' as any,
      commit: 'def456def456def456def456def456def456def4' as any,
      path: 'spaces/space-b',
      manifest: { schema: 1, id: 'space-b' as any, version: '1.0.0' },
      resolvedFrom: {
        commit: 'def456def456def456def456def456def456def4' as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      },
      deps: ['space-a@abc123' as SpaceKey],
    }

    const spaceC: ResolvedSpace = {
      key: 'space-c@789abc' as SpaceKey,
      id: 'space-c' as any,
      commit: '789abc789abc789abc789abc789abc789abc789a' as any,
      path: 'spaces/space-c',
      manifest: { schema: 1, id: 'space-c' as any, version: '1.0.0' },
      resolvedFrom: {
        commit: '789abc789abc789abc789abc789abc789abc789a' as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      },
      deps: ['space-a@abc123' as SpaceKey, 'space-b@def456' as SpaceKey],
    }

    return {
      spaces: new Map([
        [spaceA.key, spaceA],
        [spaceB.key, spaceB],
        [spaceC.key, spaceC],
      ]),
      loadOrder: [
        'space-a@abc123' as SpaceKey,
        'space-b@def456' as SpaceKey,
        'space-c@789abc' as SpaceKey,
      ],
      roots: ['space-c@789abc' as SpaceKey],
    }
  }

  describe('getSpace', () => {
    it('should return space by key', () => {
      const closure = createSampleClosure()
      const space = getSpace(closure, 'space-a@abc123' as SpaceKey)
      expect(space).toBeDefined()
      expect(String(space?.id)).toBe('space-a')
    })

    it('should return undefined for missing key', () => {
      const closure = createSampleClosure()
      const space = getSpace(closure, 'nonexistent@000000' as SpaceKey)
      expect(space).toBeUndefined()
    })
  })

  describe('getSpacesInOrder', () => {
    it('should return spaces in load order', () => {
      const closure = createSampleClosure()
      const spaces = getSpacesInOrder(closure)
      expect(spaces).toHaveLength(3)
      expect(String(spaces[0]?.id)).toBe('space-a')
      expect(String(spaces[1]?.id)).toBe('space-b')
      expect(String(spaces[2]?.id)).toBe('space-c')
    })

    it('should filter out missing spaces', () => {
      const closure = createSampleClosure()
      // Add a missing key to loadOrder
      closure.loadOrder.push('missing@000000' as SpaceKey)
      const spaces = getSpacesInOrder(closure)
      expect(spaces).toHaveLength(3) // Still 3, missing is filtered
    })
  })

  describe('isRoot', () => {
    it('should return true for root space', () => {
      const closure = createSampleClosure()
      expect(isRoot(closure, 'space-c@789abc' as SpaceKey)).toBe(true)
    })

    it('should return false for non-root space', () => {
      const closure = createSampleClosure()
      expect(isRoot(closure, 'space-a@abc123' as SpaceKey)).toBe(false)
      expect(isRoot(closure, 'space-b@def456' as SpaceKey)).toBe(false)
    })
  })

  describe('getDependents', () => {
    it('should return spaces that depend on given space', () => {
      const closure = createSampleClosure()
      const dependents = getDependents(closure, 'space-a@abc123' as SpaceKey)
      expect(dependents).toHaveLength(2)
      expect(dependents).toContain('space-b@def456')
      expect(dependents).toContain('space-c@789abc')
    })

    it('should return empty array for space with no dependents', () => {
      const closure = createSampleClosure()
      const dependents = getDependents(closure, 'space-c@789abc' as SpaceKey)
      expect(dependents).toHaveLength(0)
    })
  })
})

describe('computeClosure', () => {
  // Mock functions
  let resolverSelectorSpy: ReturnType<typeof spyOn>
  let readManifestSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    // Setup mocks before each test
    resolverSelectorSpy = spyOn(selectorModule, 'resolveSelector')
    readManifestSpy = spyOn(manifestModule, 'readSpaceManifest')
  })

  afterEach(() => {
    // Clear mocks after each test
    mock.restore()
  })

  it('should compute closure for single space with no dependencies', async () => {
    const commit = 'abc123abc123abc123abc123abc123abc123abc1'
    const manifest: SpaceManifest = {
      schema: 1,
      id: 'my-space' as any,
      version: '1.0.0',
    }

    resolverSelectorSpy.mockResolvedValue({
      commit: commit as any,
      selector: { kind: 'dist-tag', tag: 'stable' },
    })

    readManifestSpy.mockResolvedValue(manifest)

    const result = await computeClosure(['space:my-space@stable' as any], { cwd: '/tmp' })

    expect(result.loadOrder).toHaveLength(1)
    expect(result.roots).toHaveLength(1)
    expect(result.spaces.size).toBe(1)

    const space = result.spaces.get(result.loadOrder[0]!)
    expect(String(space?.id)).toBe('my-space')
    expect(space?.deps).toHaveLength(0)
  })

  it('should compute closure with transitive dependencies in DFS postorder', async () => {
    // A depends on B, B depends on C
    // Load order should be: C, B, A

    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'
    const commitB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2'
    const commitC = 'ccccccccccccccccccccccccccccccccccccccc3'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-b@stable' as any] },
    }

    const manifestB: SpaceManifest = {
      schema: 1,
      id: 'space-b' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-c@stable' as any] },
    }

    const manifestC: SpaceManifest = {
      schema: 1,
      id: 'space-c' as any,
      version: '1.0.0',
    }

    resolverSelectorSpy.mockImplementation(async (id: string) => {
      const commits: Record<string, string> = {
        'space-a': commitA,
        'space-b': commitB,
        'space-c': commitC,
      }
      return {
        commit: commits[id] as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      }
    })

    readManifestSpy.mockImplementation(async (id: string) => {
      const manifests: Record<string, SpaceManifest> = {
        'space-a': manifestA,
        'space-b': manifestB,
        'space-c': manifestC,
      }
      return manifests[id]!
    })

    const result = await computeClosure(['space:space-a@stable' as any], { cwd: '/tmp' })

    expect(result.loadOrder).toHaveLength(3)
    expect(result.spaces.size).toBe(3)

    // Verify DFS postorder: C comes before B, B comes before A
    const ids = result.loadOrder.map((key) => String(result.spaces.get(key)?.id))
    expect(ids).toEqual(['space-c', 'space-b', 'space-a'])
  })

  it('should handle diamond dependencies correctly', async () => {
    // A and B both depend on C (diamond)
    // Root: [A, B]
    // Load order should be: C, A, B (or C, B, A based on root order)

    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'
    const commitB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2'
    const commitC = 'ccccccccccccccccccccccccccccccccccccccc3'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-c@stable' as any] },
    }

    const manifestB: SpaceManifest = {
      schema: 1,
      id: 'space-b' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-c@stable' as any] },
    }

    const manifestC: SpaceManifest = {
      schema: 1,
      id: 'space-c' as any,
      version: '1.0.0',
    }

    resolverSelectorSpy.mockImplementation(async (id: string) => {
      const commits: Record<string, string> = {
        'space-a': commitA,
        'space-b': commitB,
        'space-c': commitC,
      }
      return {
        commit: commits[id] as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      }
    })

    readManifestSpy.mockImplementation(async (id: string) => {
      const manifests: Record<string, SpaceManifest> = {
        'space-a': manifestA,
        'space-b': manifestB,
        'space-c': manifestC,
      }
      return manifests[id]!
    })

    const result = await computeClosure(
      ['space:space-a@stable' as any, 'space:space-b@stable' as any],
      { cwd: '/tmp' }
    )

    // C should appear only once in load order
    expect(result.loadOrder).toHaveLength(3)
    expect(result.spaces.size).toBe(3)

    // C should be first (dependency of both A and B)
    const ids = result.loadOrder.map((key) => String(result.spaces.get(key)?.id))
    expect(ids[0]).toBe('space-c')

    // Both A and B should be roots
    expect(result.roots).toHaveLength(2)
  })

  it('should detect simple cycles (A -> B -> A)', async () => {
    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'
    const commitB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-b@stable' as any] },
    }

    const manifestB: SpaceManifest = {
      schema: 1,
      id: 'space-b' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-a@stable' as any] },
    }

    resolverSelectorSpy.mockImplementation(async (id: string) => {
      const commits: Record<string, string> = {
        'space-a': commitA,
        'space-b': commitB,
      }
      return {
        commit: commits[id] as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      }
    })

    readManifestSpy.mockImplementation(async (id: string) => {
      const manifests: Record<string, SpaceManifest> = {
        'space-a': manifestA,
        'space-b': manifestB,
      }
      return manifests[id]!
    })

    await expect(computeClosure(['space:space-a@stable' as any], { cwd: '/tmp' })).rejects.toThrow(
      CyclicDependencyError
    )
  })

  it('should detect self-referential cycles (A -> A)', async () => {
    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-a@stable' as any] },
    }

    resolverSelectorSpy.mockResolvedValue({
      commit: commitA as any,
      selector: { kind: 'dist-tag', tag: 'stable' },
    })

    readManifestSpy.mockResolvedValue(manifestA)

    await expect(computeClosure(['space:space-a@stable' as any], { cwd: '/tmp' })).rejects.toThrow(
      CyclicDependencyError
    )
  })

  it('should detect longer cycles (A -> B -> C -> A)', async () => {
    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'
    const commitB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2'
    const commitC = 'ccccccccccccccccccccccccccccccccccccccc3'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-b@stable' as any] },
    }

    const manifestB: SpaceManifest = {
      schema: 1,
      id: 'space-b' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-c@stable' as any] },
    }

    const manifestC: SpaceManifest = {
      schema: 1,
      id: 'space-c' as any,
      version: '1.0.0',
      deps: { spaces: ['space:space-a@stable' as any] },
    }

    resolverSelectorSpy.mockImplementation(async (id: string) => {
      const commits: Record<string, string> = {
        'space-a': commitA,
        'space-b': commitB,
        'space-c': commitC,
      }
      return {
        commit: commits[id] as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      }
    })

    readManifestSpy.mockImplementation(async (id: string) => {
      const manifests: Record<string, SpaceManifest> = {
        'space-a': manifestA,
        'space-b': manifestB,
        'space-c': manifestC,
      }
      return manifests[id]!
    })

    await expect(computeClosure(['space:space-a@stable' as any], { cwd: '/tmp' })).rejects.toThrow(
      CyclicDependencyError
    )
  })

  it('should throw MissingDependencyError for missing dependency', async () => {
    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
      deps: { spaces: ['space:missing-space@stable' as any] },
    }

    resolverSelectorSpy.mockImplementation(async (id: string) => {
      if (id === 'missing-space') {
        throw new Error('Space not found')
      }
      return {
        commit: commitA as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      }
    })

    readManifestSpy.mockResolvedValue(manifestA)

    await expect(computeClosure(['space:space-a@stable' as any], { cwd: '/tmp' })).rejects.toThrow(
      MissingDependencyError
    )
  })

  it('should use pinned spaces when provided', async () => {
    const pinnedCommit = 'abcdef1111111111111111111111111111111111'
    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
    }

    // Resolve should not be called when pinned
    resolverSelectorSpy.mockRejectedValue(new Error('Should not be called'))

    readManifestSpy.mockResolvedValue(manifestA)

    const result = await computeClosure(['space:space-a@stable' as any], {
      cwd: '/tmp',
      pinnedSpaces: new Map([['space-a' as any, pinnedCommit as any]]),
    })

    expect(result.loadOrder).toHaveLength(1)
    const space = result.spaces.get(result.loadOrder[0]!)
    expect(String(space?.commit)).toBe(pinnedCommit)
  })

  it('should handle multiple roots in declared order', async () => {
    const commitA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'
    const commitB = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2'

    const manifestA: SpaceManifest = {
      schema: 1,
      id: 'space-a' as any,
      version: '1.0.0',
    }

    const manifestB: SpaceManifest = {
      schema: 1,
      id: 'space-b' as any,
      version: '1.0.0',
    }

    resolverSelectorSpy.mockImplementation(async (id: string) => {
      const commits: Record<string, string> = {
        'space-a': commitA,
        'space-b': commitB,
      }
      return {
        commit: commits[id] as any,
        selector: { kind: 'dist-tag', tag: 'stable' },
      }
    })

    readManifestSpy.mockImplementation(async (id: string) => {
      const manifests: Record<string, SpaceManifest> = {
        'space-a': manifestA,
        'space-b': manifestB,
      }
      return manifests[id]!
    })

    const result = await computeClosure(
      ['space:space-a@stable' as any, 'space:space-b@stable' as any],
      { cwd: '/tmp' }
    )

    expect(result.loadOrder).toHaveLength(2)
    expect(result.roots).toHaveLength(2)

    // Roots should be in declared order
    const ids = result.loadOrder.map((key) => String(result.spaces.get(key)?.id))
    expect(ids).toEqual(['space-a', 'space-b'])
  })
})
