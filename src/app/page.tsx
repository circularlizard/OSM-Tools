"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import Image from "next/image";

type UserRoleSelection = "admin" | "standard";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const mockEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true" || process.env.MOCK_AUTH_ENABLED === "true";
  const [selectedRole, setSelectedRole] = useState<UserRoleSelection>("standard");
  const [infoOpen, setInfoOpen] = useState(false);
  
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);
  
  if (status === "loading" || status === "authenticated") {
    return null;
  }

  const handleSignIn = () => {
    // Store role selection in localStorage to persist through OAuth redirect
    localStorage.setItem('oauth-role-selection', selectedRole);
    console.log('[Login] Stored role in localStorage:', selectedRole);
    
    // Initiate OAuth flow
    signIn("osm", { callbackUrl: "/dashboard?roleSelection=" + selectedRole });
  };

  return (
    <div className="relative min-h-screen">
      {/* Hero background image */}
      <Image src="/hero.jpg" alt="Expedition hero" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">SEEE Expedition Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to continue. Select your access level below.
            </p>
            
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Access Level</Label>
              <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRoleSelection)}>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="standard" id="standard" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="standard" className="font-medium cursor-pointer">
                      Standard Viewer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      View events and attendance only
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="admin" id="admin" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="admin" className="font-medium cursor-pointer">
                      Administrator
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Full access to all sections and members
                    </p>
                  </div>
                </div>
              </RadioGroup>
              
              {/* Collapsible Info Section */}
              <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                  <span>What permissions will be requested?</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 text-xs text-muted-foreground border-l-2 border-muted pl-4">
                  {selectedRole === "admin" ? (
                    <>
                      <p className="font-medium">Administrator permissions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Read events and attendance</li>
                        <li>Read member information</li>
                        <li>Read programme records</li>
                        <li>Read flexi records</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Standard Viewer permissions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Read events and attendance only</li>
                      </ul>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={handleSignIn} size="lg">
                Sign in with OSM
              </Button>
              {mockEnabled && (
                <Button variant="secondary" onClick={() => signIn("credentials", { callbackUrl: "/dashboard" })}>
                  Dev: Mock Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
