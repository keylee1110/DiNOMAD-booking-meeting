"use client"

import { useTranslation } from "@/lib/i18n/context"
import { InventoryToggle } from "@/components/partner/inventory-toggle"
import { Clock } from "lucide-react"

export default function InventoryPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Live Inventory</h1>
        <p className="text-sm md:text-base font-medium text-muted-foreground w-full max-w-xl">
          Manage real-time availability and walk-in blocks in Strict Mode.
        </p>
      </div>

      <div className="flex flex-col gap-6 bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2 tracking-tight">
           <Clock className="h-5 w-5 text-primary" /> All Rooms (Today)
        </h2>
        <div className="flex flex-col gap-6">
          <InventoryToggle roomName="Solo Nook A" roomId="1" />
          <InventoryToggle roomName="Solo Nook B" roomId="2" />
          <InventoryToggle roomName="Team Hub A" roomId="3" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground text-center mt-4 bg-muted/40 py-2 rounded-lg">Updates synchronize globally in real-time</p>
      </div>
    </div>
  )
}
