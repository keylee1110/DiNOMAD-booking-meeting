"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { LogIn, ArrowRight, UserCircle, Briefcase } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/lib/store/user-store"

export default function LoginPage() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"customer" | "partner">("customer")
  const { login } = useUser()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(email, role)
    if (role === "partner" || email.includes("partner")) {
      router.push(`/${locale}/partner`)
    } else {
      router.push(`/${locale}`)
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Circles for Glassmorphism Depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Modern Glassmorphic Container */}
      <div className="w-full max-w-md backdrop-blur-2xl bg-white/80 dark:bg-card/80 border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl p-8 md:p-12 z-10 transition-all duration-500 hover:shadow-primary/5">
        
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-2">
             <LogIn className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">DiNOMAD</h1>
          <p className="text-sm font-medium text-muted-foreground opacity-70">Elevate your workspace experience</p>
        </div>

        {/* Modern Segmented Control for Role Toggle */}
        <div className="flex p-1.5 bg-muted/50 rounded-2xl mb-8 gap-1.5 border border-border/50">
          <button 
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${role === 'customer' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:bg-background/40'}`}
          >
            <UserCircle className="h-4 w-4" /> Customer
          </button>
          <button 
            type="button"
            onClick={() => setRole("partner")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${role === 'partner' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:bg-background/40'}`}
          >
            <Briefcase className="h-4 w-4" /> Partner
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold pl-1 text-muted-foreground">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'partner' ? 'partner@dinomad.com' : 'hello@dinomad.com'}
              className="w-full px-5 py-3.5 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold pl-1 text-muted-foreground flex items-center justify-between">
               Password
               <span className="text-primary hover:underline cursor-pointer text-[11px]">Forgot?</span>
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-3.5 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 tracking-tighter"
            />
          </div>

          <button 
            type="submit" 
            className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
          >
            Authenticate <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-10 text-center border-t border-border/50 pt-8">
           <span className="text-sm font-medium text-muted-foreground">
             New to DiNOMAD? <Link href={`/${locale}`} className="text-primary font-bold hover:underline ml-1">Explore Spaces</Link>
           </span>
        </div>

      </div>
    </div>
  )
}
