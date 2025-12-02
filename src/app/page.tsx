"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const mockEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true" || process.env.MOCK_AUTH_ENABLED === "true";
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">SEEE Expedition Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Sign in to continue. Choose Online Scout Manager for real accounts.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => signIn("osm")}>Sign in with OSM</Button>
            {mockEnabled && (
              <Button variant="secondary" onClick={() => signIn("credentials", { redirect: true })}>
                Dev: Mock Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
