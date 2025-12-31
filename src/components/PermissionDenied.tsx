'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX } from 'lucide-react'
import { APP_LABELS, type AppKey } from '@/types/app'

interface PermissionDeniedProps {
  app: AppKey
  missingPermissions: string[]
}

/**
 * Permission Denied Screen (REQ-AUTH-16)
 * 
 * Displayed when a user attempts to access an app but lacks the required
 * OSM permissions. Provides a clear message and logout button.
 */
export default function PermissionDenied({ app, missingPermissions }: PermissionDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 text-destructive">
            <ShieldX className="h-12 w-12" />
          </div>
          <CardTitle className="text-xl">Permission Required</CardTitle>
          <CardDescription>
            You do not have the required OSM permissions to use {APP_LABELS[app]}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">The following permissions are missing or insufficient:</p>
            <ul className="list-disc list-inside space-y-1">
              {missingPermissions.map((perm) => (
                <li key={perm} className="capitalize">{perm}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Please contact your OSM administrator to request access, or choose a different application.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full"
            >
              Sign out and choose another app
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
