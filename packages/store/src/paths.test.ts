/**
 * Tests for paths module.
 *
 * WHY: Path management is foundational for storage operations.
 * These tests verify path building and resolution.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Sha256Integrity } from '@agent-spaces/core'
import {
  PathResolver,
  getAspHome,
  getCachePath,
  getPluginCachePath,
  getRepoPath,
  getSnapshotPath,
  getStorePath,
  getTempPath,
} from './paths.js'

describe('getAspHome', () => {
  const originalEnv = process.env.ASP_HOME

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ASP_HOME = originalEnv
    } else {
      process.env.ASP_HOME = undefined
    }
  })

  it('should return default when ASP_HOME not set', () => {
    process.env.ASP_HOME = undefined
    expect(getAspHome()).toBe(join(homedir(), '.asp'))
  })

  it('should return env var when ASP_HOME is set', () => {
    process.env.ASP_HOME = '/custom/path'
    expect(getAspHome()).toBe('/custom/path')
  })
})

describe('path functions', () => {
  const originalEnv = process.env.ASP_HOME

  beforeEach(() => {
    process.env.ASP_HOME = '/test/asp'
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ASP_HOME = originalEnv
    } else {
      process.env.ASP_HOME = undefined
    }
  })

  it('should build repo path', () => {
    expect(getRepoPath()).toBe('/test/asp/repo')
  })

  it('should build store path', () => {
    expect(getStorePath()).toBe('/test/asp/store')
  })

  it('should build cache path', () => {
    expect(getCachePath()).toBe('/test/asp/cache')
  })

  it('should build temp path', () => {
    expect(getTempPath()).toBe('/test/asp/tmp')
  })

  it('should build snapshot path', () => {
    const integrity = 'sha256:abc123' as Sha256Integrity
    expect(getSnapshotPath(integrity)).toBe('/test/asp/store/abc123')
  })

  it('should build plugin cache path', () => {
    expect(getPluginCachePath('cache-key-123')).toBe('/test/asp/cache/cache-key-123')
  })
})

describe('PathResolver', () => {
  it('should use custom aspHome', () => {
    const resolver = new PathResolver({ aspHome: '/custom/home' })
    expect(resolver.aspHome).toBe('/custom/home')
    expect(resolver.repo).toBe('/custom/home/repo')
    expect(resolver.store).toBe('/custom/home/store')
    expect(resolver.cache).toBe('/custom/home/cache')
    expect(resolver.temp).toBe('/custom/home/tmp')
  })

  it('should build snapshot path', () => {
    const resolver = new PathResolver({ aspHome: '/custom/home' })
    const integrity = 'sha256:def456' as Sha256Integrity
    expect(resolver.snapshot(integrity)).toBe('/custom/home/store/def456')
  })

  it('should build plugin cache path', () => {
    const resolver = new PathResolver({ aspHome: '/custom/home' })
    expect(resolver.pluginCache('my-cache')).toBe('/custom/home/cache/my-cache')
  })

  it('should build space source path', () => {
    const resolver = new PathResolver({ aspHome: '/custom/home' })
    expect(resolver.spaceSource('my-space')).toBe('/custom/home/repo/spaces/my-space')
  })
})
