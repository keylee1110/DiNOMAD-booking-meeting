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
  FileSpreadsheet
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
        } else if (active && data) {
          const p = data as UserProfile
          setEmail(p.email)
          setFullName(p.full_name || "")
          setPhone(p.phone || "")
          setRole(p.role)
          setStatus(p.status)
          setCreatedAt(p.created_at)
          setAvatarUrl(p.avatar_url || "")
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
    toast.success(locale === "vi" ? "Đã đăng xuất thành công!" : "Logged out successfully!")
    router.refresh()
    router.push(`/${locale}`)
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
