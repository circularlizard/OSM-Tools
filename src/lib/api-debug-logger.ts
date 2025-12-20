/**
 * API Debug Logger
 * 
 * Logs all API requests and responses to a file when enabled.
 * Enable by setting DEBUG_API_LOGGING=true in your environment.
 * 
 * Logs are written to: logs/api-debug.log
 */

import fs from 'fs'
import path from 'path'

const DEBUG_API_LOGGING = process.env.DEBUG_API_LOGGING === 'true'
const LOG_FILE = path.join(process.cwd(), 'logs', 'api-debug.log')

interface ApiLogEntry {
  timestamp: string
  type: 'request' | 'response' | 'error'
  method: string
  path: string
  params?: Record<string, string>
  status?: number
  duration?: number
  cached?: boolean
  responseShape?: string
  responseKeys?: string[]
  responsePreview?: unknown
  error?: string
}

function ensureLogDirectory(): void {
  const logDir = path.dirname(LOG_FILE)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

function getResponseShape(data: unknown): string {
  if (data === null) return 'null'
  if (data === undefined) return 'undefined'
  if (Array.isArray(data)) return `array[${data.length}]`
  if (typeof data === 'object') return 'object'
  return typeof data
}

function getResponseKeys(data: unknown): string[] {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return Object.keys(data as Record<string, unknown>)
  }
  return []
}

function getResponsePreview(data: unknown, maxDepth = 2): unknown {
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data
  
  if (Array.isArray(data)) {
    if (data.length === 0) return []
    // Show first item structure only
    return [`[0]: ${JSON.stringify(getResponsePreview(data[0], maxDepth - 1)).slice(0, 200)}...`, `... (${data.length} items)`]
  }
  
  if (maxDepth <= 0) return '{...}'
  
  const obj = data as Record<string, unknown>
  const preview: Record<string, unknown> = {}
  for (const key of Object.keys(obj).slice(0, 10)) {
    const value = obj[key]
    if (Array.isArray(value)) {
      preview[key] = `array[${value.length}]`
    } else if (value && typeof value === 'object') {
      preview[key] = getResponsePreview(value, maxDepth - 1)
    } else {
      preview[key] = value
    }
  }
  if (Object.keys(obj).length > 10) {
    preview['...'] = `(${Object.keys(obj).length - 10} more keys)`
  }
  return preview
}

function writeLog(entry: ApiLogEntry): void {
  if (!DEBUG_API_LOGGING) return
  
  try {
    ensureLogDirectory()
    const line = JSON.stringify(entry, null, 2) + '\n---\n'
    fs.appendFileSync(LOG_FILE, line)
  } catch (err) {
    console.error('[API Debug Logger] Failed to write log:', err)
  }
}

export function logApiRequest(
  method: string,
  path: string,
  params?: Record<string, string>
): void {
  writeLog({
    timestamp: new Date().toISOString(),
    type: 'request',
    method,
    path,
    params,
  })
}

export function logApiResponse(
  method: string,
  path: string,
  status: number,
  duration: number,
  cached: boolean,
  responseData: unknown
): void {
  writeLog({
    timestamp: new Date().toISOString(),
    type: 'response',
    method,
    path,
    status,
    duration,
    cached,
    responseShape: getResponseShape(responseData),
    responseKeys: getResponseKeys(responseData),
    responsePreview: getResponsePreview(responseData),
  })
}

export function logApiError(
  method: string,
  path: string,
  error: string
): void {
  writeLog({
    timestamp: new Date().toISOString(),
    type: 'error',
    method,
    path,
    error,
  })
}

export function isDebugLoggingEnabled(): boolean {
  return DEBUG_API_LOGGING
}

export function clearDebugLog(): void {
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE)
  }
}
