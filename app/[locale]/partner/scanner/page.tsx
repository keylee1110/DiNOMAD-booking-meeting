"use client"

import { useTranslation } from "@/lib/i18n/context"
import { QrCode, Search, CheckCircle2, History } from "lucide-react"

export default function ScannerPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">QR Scanner</h1>
        <p className="border-l-4 border-primary pl-3 text-sm md:text-base font-medium text-muted-foreground md:border-l-4 md:pl-4 max-w-xl mx-auto md:mx-0">
          Scan customer check-in codes or verify manually.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="border-4 border-foreground bg-card p-6 md:p-10 flex flex-col items-center text-center shadow-[6px_6px_0px_0px_var(--color-primary)]">
             <div className="relative w-full max-w-[250px] aspect-square border-4 border-dashed border-primary bg-muted/20 flex items-center justify-center mb-8">
                <QrCode className="animate-pulse h-20 w-20 text-primary opacity-50" />
                <div className="absolute inset-x-0 top-1/2 h-1.5 bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.8)] -translate-y-1/2 animate-bounce"></div>
                {/* Scanner corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-foreground -translate-x-1 -translate-y-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-foreground translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-foreground -translate-x-1 translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-foreground translate-x-1 translate-y-1"></div>
             </div>
             <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Camera Active</h2>
             <p className="text-sm text-muted-foreground font-medium">Position the QR code within the frame to scan automatically.</p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
             <h3 className="font-black uppercase text-lg tracking-tighter border-b-2 border-foreground pb-2">Manual Entry</h3>
             <div className="flex gap-2">
               <input type="text" placeholder="Enter Booking ID (e.g. BK...)" className="flex-1 border-2 border-border p-4 font-black uppercase tracking-widest text-sm focus:outline-none focus:border-primary transition-colors" />
               <button className="bg-foreground text-background px-6 hover:bg-primary transition-colors flex items-center justify-center">
                  <Search className="h-5 w-5" />
               </button>
             </div>
          </div>

          <div className="flex flex-col gap-4">
             <h3 className="font-black uppercase text-lg tracking-tighter border-b-2 border-foreground pb-2 flex items-center gap-2">
               <History className="h-5 w-5 text-primary" /> Recent Scans
             </h3>
             <div className="flex flex-col gap-3">
               {[1, 2].map((i) => (
                 <div key={i} className="flex items-center gap-4 border-2 border-border p-4 opacity-80 hover:opacity-100 hover:border-foreground transition-all cursor-pointer">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-black text-sm uppercase tracking-wider">BK01{i} - Solo Nook {i === 1 ? 'A' : 'C'}</span>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Checked in at 14:{30 + i}</span>
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
