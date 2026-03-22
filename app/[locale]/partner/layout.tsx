"use client"

import { useTranslation } from "@/lib/i18n/context"
import { LayoutDashboard, DoorOpen, QrCode, Building2, Bell, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useTranslation()
  const pathname = usePathname()

  const navItems = [
    { href: `/${locale}/partner`, icon: LayoutDashboard, label: "Dashboard" },
    { href: `/${locale}/partner/schedule`, icon: CalendarCheck, label: "Schedule" },
    { href: `/${locale}/partner/inventory`, icon: DoorOpen, label: "Inventory" },
    { href: `/${locale}/partner/venues`, icon: Building2, label: "Venues" },
    { href: `/${locale}/partner/scanner`, icon: QrCode, label: "Scan QR" },
  ]

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background font-sans">
      {/* Mobile Header */}
      <header className="flex h-16 items-center justify-between border-b-2 border-primary bg-card px-4 md:hidden shrink-0">
        <div className="font-black uppercase tracking-tighter text-xl">DiNOMAD <span className="text-primary">Ops</span></div>
        <button className="relative flex h-10 w-10 items-center justify-center border-2 border-transparent hover:border-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background"></span>
        </button>
      </header>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 z-50 flex w-full border-t-2 border-primary bg-card md:relative md:w-64 md:flex-col md:border-r-2 md:border-t-0 md:bg-background shrink-0 transition-transform">
        <div className="hidden h-[88px] items-center px-6 border-b-2 border-primary md:flex shrink-0">
          <div className="font-black uppercase tracking-tighter text-2xl">
            DiNOMAD <span className="bg-primary text-primary-foreground px-1.5 ml-1 pt-0.5 -rotate-2 inline-block">Ops</span>
          </div>
        </div>
        
        <div className="flex w-full flex-row justify-around p-2 md:flex-col md:justify-start md:gap-3 md:p-6 overflow-y-auto">
          {navItems.map((item) => {
             const isActive = pathname === item.href
             return (
               <Link key={item.href} href={item.href} className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:px-4 md:py-3.5 transition-all ${isActive ? 'bg-primary text-primary-foreground font-black border-2 border-foreground md:shadow-[4px_4px_0px_0px_var(--color-foreground)] -translate-y-0.5' : 'text-muted-foreground hover:text-foreground font-bold border-2 border-transparent hover:border-border hover:bg-muted/50'}`}>
                 <item.icon className="h-5 w-5 md:h-[22px] md:w-[22px]" />
                 <span className="text-[10px] md:text-[13px] uppercase tracking-wider">{item.label}</span>
               </Link>
             )
          })}
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
