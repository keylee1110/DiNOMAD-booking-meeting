"use client"
 
import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { LayoutDashboard, DoorOpen, QrCode, TrendingUp, Building2, LogOut, Bell, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { getPartnerDashboard } from "@/lib/api/partner"
import { toast } from "sonner"
 
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [actionCount, setActionCount] = useState(0)
  const [supplierName, setSupplierName] = useState<string | null>(null)
  const [supplierRole, setSupplierRole] = useState<string | null>(null)

  useEffect(() => {
    // Fetch dashboard metrics for notification badge
    getPartnerDashboard()
      .then(d => {
        // Count pending check-ins as notification items
        setActionCount(d.pendingCheckIns.length)
      })
      .catch(() => { /* silently skip if backend unavailable */ })

    // Fetch supplier info for profile chip
    supabase.auth.getSession().then(async ({ data }: { data: { session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] } }) => {
      if (!data.session) return
      const { data: members } = await supabase
        .from("supplier_members")
        .select("role, suppliers(display_name)")
        .eq("user_id", data.session.user.id)
        .eq("is_active", true)
        .limit(1)
        .single() as any
      if (members) {
        setSupplierName(members.suppliers?.display_name ?? null)
        setSupplierRole(members.role ?? null)
      }
    })
  }, [])
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
        <div className="flex items-center gap-2">
          {/* Bell with badge */}
          <div className="relative">
            <Link
              href={`/${locale}/partner`}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent hover:bg-muted/80 transition-colors text-muted-foreground"
            >
              <Bell className="h-5 w-5" />
            </Link>
            {actionCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-bounce">
                {actionCount > 9 ? "9+" : actionCount}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent hover:bg-muted/80 transition-colors text-muted-foreground hover:text-destructive"
            aria-label={t("partner.logout")}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 z-50 flex w-full border-t border-border/40 bg-card md:relative md:w-64 md:flex-col md:border-r md:border-border/40 md:bg-background shrink-0 transition-transform">
        {/* Desktop logo */}
        <div className="hidden h-[88px] items-center px-6 border-b border-border/40 md:flex shrink-0">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="DiNOMAD Logo" width={40} height={40} className="object-contain" />
            <div className="font-bold tracking-tight text-2xl leading-none">
              DiNOMAD <span className="text-primary font-bold ml-1 inline-block">Ops</span>
            </div>
          </div>
        </div>

        {/* Supplier profile chip (desktop only) */}
        {supplierName && (
          <div className="hidden md:flex items-center gap-3 px-6 py-3 border-b border-border/40 bg-muted/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm shrink-0">
              {supplierName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">{supplierName}</span>
              {supplierRole && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-px w-fit capitalize mt-0.5">
                  {supplierRole}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex w-full flex-row justify-around p-2 md:flex-col md:justify-start md:gap-3 md:p-6 overflow-y-auto md:flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2.5 md:px-4 md:py-3.5 transition-all rounded-xl ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground font-semibold hover:bg-muted/40"
                }`}
              >
                <item.icon className="h-5 w-5 md:h-[22px] md:w-[22px]" />
                <span className="text-[10px] md:text-[13px] uppercase tracking-wider">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Desktop bell + logout */}
        <div className="hidden md:flex flex-col px-6 pb-6 gap-2">
          <Link
            href={`/${locale}/partner`}
            className="relative flex w-full flex-row items-center gap-4 px-4 py-3.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 font-semibold transition-all"
          >
            <Bell className="h-[22px] w-[22px]" />
            <span className="text-[13px] uppercase tracking-wider">{t("partner.notifications")}</span>
            {actionCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                {actionCount > 9 ? "9+" : actionCount}
              </span>
            )}
          </Link>
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
