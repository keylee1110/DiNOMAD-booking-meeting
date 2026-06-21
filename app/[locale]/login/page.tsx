"use client"

import { useState, Suspense } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter, useSearchParams } from "next/navigation"
import { LogIn, ArrowRight, UserCircle, Briefcase, Lock, Mail, Loader2, Sparkles, ArrowLeft, Shield } from "lucide-react"
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
  const [role, setRole] = useState<"customer" | "supplier" | "admin">("customer")
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

      // Fetch actual user role from Supabase auth metadata first, then fallback to profiles table
      let actualRole = role
      console.log("=== [DEBUG LOGIN] ===")
      console.log("UI Selected Role:", role)
      console.log("Auth User Metadata:", data.user?.user_metadata)
      console.log("Auth User ID:", data.user?.id)

      if (data.user?.user_metadata?.role) {
        actualRole = data.user.user_metadata.role
        console.log("Extracted Role from user_metadata:", actualRole)
      }

      try {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user?.id || "")
        
        console.log("Profiles Query Response:", profileData)
        if (profileErr) {
          console.error("Profiles Query Error:", profileErr)
        }
        
        if (profileData) {
          const profile = Array.isArray(profileData) ? profileData[0] : profileData
          if (profile?.role) {
            actualRole = profile.role as any
            console.log("Extracted Role from profiles table:", actualRole)
          }
        }
      } catch (profileErr) {
        console.error("Error fetching user profile:", profileErr)
      }

      console.log("Final Redirect Decision Role:", actualRole)

      if (typeof window !== "undefined") {
        localStorage.removeItem("dinomad_demo_admin")
      }

      toast.success(t("auth.loginSuccess") || "Logged in successfully!")
      
      // Successfully authenticated, refresh page/session and redirect
      router.refresh()
      
      // Delay slightly to let toast be visible
      setTimeout(() => {
        let targetRedirect = searchParams.get("redirect_to")
        
        // If the redirect parameter points to home page, or is empty, or if the user is an admin
        // we redirect them to the correct dashboard/page.
        if (!targetRedirect || targetRedirect === `/${locale}` || targetRedirect === "/" || actualRole === "admin") {
          targetRedirect = actualRole === "admin" ? `/${locale}/admin` : `/${locale}`
        }

        console.log("Redirecting to:", targetRedirect)
        router.push(targetRedirect)
      }, 800)
      
    } catch (err: any) {
      if (err?.message === "Failed to fetch") {
        toast.error(locale === "vi" ? "Không thể kết nối đến máy chủ. Vui lòng thử lại sau." : "Cannot connect to server. Please try again.")
      } else {
        toast.error(t("auth.loginError"))
      }
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
        }
      })
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err?.message === "Failed to fetch") {
        toast.error(locale === "vi" ? "Không thể kết nối đến máy chủ. Vui lòng thử lại sau." : "Cannot connect to server. Please try again.")
      } else {
        toast.error(locale === "vi" ? "Đăng nhập thất bại!" : "OAuth login failed!")
      }
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
      <div className="grid grid-cols-3 gap-2 mb-6 bg-muted/50 p-1 rounded-xl border border-border/40">
        <button
          type="button"
          onClick={() => setRole("customer")}
          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
            role === "customer"
              ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCircle className="h-3.5 w-3.5" />
          <span>{t("auth.customer").split(" ")[0]}</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("supplier")}
          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
            role === "supplier"
              ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>{t("auth.partner").split(" ")[0]}</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("admin")}
          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
            role === "admin"
              ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>{t("auth.admin").split(" ")[0]}</span>
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

      {/* OR Divider */}
      <div className="relative flex py-4 items-center">
        <div className="flex-grow border-t border-border/60"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {locale === "vi" ? "Hoặc đăng nhập bằng" : "Or log in with"}
        </span>
        <div className="flex-grow border-t border-border/60"></div>
      </div>

      {/* Social Logins */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("google")}
          disabled={isLoading}
          className="h-10 rounded-xl hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 border-border/80 cursor-pointer transition-all duration-200"
        >
          <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.76 14.94 1 12 1 7.37 1 3.42 3.66 1.5 7.55l3.87 3a7.2 7.2 0 016.63-5.51z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.43a5.5 5.5 0 01-2.39 3.62l3.72 2.89c2.18-2 3.73-4.96 3.73-8.61z"
            />
            <path
              fill="#FBBC05"
              d="M5.37 14.55a7.18 7.18 0 010-5.1V6.45L1.5 3.45a11.95 11.95 0 000 17.1l3.87-3v-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.72-2.89a7.22 7.22 0 01-10.87-3.83l-3.87 3C3.42 20.34 7.37 23 12 23z"
            />
          </svg>
          <span>Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("facebook")}
          disabled={isLoading}
          className="h-10 rounded-xl hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 border-border/80 cursor-pointer transition-all duration-200"
        >
          <svg className="h-4.5 w-4.5 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Facebook</span>
        </Button>
      </div>

      {/* Demo admin access */}
      <div className="mt-4 pt-4 border-t border-dashed border-border/40">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("dinomad_demo_admin", "true")
            }
            toast.success(locale === "vi" ? "Đã vào chế độ Demo Admin!" : "Demo Admin mode activated!")
            setTimeout(() => router.push(`/${locale}/admin/suppliers`), 500)
          }}
          className="w-full text-xs font-medium text-muted-foreground hover:text-primary py-2 transition-colors"
        >
          {locale === "vi" ? "⚡ Truy cập Demo Admin (không cần đăng nhập)" : "⚡ Demo Admin Access (no login required)"}
        </button>
      </div>

      <div className="mt-4 text-center">
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
