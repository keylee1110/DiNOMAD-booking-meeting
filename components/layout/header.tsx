"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X, CalendarDays, User as UserIcon, LogOut, ChevronDown, Sparkles, Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/store/booking-store"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

export function Header() {
  const { locale, t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { myBookings, wishlist } = useBooking()
  
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>("customer")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Read the session from the locally-persisted cookie (no network round-trip,
    // never throws). This restores the logged-in nav immediately on reload.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      const role = data.session?.user?.user_metadata?.role
      if (role) setUserRole(role)
      setLoading(false)
    }).catch(() => {
      // Never leave the nav stuck in the loading state on an auth error.
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh, INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (typeof window !== "undefined") {
      localStorage.removeItem("dinomad_demo_admin")
    }
    setMenuOpen(false)
    window.location.href = `/${locale}`
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_3px_rgb(0,0,0,0.01)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo and Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group transition-all duration-200">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 border border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-200">
            <Image 
              src="/logo.png" 
              alt="DiNOMAD Logo" 
              width={40} 
              height={40} 
              className="object-contain h-full w-auto"
            />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Di<span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">NOMAD</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.home")}
          </Link>
          <Link
            href={`/${locale}/search`}
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.search")}
          </Link>
          <Link
            href={`/${locale}/my-bookings`}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {locale === "vi" ? "Đơn đặt" : "Bookings"}
            {myBookings.length > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {myBookings.length}
              </span>
            )}
          </Link>
          <Link
            href={`/${locale}/wishlist`}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {locale === "vi" ? "Yêu thích" : "Favorites"}
            {wishlist.length > 0 && (
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>
          
          {user && userRole === "supplier" && (
            <Link
              href={`/${locale}/partner`}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("common.partnerPortal")}
            </Link>
          )}
        </nav>

        {/* Action Controls & Session Management */}
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />

          {!loading && (
            <>
              {user ? (
                /* Authenticated State Display */
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href={`/${locale}/profile`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-accent/40 text-sm font-bold text-foreground transition-all duration-200 shadow-sm"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className="max-w-[120px] truncate">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </Link>

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl border border-transparent hover:border-destructive/10 hover:bg-destructive/5 hover:text-destructive text-muted-foreground font-semibold flex items-center gap-1.5 h-9"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{locale === "vi" ? "Đăng xuất" : "Log Out"}</span>
                  </Button>
                </div>
              ) : (
                /* Guest State Display */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href={`/${locale}/login`}
                    className="text-sm font-semibold text-foreground hover:bg-accent/50 border border-transparent hover:border-border/60 px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    {t("common.login")}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    className="text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 px-5 py-2 rounded-xl transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1"
                  >
                    <span>{t("common.signup")}</span>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl h-10 w-10 border border-transparent hover:border-border/80"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {menuOpen && (
        <div className="border-t border-border/80 bg-background px-4 pb-5 pt-3 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2">
            <Link
              href={`/${locale}`}
              className="rounded-xl px-3 py-2 text-sm font-bold text-foreground hover:bg-muted/80 transition-all duration-150"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.home")}
            </Link>
            <Link
              href={`/${locale}/search`}
              className="rounded-xl px-3 py-2 text-sm font-bold text-foreground hover:bg-muted/80 transition-all duration-150"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.search")}
            </Link>
            <Link
              href={`/${locale}/my-bookings`}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-foreground hover:bg-muted/80 transition-all duration-150"
              onClick={() => setMenuOpen(false)}
            >
              <span>{locale === "vi" ? "Đơn đặt của tôi" : "My Bookings"}</span>
              {myBookings.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {myBookings.length}
                </span>
              )}
            </Link>
            <Link
              href={`/${locale}/wishlist`}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-foreground hover:bg-muted/80 transition-all duration-150"
              onClick={() => setMenuOpen(false)}
            >
              <span>{locale === "vi" ? "Yêu thích" : "Wishlist"}</span>
              {wishlist.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            {user && userRole === "supplier" && (
              <Link
                href={`/${locale}/partner`}
                className="rounded-xl px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5 transition-all duration-150 flex items-center gap-1.5"
                onClick={() => setMenuOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                {t("common.partnerPortal")}
              </Link>
            )}

            <div className="border-t border-border/60 my-2 pt-2" />

            {!loading && (
              <>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-foreground bg-accent/30 border border-border/40"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4 text-primary" />
                      <span>{user.user_metadata?.full_name || user.email}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/5 transition-all duration-150"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{locale === "vi" ? "Đăng xuất" : "Log Out"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/login`}
                      className="flex-1 text-center text-sm font-semibold text-foreground border border-border hover:bg-accent/40 py-2.5 rounded-xl transition-all duration-150"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("common.login")}
                    </Link>
                    <Link
                      href={`/${locale}/signup`}
                      className="flex-1 text-center text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/95 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("common.signup")}
                    </Link>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
