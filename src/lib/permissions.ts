import { APP_SCOPES, type AppKey } from '@/types/app'

/**
 * Permission mapping from OAuth scopes to OSM permission keys
 * OSM startup data uses different keys than OAuth scopes
 */
const SCOPE_TO_PERMISSION_KEY: Record<string, string> = {
  'section:event:read': 'events',
  'section:member:read': 'member',
  'section:programme:read': 'programme',
  'section:flexirecord:read': 'flexi',
}

/**
 * OSM permission levels
 * 0 = no access, higher values = more access
 */
const MIN_PERMISSION_LEVEL = 1

/**
 * Permissions object from OSM startup data
 */
export interface OsmPermissions {
  badge?: number
  member?: number
  user?: number
  register?: number
  programme?: number
  events?: number
  finance?: number
  flexi?: number
  quartermaster?: number
  [key: string]: number | undefined
}

/**
 * Validate that a user has the required permissions for an app
 * Returns an array of missing permission names, or empty array if all permissions are present
 * 
 * @param app - The app to validate permissions for
 * @param permissions - The permissions object from OSM startup data (globals.roles[].permissions)
 * @returns Array of missing permission names (empty if all permissions are present)
 */
export function validateAppPermissions(app: AppKey, permissions: OsmPermissions | null | undefined): string[] {
  if (!permissions) {
    // No permissions object at all - return all required permissions as missing
    const requiredScopes = APP_SCOPES[app] || []
    return requiredScopes.map(scope => SCOPE_TO_PERMISSION_KEY[scope] || scope)
  }

  const requiredScopes = APP_SCOPES[app] || []
  const missingPermissions: string[] = []

  for (const scope of requiredScopes) {
    const permissionKey = SCOPE_TO_PERMISSION_KEY[scope]
    if (!permissionKey) continue

    const permissionValue = permissions[permissionKey]
    if (permissionValue === undefined || permissionValue < MIN_PERMISSION_LEVEL) {
      missingPermissions.push(permissionKey)
    }
  }

  return missingPermissions
}

/**
 * Check if a user has all required permissions for an app
 * 
 * @param app - The app to check permissions for
 * @param permissions - The permissions object from OSM startup data
 * @returns true if user has all required permissions
 */
export function hasAppPermissions(app: AppKey, permissions: OsmPermissions | null | undefined): boolean {
  return validateAppPermissions(app, permissions).length === 0
}
