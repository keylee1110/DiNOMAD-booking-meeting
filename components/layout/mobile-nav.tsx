"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { Home, Search, CalendarDays, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

export function MobileNav() {
  const { locale, t } = useTranslation()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const links = [
    { href: `/${locale}`, label: t("common.home"), icon: Home },
    { href: `/${locale}/search`, label: t("common.search"), icon: Search },
    { href: `/${locale}/my-bookings`, label: t("common.myBookings"), icon: CalendarDays },
    { 
      href: user ? `/${locale}/profile` : `/${locale}/login`, 
      label: user ? (locale === "vi" ? "Cá nhân" : "Profile") : t("common.login"), 
      icon: UserIcon 
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around py-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== `/${locale}` && pathname.includes(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-0.5 text-[10px] font-bold tracking-tight transition-colors",
                isActive ? "text-primary scale-102" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 transition-transform" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
