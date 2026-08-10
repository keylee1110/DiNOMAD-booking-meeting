"use client"

import { useState, Suspense } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Lock, Mail, Loader2, ArrowLeft } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // 1. Email format validation before submit
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error(locale === "vi" ? "Email không đúng định dạng!" : "Invalid email format!")
      setIsLoading(false)
      return
    }
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast.error(locale === "vi" 
            ? "Mật khẩu không chính xác hoặc tài khoản không tồn tại." 
            : "Invalid email or password."
          )
        } else if (error.message === "Email not confirmed") {
          toast.error(locale === "vi"
            ? "Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư của bạn."
            : "Email not confirmed. Please check your inbox to verify."
          )
        } else {
          toast.error(locale === "vi" ? "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin." : error.message)
        }
        setIsLoading(false)
        return
      }

      let actualRole: "customer" | "supplier" | "admin" = "customer"

      // Fetch actual role from public.profiles table
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user?.id || "")
          .single()
        
        if (profileErr || !profileData?.role || !["customer", "supplier", "admin"].includes(profileData.role)) {
          throw new Error("ROLE_VALIDATION_FAILED")
        }
        actualRole = profileData.role as "customer" | "supplier" | "admin"
      } catch {
        await supabase.auth.signOut()
        toast.error(locale === "vi" ? "Không thể xác định quyền tài khoản. Vui lòng thử lại." : "Could not verify your account role. Please try again.")
        setIsLoading(false)
        return
      }

      // Supplier accounts must also have an active, approved supplier membership.
      if (actualRole === "supplier") {
        // Additional Partner application status check
        try {
          const { data: memberData } = await supabase
            .from("supplier_members")
            .select("supplier_id, suppliers(status)")
            .eq("user_id", data.user?.id || "")
            .eq("is_active", true)
          
          if (memberData && memberData.length > 0) {
            const supplier = (memberData[0] as unknown as { suppliers: { status?: string } | null }).suppliers
            const status = supplier?.status

            if (status === "pending") {
              toast.error(locale === "vi" 
                ? "Tài khoản đối tác của bạn đang chờ Admin phê duyệt." 
                : "Your partner account is pending admin approval."
              )
              await supabase.auth.signOut()
              setIsLoading(false)
              return
            } else if (status === "rejected") {
              toast.error(locale === "vi"
                ? "Đơn đăng ký đối tác của bạn đã bị từ chối. Vui lòng liên hệ Admin."
                : "Your partner application was rejected. Please contact Admin."
              )
              await supabase.auth.signOut()
              setIsLoading(false)
              return
            }
          } else {
            toast.error(locale === "vi"
              ? "Tài khoản này chưa đăng ký làm đối tác. Vui lòng đăng ký trước."
              : "This account is not registered as a partner. Please register first."
            )
            await supabase.auth.signOut()
            setIsLoading(false)
            return
          }
        } catch {
          await supabase.auth.signOut()
          toast.error(locale === "vi" ? "Không thể xác minh trạng thái đối tác. Vui lòng thử lại." : "Could not verify partner status. Please try again.")
          setIsLoading(false)
          return
        }
      }

      toast.success(locale === "vi" ? "Đăng nhập thành công!" : "Logged in successfully!")
      
      router.refresh()
      
      setTimeout(() => {
        const roleHome = actualRole === "admin"
          ? `/${locale}/admin`
          : actualRole === "supplier" ? `/${locale}/partner` : `/${locale}`
        const requestedRedirect = searchParams.get("redirect_to")
        const canUseRequestedRedirect = requestedRedirect?.startsWith(`/${locale}/admin`)
          ? actualRole === "admin"
          : requestedRedirect?.startsWith(`/${locale}/partner`)
            ? actualRole === "supplier" || actualRole === "admin"
            : Boolean(requestedRedirect?.startsWith(`/${locale}`))
        const targetRedirect = canUseRequestedRedirect ? requestedRedirect! : roleHome

        router.push(targetRedirect)
      }, 800)
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ""
      if (message === "Failed to fetch") {
        toast.error(locale === "vi" ? "Không thể kết nối đến máy chủ. Vui lòng thử lại sau." : "Cannot connect to server. Please try again.")
      } else {
        toast.error(locale === "vi" ? "Đăng nhập thất bại. Vui lòng thử lại." : message || "Login failed")
      }
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const callbackUrl = new URL(`${window.location.origin}/api/auth/callback`)
      callbackUrl.searchParams.set("redirect_to", redirectTo)
      callbackUrl.searchParams.set("mode", "login")
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        }
      })
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ""
      if (message === "Failed to fetch") {
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
      <div className="mt-1">
        <Button
          type="button"
          variant="outline"
          onClick={handleOAuthLogin}
          disabled={isLoading}
          className="w-full h-11 rounded-xl hover:bg-muted/80 font-bold text-xs flex items-center justify-center gap-2.5 border-border/80 cursor-pointer transition-all duration-200 shadow-sm hover:shadow"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
          <span className="text-sm font-semibold">{locale === "vi" ? "Đăng nhập với Google" : "Sign in with Google"}</span>
        </Button>
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
