"use client"

import { useState, Suspense } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, UserCircle, Briefcase, Lock, Mail, Loader2, User, Phone, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

function SignupForm() {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect_to") || ""
  
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"customer" | "supplier">(
    searchParams.get("role") === "supplier" ? "supplier" : "customer"
  )
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Password matching validation
    if (password !== confirmPassword) {
      toast.error(
        locale === "vi" 
          ? "Mật khẩu xác nhận không trùng khớp!" 
          : "Confirm password does not match!"
      )
      setIsLoading(false)
      return
    }

    if (!agreeTerms) {
      toast.error(
        locale === "vi" 
          ? "Bạn phải đồng ý với Điều khoản và Điều kiện sử dụng!" 
          : "You must agree to the Terms and Conditions!"
      )
      setIsLoading(false)
      return
    }
    
    try {
      const supabase = createClient()
      
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          }
        }
      })

      if (authError) {
        toast.error(t("auth.signupError") || authError.message)
        setIsLoading(false)
        return
      }

      const session = authData.session
      const user = authData.user

      // If the user registered as a Partner/Supplier, automatically submit application
      if (role === "supplier" && user) {
        const { error: rpcError } = await supabase.rpc("submit_supplier_application", {
          legal_name: fullName,
          display_name: `${fullName} Space`,
          business_email: email,
          business_phone: phone,
          onboarding_note: "Auto-submitted during partner registration"
        })

        if (rpcError) {
          console.error("Partner creation RPC failed:", rpcError)
        }
      }

      // If email verification is active (no active session yet)
      if (!session && user) {
        setIsRegisteredSuccess(true)
        setIsLoading(false)
        return
      }

      if (role === "supplier") {
        toast.success(
          locale === "vi"
            ? "Đã gửi đơn đăng ký đối tác! Vui lòng chờ admin xét duyệt."
            : "Partner application submitted! Please wait for admin approval."
        )
      } else {
        toast.success(t("auth.signupSuccess") || "Registration successful!")
      }
      
      // Determine Redirect Path:
      const isCheckoutOrBooking = redirectTo && (
        redirectTo.includes("checkout") || 
        redirectTo.includes("booking") || 
        redirectTo.includes("search")
      )

      const targetPath = isCheckoutOrBooking ? redirectTo : `/${locale}/profile`

      // Refresh session state and redirect
      router.refresh()
      
      setTimeout(() => {
        router.push(targetPath)
      }, 1000)

    } catch (err: any) {
      toast.error(t("auth.signupError"))
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
      toast.error(locale === "vi" ? "Đăng ký thất bại!" : "OAuth registration failed!")
      setIsLoading(false)
    }
  }

  // Render Verification Email Screen State
  if (isRegisteredSuccess) {
    return (
      <div className="w-full max-w-md bg-card text-card-foreground border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 md:p-10 relative overflow-hidden text-center transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-success/40 via-success to-success/40" />
        
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 border border-success/20 text-success mx-auto mb-6 shadow-inner animate-bounce">
          <CheckCircle className="h-8 w-8" />
        </div>

        {role === "supplier" ? (
          <>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-3">
              {locale === "vi" ? "Đã gửi đơn đăng ký!" : "Application Submitted!"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {locale === "vi"
                ? "Chúng tôi đã gửi một liên kết xác thực tài khoản đến địa chỉ email "
                : "We've sent an account verification link to "}
              <strong className="text-foreground">{email}</strong>.
              {locale === "vi"
                ? " Sau khi xác thực, đơn đăng ký đối tác của bạn sẽ được admin xét duyệt. Chúng tôi sẽ thông báo khi tài khoản được kích hoạt."
                : " After verification, your partner application will be reviewed by admin. We'll notify you once your account is activated."}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-3">
              {locale === "vi" ? "Kiểm tra Email của bạn" : "Check Your Email"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {locale === "vi"
                ? `Chúng tôi đã gửi một liên kết xác thực tài khoản đến địa chỉ email `
                : `We've sent an account verification link to `}
              <strong className="text-foreground">{email}</strong>.
              {locale === "vi"
                ? " Vui lòng nhấp vào liên kết trong email để kích hoạt tài khoản trước khi đăng nhập."
                : " Please click the link inside to activate your account before logging in."}
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link href={`/${locale}/login?redirect_to=${encodeURIComponent(redirectTo)}`} className="w-full">
            <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold flex items-center justify-center gap-2">
              <span>{locale === "vi" ? "Đi tới Đăng nhập" : "Proceed to Log In"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          
          <button 
            onClick={() => setIsRegisteredSuccess(false)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{locale === "vi" ? "Quay lại trang Đăng ký" : "Go back to Sign Up"}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-card text-card-foreground border border-border/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 md:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
      {/* Decorative top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="flex flex-col items-center gap-2 mb-6 text-center">
        <div className="mb-2">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {t("common.signup")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === "vi" ? "Tạo tài khoản DiNOMAD mới" : "Create your DiNOMAD account"}
        </p>
      </div>

      {/* Role Selection Toggle */}
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
          {t("auth.role")}
        </label>
        <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-xl border border-border/40">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs transition-all ${
              role === "customer"
                ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCircle className="h-5 w-5 mb-1 text-primary" />
            <span className="font-bold">{locale === "vi" ? "Khách hàng" : "Customer"}</span>
            <span className="text-[10px] text-muted-foreground text-center mt-1 hidden md:block leading-tight">
              {t("auth.roleCustomerDesc")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRole("supplier")}
            className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs transition-all ${
              role === "supplier"
                ? "bg-card text-foreground shadow-sm border border-border/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-5 w-5 mb-1 text-primary" />
            <span className="font-bold">{locale === "vi" ? "Đối tác" : "Partner"}</span>
            <span className="text-[10px] text-muted-foreground text-center mt-1 hidden md:block leading-tight">
              {t("auth.rolePartnerDesc")}
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
            {t("auth.fullName")}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75" />
            <Input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={locale === "vi" ? "Nguyễn Văn A" : "John Doe"}
              className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
            {t("auth.phone")}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75" />
            <Input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
            {t("auth.password")}
          </label>
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

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase">
            {locale === "vi" ? "Xác nhận Mật khẩu" : "Confirm Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75" />
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Agree to Terms Checkbox */}
        <div className="flex items-start gap-2.5 my-1">
          <Checkbox 
            id="agreeTerms"
            checked={agreeTerms} 
            onCheckedChange={(v) => setAgreeTerms(Boolean(v))} 
            disabled={isLoading}
          />
          <label 
            htmlFor="agreeTerms" 
            className="text-xs text-muted-foreground leading-normal cursor-pointer select-none"
          >
            {locale === "vi" ? (
              <>
                Tôi đồng ý với{" "}
                <a href="#" className="text-primary hover:underline font-bold transition-colors">Điều Khoản Dịch Vụ</a>
                {" "}và{" "}
                <a href="#" className="text-primary hover:underline font-bold transition-colors">
                  {role === "supplier" ? "Chính Sách Đối Tác" : "Chính Sách Hủy Đặt Phòng"}
                </a>
              </>
            ) : (
              <>
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline font-bold transition-colors">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline font-bold transition-colors">
                  {role === "supplier" ? "Partner Policy" : "Cancellation Policy"}
                </a>
              </>
            )}
          </label>
        </div>

        <Button
          type="submit"
          className="h-11 mt-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all duration-200 shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("auth.signingUp")}</span>
            </>
          ) : (
            <>
              <span>{t("common.signup")}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* OR Divider */}
      <div className="relative flex py-4 items-center">
        <div className="flex-grow border-t border-border/60"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {locale === "vi" ? "Hoặc đăng ký bằng" : "Or sign up with"}
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

      <div className="mt-6 text-center border-t border-border/60 pt-5">
        <span className="text-xs text-muted-foreground font-medium">
          {t("auth.haveAccount")}{" "}
          <Link
            href={`/${locale}/login?redirect_to=${encodeURIComponent(redirectTo)}`}
            className="text-primary font-bold hover:underline transition-all duration-200"
          >
            {t("auth.loginNow")}
          </Link>
        </span>
      </div>
    </div>
  )
}

export default function SignupPage() {
  const { locale } = useTranslation()
  return (
    <div className="relative min-h-screen bg-background/50 flex flex-col items-center justify-center p-4 py-8">
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
        <SignupForm />
      </Suspense>
    </div>
  )
}
