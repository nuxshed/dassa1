"use client";

import { useauth } from "@/lib/authcontext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface protectedrouteprops {
  children: React.ReactNode;
  allowedroles?: ('Participant' | 'Organizer' | 'Admin')[];
}

export function ProtectedRoute({ children, allowedroles }: protectedrouteprops) {
  const { user, loading } = useauth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (allowedroles && !allowedroles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, router, allowedroles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">loading...</div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedroles && !allowedroles.includes(user.role)) return null;

  return <>{children}</>;
}
