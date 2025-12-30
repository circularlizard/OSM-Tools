'use client'

import { useState } from 'react'
import { Code2, Zap, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function DeveloperTools() {
  const [isOpen, setIsOpen] = useState(false)
  const [mswEnabled, setMswEnabled] = useState(
    typeof window !== 'undefined' && localStorage.getItem('msw-enabled') === 'true'
  )

  const handleMSWToggle = (enabled: boolean) => {
    setMswEnabled(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('msw-enabled', String(enabled))
      // Reload to apply MSW changes
      window.location.reload()
    }
  }

  return (
    <Card>
      <CardHeader>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              <CardTitle>Developer Tools</CardTitle>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CardDescription className="mt-2">
            Advanced debugging and testing utilities for platform development.
          </CardDescription>
        </Collapsible>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* MSW Toggle */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="msw-toggle" className="font-semibold">
                    Mock Service Worker (MSW)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Intercept API requests and return mock data. Requires page reload.
                </p>
              </div>
              <Switch
                id="msw-toggle"
                checked={mswEnabled}
                onCheckedChange={handleMSWToggle}
              />
            </div>

            {/* Rate Limit Simulator */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <Label className="font-semibold">Rate Limit Simulator</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Simulate rate limit scenarios to test safety layer behavior.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Trigger 429 Response
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Exhaust Quota
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Simulate Hard Lock
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Coming soon: Interactive rate limit testing
              </p>
            </div>

            {/* Proxy Inspector */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <Label className="font-semibold">Proxy Inspector</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                View recent proxy requests, cache hits/misses, and rate limit headers.
              </p>
              <a href="/dashboard/debug/queue">
                <Button variant="outline" size="sm">
                  View Queue Status
                </Button>
              </a>
              <p className="text-xs text-muted-foreground italic">
                Full proxy inspector coming in future release
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
