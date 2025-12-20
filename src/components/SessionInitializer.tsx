'use server'

import { initServerOnce } from '@/lib/init-server'

/**
 * Server component that initializes session management
 * This runs on the server side when the app starts
 */
export async function SessionInitializer() {
  // Initialize server and increment session version if needed
  if (process.env.NODE_ENV === 'production' || process.env.INVALIDATE_SESSIONS_ON_START === 'true') {
    await initServerOnce()
  }
  
  // This is a server component that doesn't render anything
  return null
}
