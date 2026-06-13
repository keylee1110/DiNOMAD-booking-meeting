"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { InventoryToggle } from "@/components/partner/inventory-toggle"
import { Clock, Loader2 } from "lucide-react"
import { getPartnerVenues, type ApiRoom, type ApiVenue } from "@/lib/api/partner"
import { toast } from "sonner"

interface FlatRoom {
  id: string
  name: string
  venueName: string
  status: string
}

function flattenToRooms(venues: ApiVenue[]): FlatRoom[] {
  return venues.flatMap(v =>
    v.rooms
      .filter(r => r.status !== "archived")
      .map(r => ({
        id: r.id,
        name: r.name,
        venueName: v.name,
        status: r.status,
      }))
  )
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState<FlatRoom[]>([])
  const [loading, setLoading] = useState(true)

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const venues = await getPartnerVenues()
      setRooms(flattenToRooms(venues))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load rooms"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

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

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading rooms...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-16 text-center gap-3">
            <Clock className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">No rooms yet</p>
            <p className="text-xs text-muted-foreground">Add rooms in the Venues page first.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {rooms.map(room => (
              <InventoryToggle
                key={room.id}
                roomId={room.id}
                roomName={`${room.name} · ${room.venueName}`}
                initialDbStatus={room.status}
              />
            ))}
          </div>
        )}

        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider text-center mt-4">
          Updates synchronize globally in real-time
        </p>
      </div>
    </div>
  )
}
