"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [roleFinalized, setRoleFinalized] = useState(false);

  // After OAuth callback, finalize the role selection
  useEffect(() => {
    const finalizeRole = async () => {
      if (status === 'authenticated' && !roleFinalized) {
        // Check URL params first (from OAuth callback)
        const roleFromUrl = searchParams?.get('roleSelection');
        // Then check localStorage (fallback)
        const roleFromStorage = localStorage.getItem('oauth-role-selection');
        const role = roleFromUrl || roleFromStorage || 'standard';

        // If session doesn't have role yet, or role doesn't match
        if (role && (!session?.roleSelection || session.roleSelection !== role)) {
          console.log('[Dashboard] Finalizing role:', role);
          
          // Update session with role - this triggers JWT callback with trigger='update'
          await update({ roleSelection: role });
          
          // Clean up
          localStorage.removeItem('oauth-role-selection');
          if (roleFromUrl) {
            // Remove role from URL
            router.replace('/dashboard');
          }
        }
        
        setRoleFinalized(true);
      }
    };

    finalizeRole();
  }, [status, session, roleFinalized, searchParams, router, update]);
  const useMSW = process.env.NEXT_PUBLIC_USE_MSW === 'true';

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please sign in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SEEE Expedition Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Session Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground">User ID:</span>
                  <span>{(session.user as any)?.id}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground">Name:</span>
                  <span>{session.user?.name || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <span>{session.user?.email || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium text-muted-foreground">Access Token:</span>
                  <span className="font-mono text-xs break-all">
                    {session.accessToken ? `${session.accessToken.substring(0, 20)}...` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {useMSW && (
          <Card>
            <CardHeader>
              <CardTitle>Mock Data Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mock Service Worker is active and serving mock data from the proxy endpoint.
                All API calls to OSM are intercepted and return sanitized mock data.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Full Session Object</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
              {JSON.stringify(session, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
