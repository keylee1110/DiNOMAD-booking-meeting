"use client"

import { useTranslation } from "@/lib/i18n/context"
import { LayoutDashboard, DoorOpen, QrCode, Building2, Bell, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

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
    <div className="flex h-screen flex-col md:flex-row bg-transparent antialiased overflow-hidden">
      {/* Mobile Header */}
      <header className="flex h-20 items-center justify-between border-b border-white/40 dark:border-white/10 bg-white/40 dark:bg-card/40 backdrop-blur-xl px-4 md:hidden shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="DiNOMAD Logo" width={32} height={32} className="object-contain" />
          <div className="font-bold text-xl tracking-tight text-foreground">DiNOMAD <span className="text-primary ml-1">Ops</span></div>
        </div>
        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-white/60 transition-all shadow-sm border border-transparent hover:border-white/50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
        </button>
      </header>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 z-50 flex w-full border-t border-white/40 dark:border-white/10 bg-white/60 dark:bg-card/60 backdrop-blur-2xl md:relative md:w-64 md:flex-col md:border-r md:border-t-0 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-transform">
        <div className="hidden h-20 items-center px-6 border-b border-white/40 dark:border-white/10 md:flex shrink-0">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="DiNOMAD Logo" width={36} height={36} className="object-contain" />
            <div className="font-bold tracking-tight text-xl text-foreground">
              DiNOMAD <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-1 text-sm font-bold">Ops</span>
            </div>
          </div>
        </div>
        
        <div className="flex w-full flex-row justify-around p-2 md:flex-col md:justify-start md:gap-3 md:p-6 overflow-y-auto">
          {navItems.map((item) => {
             const isActive = pathname === item.href
             return (
               <Link key={item.href} href={item.href} className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'text-muted-foreground hover:text-primary hover:bg-white/50 hover:shadow-sm font-medium'}`}>
                 <item.icon className="w-5 h-5 md:w-5 md:h-5 shrink-0" />
                 <span className="text-[10px] md:text-sm font-semibold">{item.label}</span>
               </Link>
             )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 relative min-w-0">
        <div className="mx-auto max-w-6xl p-4 md:p-8 lg:p-10 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
