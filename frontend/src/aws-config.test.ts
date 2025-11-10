import { describe, it, expect, beforeEach } from 'vitest'
import { cfg } from './aws-config'

describe('AWS Configuration', () => {
  beforeEach(() => {
    // Mock environment variables
    import.meta.env.VITE_REGION = 'us-west-1'
    import.meta.env.VITE_USER_POOL_ID = 'test-pool-id'
    import.meta.env.VITE_USER_POOL_CLIENT_ID = 'test-client-id'
    import.meta.env.VITE_IDENTITY_POOL_ID = 'test-identity-pool'
    import.meta.env.VITE_AVATARS_BUCKET = 'test-avatars-bucket'
    import.meta.env.VITE_API_BASE = 'https://api.test.com'
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

  it('configuration values are strings', () => {
    expect(typeof cfg.region).toBe('string')
    expect(typeof cfg.userPoolId).toBe('string')
    expect(typeof cfg.userPoolClientId).toBe('string')
    expect(typeof cfg.identityPoolId).toBe('string')
    expect(typeof cfg.avatarsBucket).toBe('string')
    expect(typeof cfg.apiBase).toBe('string')
  })
})
