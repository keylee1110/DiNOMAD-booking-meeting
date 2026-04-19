"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X, LogOut, User } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/store/booking-store"
import { useUser, getDiceBearUrl } from "@/lib/store/user-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { locale, t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { myBookings } = useBooking()
  const { user, logout } = useUser()

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-sm shadow-black/5">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/5 transition-transform duration-300 group-hover:scale-105">
            <Image src="/logo.png" alt="DiNOMAD Logo" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Di<span className="text-primary group-hover:text-foreground">NOMAD</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href={`/${locale}`} className="text-sm font-semibold text-muted-foreground transition-all duration-300 hover:text-primary relative group">
            {t("common.home")}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/search`} className="text-sm font-semibold text-muted-foreground transition-all duration-300 hover:text-primary relative group">
            {t("common.search")}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/my-bookings`} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:text-primary relative group">
            {locale === "vi" ? "Đơn đặt" : "Bookings"}
            {myBookings.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/20">
                {myBookings.length}
              </span>
            )}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* User Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative rounded-full ring-2 ring-transparent hover:ring-primary/30 transition-all duration-200 focus:outline-none focus:ring-primary/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDiceBearUrl(user.seed)}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover bg-primary/5"
                  />
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 ring-2 ring-background" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-border/50 bg-white/90 backdrop-blur-xl">
                <DropdownMenuLabel className="flex items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDiceBearUrl(user.seed)}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full bg-primary/5"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate capitalize">{user.name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/my-bookings`} className="flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {locale === "vi" ? "Đơn đặt của tôi" : "My Bookings"}
                    {myBookings.length > 0 && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {myBookings.length}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>

                {user.role === "partner" && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/partner`} className="cursor-pointer rounded-xl px-3 py-2">
                      Partner Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer rounded-xl px-3 py-2 mb-1"
                >
                  <LogOut className="h-4 w-4" />
                  {locale === "vi" ? "Đăng xuất" : "Log Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="hidden md:flex h-10 items-center justify-center px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
            >
              Log In
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl hover:bg-primary/5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="absolute top-[80px] left-0 w-full animate-in slide-in-from-top-4 duration-300 md:hidden overflow-hidden border-b border-border bg-white/95 backdrop-blur-2xl shadow-2xl z-40">
          <nav className="flex flex-col gap-1 p-4">
            <Link href={`/${locale}`} className="flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
              {t("common.home")}
            </Link>
            <Link href={`/${locale}/search`} className="flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
              {t("common.search")}
            </Link>
            <Link href={`/${locale}/my-bookings`} className="flex items-center justify-between rounded-2xl p-4 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
              <span>{locale === "vi" ? "Đơn đặt của tôi" : "My Bookings"}</span>
              {myBookings.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {myBookings.length}
                </span>
              )}
            </Link>

            {/* Mobile user section */}
            {user ? (
              <div className="p-4 flex items-center gap-3 mt-2 border-t border-border/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getDiceBearUrl(user.seed)} alt={user.name} className="h-9 w-9 rounded-full bg-primary/5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold capitalize truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <button onClick={() => { logout(); setMenuOpen(false) }} className="text-xs font-semibold text-destructive hover:underline">
                  {locale === "vi" ? "Đăng xuất" : "Log Out"}
                </button>
              </div>
            ) : (
              <div className="p-4 flex gap-4 mt-2">
                <LanguageSwitcher />
                <Link href={`/${locale}/login`} className="flex-1 flex h-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-sm" onClick={() => setMenuOpen(false)}>
                  Log In
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
