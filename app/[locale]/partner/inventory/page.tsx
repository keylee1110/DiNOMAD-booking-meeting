"use client"

import { useTranslation } from "@/lib/i18n/context"
import { InventoryToggle } from "@/components/partner/inventory-toggle"
import { Clock } from "lucide-react"

export default function InventoryPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Live Inventory</h1>
        <p className="border-l-4 border-primary pl-3 text-sm md:text-base font-medium text-muted-foreground max-w-xl">
          Manage real-time availability and walk-in blocks in Strict Mode.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-black uppercase border-b-2 border-foreground pb-2 flex items-center gap-2 tracking-tighter">
           <Clock className="h-6 w-6 text-primary" /> All Rooms (Today)
        </h2>
        <div className="flex flex-col gap-6">
          <InventoryToggle roomName="Solo Nook A" roomId="1" />
          <InventoryToggle roomName="Solo Nook B" roomId="2" />
          <InventoryToggle roomName="Team Hub A" roomId="3" />
        </div>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-center mt-4">Updates synchronize globally in real-time</p>
      </div>
    </div>
  )
}
