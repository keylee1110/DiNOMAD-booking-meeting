"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { LogIn, ArrowRight, UserCircle, Briefcase } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"customer" | "partner">("customer")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulated authentication & routing logic
    if (role === "partner" || email.includes("partner")) {
      router.push(`/${locale}/partner`)
    } else {
      router.push(`/${locale}`)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
      {/* Brutalist Container */}
      <div className="w-full max-w-md border-4 border-foreground bg-card shadow-[12px_12px_0px_0px_var(--color-primary)] p-8 md:p-12">
        
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="bg-primary text-primary-foreground p-3 border-4 border-foreground transform -rotate-3 hover:rotate-3 transition-transform">
             <LogIn className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">DiNOMAD</h1>
          <p className="border-t-2 border-border pt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Role Toggle Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button 
            type="button"
            onClick={() => setRole("customer")}
            className={`flex flex-col items-center gap-2 border-2 p-3 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all ${role === 'customer' ? 'border-primary bg-primary/10 text-primary shadow-[2px_2px_0px_0px_var(--color-primary)]' : 'border-border bg-background hover:border-foreground text-muted-foreground'}`}
          >
            <UserCircle className="h-5 w-5" /> Customer
          </button>
          <button 
            type="button"
            onClick={() => setRole("partner")}
            className={`flex flex-col items-center gap-2 border-2 p-3 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all ${role === 'partner' ? 'border-foreground bg-foreground text-background shadow-[2px_2px_0px_0px_var(--color-foreground)] transform translate-y-[-2px]' : 'border-border bg-background hover:border-foreground text-muted-foreground'}`}
          >
            <Briefcase className="h-5 w-5" /> Partner
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'partner' ? 'partner@dinomad.com' : 'hello@dinomad.com'}
              className="border-4 border-foreground p-4 bg-background font-bold focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black uppercase tracking-widest flex items-center justify-between">
               Password
               <span className="text-muted-foreground hover:text-primary cursor-pointer border-b-2 border-transparent hover:border-primary transition-colors">Forgot?</span>
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-4 border-foreground p-4 bg-background font-bold focus:outline-none focus:border-primary transition-colors tracking-widest"
            />
          </div>

          <button 
            type="submit" 
            className="mt-4 w-full border-4 border-foreground bg-primary text-primary-foreground py-4 font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_var(--color-foreground)] active:translate-y-1 active:shadow-none text-sm md:text-base"
          >
            Authenticate <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t-2 border-dashed border-border pt-6">
           <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
             New to DiNOMAD? <Link href={`/${locale}`} className="text-foreground hover:text-primary border-b-2 border-foreground hover:border-primary transition-colors pb-0.5">Explore Spaces</Link>
           </span>
        </div>

      </div>
    </div>
  )
}
