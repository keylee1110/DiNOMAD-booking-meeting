"use client"
 
import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { LayoutDashboard, DoorOpen, QrCode, Bell, TrendingUp, Building2, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
 
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = `/${locale}/login?redirect_to=${encodeURIComponent(pathname)}`
        return
      }

      // Check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile || (profile.role !== "supplier" && profile.role !== "admin")) {
        // Fetch supplier application status to show a helpful message
        const { data: memberData } = await supabase
          .from("supplier_members")
          .select("supplier_id, suppliers(status)")
          .eq("user_id", user.id)
          .eq("is_active", true)

        let msg = locale === "vi"
          ? "Tài khoản của bạn chưa được duyệt làm Supplier."
          : "Your account is not approved as a Supplier."

        if (memberData && memberData.length > 0) {
          const status = (memberData[0] as any).suppliers?.status
          if (status === "pending") {
            msg = locale === "vi" 
              ? "Tài khoản đối tác của bạn đang chờ Admin phê duyệt." 
              : "Your partner account is pending admin approval."
          } else if (status === "rejected") {
            msg = locale === "vi"
              ? "Đơn đăng ký đối tác của bạn đã bị từ chối. Vui lòng liên hệ Admin."
              : "Your partner application was rejected. Please contact Admin."
          }
        }

        toast.error(msg)
        window.location.href = `/${locale}`
      } else {
        setIsAuthorized(true)
      }
    }

    checkAuth()
  }, [locale, supabase, pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = `/${locale}`
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {locale === "vi" ? "Đang xác thực quyền truy cập..." : "Verifying access privileges..."}
          </p>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: `/${locale}/partner`, icon: LayoutDashboard, label: t("partner.dashboard") },
    { href: `/${locale}/partner/venues`, icon: Building2, label: t("partner.navVenues") },
    { href: `/${locale}/partner/inventory`, icon: DoorOpen, label: t("partner.navInventory") },
    { href: `/${locale}/partner/earnings`, icon: TrendingUp, label: t("partner.earnings") },
    { href: `/${locale}/partner/scanner`, icon: QrCode, label: t("partner.navScanner") },
  ]

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background font-sans">
      {/* Mobile Header */}
      <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card px-4 md:hidden shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="DiNOMAD Logo" width={32} height={32} className="object-contain" />
          <div className="font-bold tracking-tight text-xl">DiNOMAD <span className="text-primary font-bold">Ops</span></div>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent hover:bg-muted/80 transition-colors text-muted-foreground hover:text-destructive"
          aria-label={t("partner.logout")}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 z-50 flex w-full border-t border-border/40 bg-card md:relative md:w-64 md:flex-col md:border-r md:border-border/40 md:bg-background shrink-0 transition-transform">
        <div className="hidden h-[88px] items-center px-6 border-b border-border/40 md:flex shrink-0">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="DiNOMAD Logo" width={40} height={40} className="object-contain" />
            <div className="font-bold tracking-tight text-2xl leading-none">
              DiNOMAD <span className="text-primary font-bold ml-1 inline-block">Ops</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-row justify-around p-2 md:flex-col md:justify-start md:gap-3 md:p-6 overflow-y-auto md:flex-1">
          {navItems.map((item) => {
             const isActive = pathname === item.href
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2.5 md:px-4 md:py-3.5 transition-all rounded-xl ${
                   isActive
                     ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                     : 'text-muted-foreground hover:text-foreground font-semibold hover:bg-muted/40'
                 }`}
               >
                 <item.icon className="h-5 w-5 md:h-[22px] md:w-[22px]" />
                 <span className="text-[10px] md:text-[13px] uppercase tracking-wider">{item.label}</span>
               </Link>
             )
          })}
        </div>

        {/* Logout — desktop only (mobile has it in the header) */}
        <div className="hidden md:block px-6 pb-6">
          <button
            onClick={handleLogout}
            className="flex w-full flex-row items-center gap-4 px-4 py-3.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-semibold transition-all"
          >
            <LogOut className="h-[22px] w-[22px]" />
            <span className="text-[13px] uppercase tracking-wider">{t("partner.logout")}</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        <div className="mx-auto max-w-6xl p-4 md:p-10 lg:p-14">
          {children}
        </div>
      </main>
    </div>
  )
}
