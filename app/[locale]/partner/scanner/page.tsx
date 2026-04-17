"use client"

import { useTranslation } from "@/lib/i18n/context"
import { QrCode, Search, CheckCircle2, History } from "lucide-react"

export default function ScannerPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-3 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">QR Scanner</h1>
        <p className="text-sm md:text-base font-medium text-muted-foreground w-full max-w-xl mx-auto md:mx-0">
          Scan customer check-in codes or verify manually.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center shadow-lg">
             <div className="relative w-full max-w-[280px] aspect-square rounded-3xl border-2 border-primary/20 bg-white/40 dark:bg-muted/10 backdrop-blur-md flex items-center justify-center mb-8 shadow-inner overflow-hidden">
                <QrCode className="animate-pulse h-24 w-24 text-primary opacity-40" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_15px_rgba(255,182,193,0.8)] -translate-y-1/2 animate-bounce"></div>
                {/* Scanner corners soft */}
                <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl opacity-70"></div>
                <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl opacity-70"></div>
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl opacity-70"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-70"></div>
             </div>
             <h2 className="text-2xl font-bold tracking-tight mb-3">Camera Active</h2>
             <p className="text-sm text-muted-foreground font-medium">Position the QR code within the frame to scan automatically.</p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5 bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
             <h3 className="font-bold text-xl tracking-tight border-b border-white/40 dark:border-white/10 pb-4">Manual Entry</h3>
             <div className="flex gap-3">
               <input type="text" placeholder="Enter Booking ID (e.g. BK...)" className="flex-1 bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 p-3.5 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm" />
               <button className="bg-primary text-primary-foreground px-6 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm active:-translate-y-0.5 flex items-center justify-center">
                  <Search className="h-5 w-5" />
               </button>
             </div>
          </div>

          <div className="flex flex-col gap-5 bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
             <h3 className="font-bold text-xl tracking-tight border-b border-white/40 dark:border-white/10 pb-4 flex items-center gap-2">
               <History className="h-5 w-5 text-primary" /> Recent Scans
             </h3>
             <div className="flex flex-col gap-3">
               {[1, 2].map((i) => (
                 <div key={i} className="flex items-center gap-4 border border-white/40 dark:border-white/5 bg-white/40 dark:bg-muted/10 p-4 rounded-xl opacity-80 hover:opacity-100 hover:bg-white/60 dark:hover:bg-muted/30 transition-all cursor-pointer shadow-sm">
                    <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-base text-foreground">BK01{i} - Solo Nook {i === 1 ? 'A' : 'C'}</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checked in at 14:{30 + i}</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
