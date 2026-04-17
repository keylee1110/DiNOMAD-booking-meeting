"use client"

import { Bell, Search } from "lucide-react"

export function AdminHeader() {
  return (
    <header className="h-20 border-b border-white/40 dark:border-white/10 bg-white/40 dark:bg-card/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search bookings, users, rooms..."
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/60 dark:bg-muted/50 border border-white/50 dark:border-border/50 rounded-2xl outline-none focus:bg-white focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-white/60 transition-all shadow-sm border border-transparent hover:border-white/50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
        </button>
        <div className="h-8 w-px bg-border/50" />
        <div className="flex items-center gap-3 pl-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <span className="text-primary font-bold text-sm">A</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold text-foreground leading-none">Admin</span>
            <span className="text-[11px] text-muted-foreground mt-1">Superuser</span>
          </div>
        </div>
      </div>
    </header>
  )
}
