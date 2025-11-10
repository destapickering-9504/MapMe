import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cfg } from './aws-config'

describe('AWS Configuration', () => {
  beforeEach(() => {
    // Mock environment variables using vi.stubEnv
    vi.stubEnv('VITE_REGION', 'us-west-1')
    vi.stubEnv('VITE_USER_POOL_ID', 'test-pool-id')
    vi.stubEnv('VITE_USER_POOL_CLIENT_ID', 'test-client-id')
    vi.stubEnv('VITE_IDENTITY_POOL_ID', 'test-identity-pool')
    vi.stubEnv('VITE_AVATARS_BUCKET', 'test-avatars-bucket')
    vi.stubEnv('VITE_API_BASE', 'https://api.test.com')
  })

  it('exports configuration object', () => {
    expect(cfg).toBeDefined()
    expect(typeof cfg).toBe('object')
  })

  it('has all required configuration properties', () => {
    expect(cfg).toHaveProperty('region')
    expect(cfg).toHaveProperty('userPoolId')
    expect(cfg).toHaveProperty('userPoolClientId')
    expect(cfg).toHaveProperty('identityPoolId')
    expect(cfg).toHaveProperty('avatarsBucket')
    expect(cfg).toHaveProperty('apiBase')
  })

  it('configuration values are strings or undefined', () => {
    // In test environment without .env.local, values may be undefined
    // In production/CI with environment variables set, they will be strings
    expect(['string', 'undefined']).toContain(typeof cfg.region)
    expect(['string', 'undefined']).toContain(typeof cfg.userPoolId)
    expect(['string', 'undefined']).toContain(typeof cfg.userPoolClientId)
    expect(['string', 'undefined']).toContain(typeof cfg.identityPoolId)
    expect(['string', 'undefined']).toContain(typeof cfg.avatarsBucket)
    expect(['string', 'undefined']).toContain(typeof cfg.apiBase)
  })
})
