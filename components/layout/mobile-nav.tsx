"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { Home, Search, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const { locale, t } = useTranslation()
  const pathname = usePathname()

  const links = [
    { href: `/${locale}`, label: t("common.home"), icon: Home },
    { href: `/${locale}/search`, label: t("common.search"), icon: Search },
    { href: `/${locale}/booking/BK-20260301-001`, label: t("common.myBookings"), icon: CalendarDays },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around py-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href.includes("/search") && pathname.includes("/search"))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
