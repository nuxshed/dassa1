"use client";

import { FerrisWheel } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { ModeToggle } from "@/components/mode-toggle"
import { useauth } from "@/lib/authcontext"

export default function LoginPage() {
  const { user } = useauth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        router.push('/admin');
      } else if (user.role === 'Organizer') {
        router.push('/organizer');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  return (
    <div className="bg-dark flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 font-semibold text-xl">
            <div className="flex size-8 items-center justify-center rounded-md">
              <FerrisWheel className="size-6" />
            </div>
            Felicity
          </a>
          <ModeToggle />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
