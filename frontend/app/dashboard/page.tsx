"use client";
import { ProtectedRoute } from "@/components/protection";
import { useauth } from "@/lib/authcontext";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardPage() {
  const { user, logout } = useauth();
  return (
    <ProtectedRoute allowedroles={['Participant']}>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">dashboard</h1>
              <p className="text-muted-foreground mt-1">
                welcome back, {user?.firstName || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Button variant="outline" onClick={logout}>
                logout
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="border rounded-lg p-6">
              <h2 className="font-semibold mb-2">your profile</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">email:</dt>
                  <dd>{user?.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">role:</dt>
                  <dd>{user?.role}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
