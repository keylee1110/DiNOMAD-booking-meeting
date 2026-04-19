"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  DoorOpen,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "admin",
    icon: LayoutDashboard,
  },
  {
    label: "Manage Rooms",
    href: "admin/rooms",
    icon: DoorOpen,
  },
  {
    label: "Bookings",
    href: "admin/bookings",
    icon: CalendarCheck,
  },
  {
    label: "Users",
    href: "admin/users",
    icon: Users,
  },
  {
    label: "Suppliers",
    href: "admin/suppliers",
    icon: Building2,
  },
  {
    label: "Analytics",
    href: "admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white/60 dark:bg-card/60 backdrop-blur-2xl border-r border-white/40 dark:border-white/10 flex flex-col shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20">
      {/* Logo */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-white/40 dark:border-white/10 shrink-0">
        <Image src="/logo.png" alt="DiNOMAD Logo" width={32} height={32} className="object-contain" />
        <div>
          <p className="font-bold text-foreground text-sm leading-tight">DiNOMAD</p>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const fullHref = `/${locale}/${item.href}`
            const isActive = item.href === "admin"
              ? pathname === `/${locale}/admin`
              : pathname.startsWith(fullHref)

            return (
              <li key={item.href}>
                <Link
                  href={fullHref}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 hover:shadow-sm"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-white/40 dark:border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/40 dark:bg-muted/30 border border-white/50 hover:bg-white/60 transition-colors shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-xs">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@dinomad.vn</p>
          </div>
          <button className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
