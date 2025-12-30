'use client'

import { useState } from 'react'
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SEEESectionConfig() {
  const [sectionId, setSectionId] = useState('43105')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/admin/platform-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seeeSectionId: sectionId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to save configuration' }))
        throw new Error(error.message || 'Failed to save configuration')
      }

      setSaveStatus('success')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          SEEE Section Configuration
        </CardTitle>
        <CardDescription>
          Configure the canonical SEEE section ID used by planning, expedition, and platform-admin apps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seee-section-id">SEEE Section ID</Label>
          <div className="flex gap-2">
            <Input
              id="seee-section-id"
              value={sectionId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSectionId(e.target.value)}
              disabled={!isEditing || isSaving}
              placeholder="43105"
              className="max-w-xs"
            />
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false)
                    setSectionId('43105')
                    setSaveStatus('idle')
                  }}
                  variant="ghost"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {saveStatus === 'success' && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Configuration saved successfully. Changes will take effect on next app mount.
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Note:</strong> This section ID is automatically injected when users access SEEE-specific apps.
          </p>
          <p>
            Multi-section viewer users will still see the section picker and can select any section they have access to.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
