"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X, CalendarDays } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useBooking } from "@/lib/store/booking-store"

export function Header() {
  const { locale, t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { myBookings } = useBooking()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-transparent">
            <Image 
              src="/logo.png" 
              alt="DiNOMAD Logo" 
              width={40} 
              height={40} 
              className="object-contain h-full w-auto"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Di<span className="text-primary">NOMAD</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.home")}
          </Link>
          <Link
            href={`/${locale}/search`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.search")}
          </Link>
          <Link
            href={`/${locale}/my-bookings`}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {locale === "vi" ? "Đơn đặt" : "Bookings"}
            {myBookings.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {myBookings.length}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <LanguageSwitcher />
          <Link
            href={`/${locale}/login`}
            className="hidden md:flex text-sm font-semibold text-primary transition-all border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 px-5 py-2 rounded-xl items-center justify-center whitespace-nowrap shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("common.login")}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href={`/${locale}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.home")}
            </Link>
            <Link
              href={`/${locale}/search`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.search")}
            </Link>
            <Link
              href={`/${locale}/my-bookings`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
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
              href={`/${locale}/login`}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.login")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
