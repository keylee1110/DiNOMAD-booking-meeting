"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Activity, 
  Calendar, 
  LogOut, 
  Loader2, 
  UserCheck,
  Building,
  Save,
  CheckCircle,
  FileSpreadsheet,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: "customer" | "supplier" | "admin"
  status: "active" | "blocked" | "deleted"
  created_at: string
  updated_at: string
  points?: number
}

export default function ProfilePage() {
  const { locale, t } = useTranslation()
  const router = useRouter()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form fields mapped to the profiles DB schema
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"customer" | "supplier" | "admin">("customer")
  const [status, setStatus] = useState<"active" | "blocked" | "deleted">("active")
  const [createdAt, setCreatedAt] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [points, setPoints] = useState(0)
  const [bookingStats, setBookingStats] = useState({ total: 0, completed: 0, totalSpent: 0 })

  const supabase = createClient()

  useEffect(() => {
    let active = true

    async function checkAuth() {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (active) {
          toast.error(
            locale === "vi" 
              ? "Bạn cần đăng nhập để truy cập trang này." 
              : "Authentication required to access this page."
          )
          router.push(`/${locale}/login?redirect_to=/${locale}/profile`)
        }
        return
      }

      if (active) {
        setUser(user)
        fetchProfile(user.id, user)
      }
    }

    async function fetchProfile(userId: string, authUser: User) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (error) {
          console.error("Error fetching database profile:", error)
          // Fallback prefill from user metadata
          setEmail(authUser.email || "")
          setFullName(authUser.user_metadata?.full_name || "")
          setPhone(authUser.user_metadata?.phone || "")
          setRole((authUser.user_metadata?.role as any) || "customer")
          setStatus("active")
          setCreatedAt(authUser.created_at || "")
          setPoints(0)
        } else if (active && data) {
          const p = data as UserProfile
          setEmail(p.email)
          setFullName(p.full_name || "")
          setPhone(p.phone || "")
          setRole(p.role)
          setStatus(p.status)
          setCreatedAt(p.created_at)
          setAvatarUrl(p.avatar_url || "")
          setPoints(p.points || 0)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Fetch booking stats for dashboard
    async function fetchBookingStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("bookings")
        .select("status, total_amount")
        .eq("customer_id", user.id)
      if (data && !error) {
        const total = data.length
        const completed = data.filter((b: any) => b.status === "completed").length
        const totalSpent = data.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0)
        setBookingStats({ total, completed, totalSpent })
      }
    }
    fetchBookingStats()

    return () => {
      active = false
    }
  }, [locale, router])

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) {
        toast.error(
          locale === "vi"
            ? `Cập nhật thông tin thất bại: ${error.message}`
            : `Failed to save changes: ${error.message}`
        )
      } else {
        toast.success(
          locale === "vi"
            ? "Cập nhật thông tin hồ sơ thành công!"
            : "Profile updated successfully!"
        )
        
        // Refresh local user metadata too
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            phone: phone
          }
        })
        
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast.error(locale === "vi" ? "Đã xảy ra lỗi hệ thống!" : "A system error occurred!")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.href = `/${locale}`
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          {locale === "vi" ? "Đang tải thông tin..." : "Loading profile..."}
        </p>
      </div>
    )
  }

  // Get user name initials for avatar placeholder
  const getInitials = () => {
    if (!fullName) return "U"
    return fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Upper Account Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-8 md:p-10 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(35rem_15rem_at_90%_5rem,rgba(100,181,246,0.08),transparent)] pointer-events-none" />
        
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xl shadow-inner select-none">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover rounded-2xl" />
            ) : (
              getInitials()
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {fullName || (locale === "vi" ? "Người dùng DiNOMAD" : "DiNOMAD User")}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-extrabold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
                role === "admin" 
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : role === "supplier"
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {role === "supplier" 
                  ? (locale === "vi" ? "Đối tác cho thuê" : "Partner")
                  : role === "admin"
                  ? "Admin"
                  : (locale === "vi" ? "Khách hàng" : "Customer")}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="text-xs font-semibold text-muted-foreground">
                {email}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="rounded-xl border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:border-destructive/30 font-bold transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {locale === "vi" ? "Đăng xuất" : "Log Out"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Info Badges (DB Schema Metadata) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Loyalty Points Card */}
          <div className="bg-card text-card-foreground border border-border/80 rounded-3xl p-6 shadow-sm relative overflow-hidden bg-gradient-to-br from-card via-card to-amber-500/3">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {locale === "vi" ? "Điểm thưởng DiNOMAD" : "Loyalty Points"}
              </h3>
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse shrink-0" />
            </div>
            
            <div className="flex flex-col gap-1.5 py-2">
              <span className="text-3.5xl font-black tracking-tight text-foreground">
                {new Intl.NumberFormat("vi-VN").format(points)}
                <span className="text-xs font-semibold text-muted-foreground ml-1.5 uppercase">{locale === "vi" ? "Điểm" : "Pts"}</span>
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === "vi"
                  ? `Tương đương: ${new Intl.NumberFormat("vi-VN").format(points)} VNĐ. Được khấu trừ trực tiếp khi thanh toán đơn phòng.`
                  : `Valued at ${new Intl.NumberFormat("vi-VN").format(points)} VND. Can be redeemed at checkout to discount bookings.`}
              </p>
            </div>

            <div className="border-t border-border/50 mt-4 pt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{locale === "vi" ? "Tỷ lệ tích lũy:" : "Earning rate:"}</span>
                <span className="font-bold text-foreground">1% {locale === "vi" ? "giá trị thanh toán mặt" : "on cash spent"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{locale === "vi" ? "Giá trị quy đổi:" : "Points valuation:"}</span>
                <span className="font-bold text-foreground">1 {locale === "vi" ? "điểm" : "pt"} = 1 VND</span>
              </div>
            </div>
          </div>

          {/* Booking Stats Card */}
          <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {locale === "vi" ? "Thống kê đặt phòng" : "Booking Stats"}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 p-3 text-center">
                <span className="text-2xl font-black text-foreground">{bookingStats.total}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">
                  {locale === "vi" ? "Tổng đơn" : "Total"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-500/8 p-3 text-center border border-emerald-500/15">
                <span className="text-2xl font-black text-emerald-600">{bookingStats.completed}</span>
                <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide mt-0.5">
                  {locale === "vi" ? "Hoàn thành" : "Done"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 p-3 text-center border border-primary/10">
                <span className="text-lg font-black text-primary leading-tight">
                  {bookingStats.totalSpent > 0
                    ? `${(bookingStats.totalSpent / 1_000_000).toFixed(1)}M`
                    : "0"}
                </span>
                <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wide mt-0.5">VND</span>
              </div>
            </div>
          </div>

          <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">
              {locale === "vi" ? "Thông tin tài khoản" : "Account Metadata"}
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary/80" />
                  {locale === "vi" ? "Quyền truy cập" : "Access Level"}
                </span>
                <span className="text-xs font-bold text-foreground capitalize">
                  {role}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary/80" />
                  {locale === "vi" ? "Trạng thái" : "Status"}
                </span>
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 fill-success/10" />
                  {locale === "vi" ? "Đang hoạt động" : "Active"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary/80" />
                  {locale === "vi" ? "Ngày tham gia" : "Created At"}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {createdAt ? new Date(createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {locale === "vi" ? "Tác vụ nhanh" : "Quick Actions"}
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push(`/${locale}/search`)}
                className="w-full justify-start rounded-xl font-bold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-all"
              >
                <Building className="h-4 w-4 mr-2" />
                {locale === "vi" ? "Khám phá phòng họp" : "Explore Spaces"}
              </Button>
              
              <Button
                onClick={() => router.push(`/${locale}/my-bookings`)}
                variant="outline"
                className="w-full justify-start rounded-xl font-bold border-border bg-background hover:bg-accent/40 text-foreground transition-all"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {locale === "vi" ? "Đơn đặt của tôi" : "My Bookings"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Form Editor Fields */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveChanges} className="bg-card text-card-foreground border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {locale === "vi" ? "Cập nhật hồ sơ cá nhân" : "Edit Profile Settings"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "vi" 
                  ? "Thay đổi thông tin liên hệ của bạn để thuận tiện khi check-in tại các địa điểm." 
                  : "Keep your details updated for a smooth workspace check-in experience."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  {locale === "vi" ? "Họ và tên" : "Full Name"}
                </label>
                <Input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={locale === "vi" ? "Nhập họ tên của bạn" : "Enter your full name"}
                  className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200 text-sm font-semibold"
                  disabled={isSaving}
                />
              </div>

              {/* Phone Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {locale === "vi" ? "Số điện thoại" : "Phone Number"}
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0901234567"
                  className="h-11 rounded-xl border-border bg-background focus-visible:ring-primary/20 transition-all duration-200 text-sm font-semibold"
                  disabled={isSaving}
                />
              </div>

              {/* Email Address (Read-only) */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground tracking-wide uppercase flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {locale === "vi" ? "Địa chỉ Email (Không thể thay đổi)" : "Email Address (Read-only)"}
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="h-11 rounded-xl border-border bg-muted/50 text-muted-foreground cursor-not-allowed text-sm font-semibold"
                />
              </div>

            </div>

            <div className="border-t border-border/60 pt-5 flex justify-end">
              <Button
                type="submit"
                className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all duration-200 shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{locale === "vi" ? "Đang lưu thay đổi..." : "Saving changes..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{locale === "vi" ? "Lưu thay đổi" : "Save Changes"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
