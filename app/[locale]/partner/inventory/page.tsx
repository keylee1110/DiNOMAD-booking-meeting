"use client"

import { useTranslation } from "@/lib/i18n/context"
import { InventoryToggle } from "@/components/partner/inventory-toggle"
import { Clock } from "lucide-react"

export default function InventoryPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Live Inventory</h1>
        <p className="text-base text-muted-foreground max-w-xl">
          Manage real-time availability and walk-in blocks in Strict Mode.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
           <Clock className="h-5 w-5 text-primary" /> All Rooms (Today)
        </h2>
        <div className="flex flex-col gap-6">
          <InventoryToggle roomName="Solo Nook A" roomId="1" />
          <InventoryToggle roomName="Solo Nook B" roomId="2" />
          <InventoryToggle roomName="Team Hub A" roomId="3" />
        </div>
        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider text-center mt-4">Updates synchronize globally in real-time</p>
      </div>
    </div>
  )
}
