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
    <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border shrink-0">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
      <div className="mt-auto p-3 border-t border-border bg-card shrink-0 z-10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/30">
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
