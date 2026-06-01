"use client"

import { useState, Suspense } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter, useSearchParams } from "next/navigation"
import { LogIn, ArrowRight, UserCircle, Briefcase, Lock, Mail, Loader2, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

function LoginForm() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect_to") || `/${locale}`
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"customer" | "supplier">("customer")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(t("auth.loginError") || error.message)
        setIsLoading(false)
        return
      }

      toast.success(t("auth.loginSuccess") || "Logged in successfully!")
      
      // Successfully authenticated, refresh page/session and redirect
      router.refresh()
      
      // Delay slightly to let toast be visible
      setTimeout(() => {
        router.push(redirectTo)
      }, 800)
      
    } catch (err: any) {
      toast.error(t("auth.loginError"))
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-card text-card-foreground border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 md:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
      {/* Decorative top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <div className="mb-2">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {t("common.appName")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === "vi" ? "Đăng nhập vào tài khoản của bạn" : "Sign in to your account"}
        </p>
      </div>

      {/* Role Selection Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-6 bg-muted/50 p-1 rounded-xl border border-border/40">
        <button
          type="button"
          onClick={() => setRole("customer")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            role === "customer"
              ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCircle className="h-4 w-4" />
          <span>{t("auth.customer").split(" ")[0]}</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("supplier")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            role === "supplier"
              ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>{t("auth.partner").split(" ")[0]}</span>
        </button>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
              {t("auth.password")}
            </label>
            <span className="text-xs font-medium text-primary hover:underline cursor-pointer transition-colors duration-200">
              {t("auth.forgotPassword")}
            </span>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75" />
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 mt-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all duration-200 shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("auth.loggingIn")}</span>
            </>
          ) : (
            <>
              <span>{t("common.login")}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center border-t border-border/60 pt-6">
        <span className="text-xs text-muted-foreground font-medium">
          {t("auth.noAccount")}{" "}
          <Link
            href={`/${locale}/signup?redirect_to=${encodeURIComponent(redirectTo)}`}
            className="text-primary font-bold hover:underline transition-all duration-200"
          >
            {t("auth.registerNow")}
          </Link>
        </span>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { locale } = useTranslation()
  return (
    <div className="relative min-h-screen bg-background/50 flex flex-col items-center justify-center p-4">
      {/* Floating Back to Home Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href={`/${locale}`}>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-background/40 hover:bg-background/80 backdrop-blur-md border border-border/40 shadow-sm rounded-xl py-2 px-3 transition-all duration-200 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>{locale === "vi" ? "Trang chủ" : "Home"}</span>
          </Button>
        </Link>
      </div>

      {/* Background radial gradient decoration for premium feel */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_50%_30rem,oklch(0.92_0.02_240),transparent)] pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
