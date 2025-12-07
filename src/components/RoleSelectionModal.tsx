"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type UserRoleSelection = "admin" | "standard";

interface RoleSelectionModalProps {
  onRoleSelected: (role: UserRoleSelection) => void;
}

export default function RoleSelectionModal({ onRoleSelected }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRoleSelection>("standard");

  const handleContinue = () => {
    onRoleSelected(selectedRole);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background - same as login page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Select Your Role</CardTitle>
            <CardDescription className="text-base mt-2">
              Choose the role that best describes your responsibilities. This selection determines which OSM permissions are requested.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRoleSelection)}>
              <div className="space-y-4">
                {/* Administrator Option */}
                <div className="relative">
                  <div className="flex items-start space-x-3 p-4 border-2 border-transparent rounded-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedRole("admin")}>
                    <RadioGroupItem value="admin" id="admin" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="admin" className="text-base font-semibold cursor-pointer">
                        Administrator
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Full access to manage events, members, training data, and system configuration.
                      </p>
                      <div className="mt-3 text-xs bg-muted rounded px-3 py-2 font-mono space-y-1">
                        <p className="text-foreground font-semibold">Permissions:</p>
                        <p>✓ section:event:read</p>
                        <p>✓ section:member:read</p>
                        <p>✓ section:programme:read</p>
                        <p>✓ section:flexirecord:read</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Viewer Option */}
                <div className="relative">
                  <div className="flex items-start space-x-3 p-4 border-2 border-transparent rounded-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedRole("standard")}>
                    <RadioGroupItem value="standard" id="standard" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="text-base font-semibold cursor-pointer">
                        Standard Viewer (Unit/Expedition Leader)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        View-only access to events and participation status for your assigned section.
                      </p>
                      <div className="mt-3 text-xs bg-muted rounded px-3 py-2 font-mono space-y-1">
                        <p className="text-foreground font-semibold">Permissions:</p>
                        <p>✓ section:event:read</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="mt-8 flex gap-3">
              <Button
                onClick={handleContinue}
                className="flex-1"
              >
                Continue to Sign In
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              You can change your role later by signing out and logging back in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
