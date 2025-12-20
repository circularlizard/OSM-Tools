'use server'

import { incrementSessionVersion } from './redis'
import { logRedis } from './logger'

/**
 * Initialize server and increment session version
 * This should be called when the server starts to invalidate existing sessions
 */
export async function initServer() {
  try {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.INVALIDATE_SESSIONS_ON_START === 'true') {
      const newVersion = await incrementSessionVersion()
      logRedis({
        event: 'session_version_incremented',
        version: newVersion,
      })
      console.log(`[Init] Session version incremented to ${newVersion}`)
    }
  } catch (error) {
    console.error('Failed to initialize server:', error)
  }
}

export async function initServerOnce(): Promise<void> {
  const key = '__seee_server_initialized__'
  const g = globalThis as unknown as Record<string, unknown>

  if (g[key]) return
  g[key] = true

  if (process.env.NODE_ENV === 'test') return
  await initServer()
}
