"use client"

import { useTranslation } from "@/lib/i18n/context"
import { QrCode, Search, CheckCircle2, History } from "lucide-react"

export default function ScannerPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">QR Scanner</h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto md:mx-0">
          Scan customer check-in codes or verify manually.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-10 flex flex-col items-center text-center shadow-sm">
             <div className="relative w-full max-w-[250px] aspect-square rounded-2xl border-2 border-dashed border-primary/40 bg-muted/20 flex items-center justify-center mb-8 overflow-hidden">
                <QrCode className="animate-pulse h-20 w-20 text-primary opacity-40" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)] -translate-y-1/2 animate-bounce"></div>
                {/* Scanner corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
             </div>
             <h2 className="text-lg font-semibold tracking-tight mb-2">Camera Active</h2>
             <p className="text-sm text-muted-foreground font-medium">Position the QR code within the frame to scan automatically.</p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
             <h3 className="font-semibold text-base uppercase tracking-wider text-foreground border-b border-border/40 pb-2">Manual Entry</h3>
             <div className="flex gap-2">
               <input type="text" placeholder="Enter Booking ID (e.g. BK...)" className="flex-1 rounded-xl border border-border/80 px-4 py-3 font-semibold text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent transition-all" />
               <button className="bg-primary hover:bg-primary/90 text-primary-foreground p-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center">
                  <Search className="h-5 w-5" />
               </button>
             </div>
          </div>

          <div className="flex flex-col gap-4">
             <h3 className="font-semibold text-base uppercase tracking-wider text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
               <History className="h-5 w-5 text-primary" /> Recent Scans
             </h3>
             <div className="flex flex-col gap-3">
               {[1, 2].map((i) => (
                 <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 p-4 transition-all duration-300 hover:border-primary/40 hover:bg-muted/10 shadow-sm cursor-pointer bg-card">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground">BK01{i} - Solo Nook {i === 1 ? 'A' : 'C'}</span>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Checked in at 14:{30 + i}</span>
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
