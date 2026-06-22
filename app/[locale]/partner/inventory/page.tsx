"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { InventoryToggle } from "@/components/partner/inventory-toggle"
import { Clock, MapPin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react"
import { getPartnerVenues, type ApiVenue } from "@/lib/api/partner"
import { toast } from "sonner"

// ─── Date helpers ─────────────────────────────────────────────────────────────
function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function isoOffset(base: string, days: number): string {
  const d = new Date(base + "T00:00:00")
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function formatDateFull(iso: string): string {
  const today = isoToday()
  const d = new Date(iso + "T00:00:00")
  const long = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  if (iso === today) return `${long} · Today`
  if (iso === isoOffset(today, 1)) return `${long} · Tomorrow`
  if (iso === isoOffset(today, -1)) return `${long} · Yesterday`
  return long
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VenueGroup {
  venueId: string
  venueName: string
  rooms: { id: string; name: string; status: string }[]
}

function groupByVenue(venues: ApiVenue[]): VenueGroup[] {
  return venues
    .filter(v => v.rooms.some(r => r.status !== "archived"))
    .map(v => ({
      venueId: v.id,
      venueName: v.name,
      rooms: v.rooms
        .filter(r => r.status !== "archived")
        .map(r => ({ id: r.id, name: r.name, status: r.status })),
    }))
}

// ─── Date nav bar ─────────────────────────────────────────────────────────────
function DateNav({
  selectedDate,
  onSelect,
}: {
  selectedDate: string
  onSelect: (date: string) => void
}) {
  const today = isoToday()
  const isToday = selectedDate === today
  const dateInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-3 py-2.5 shadow-sm">
      {/* Prev day */}
      <button
        onClick={() => onSelect(isoOffset(selectedDate, -1))}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-background hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Date pill — click opens native picker */}
      <button
        onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
        className="relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5 bg-muted/30 hover:bg-muted/60 border border-border/40 hover:border-border transition-colors group"
      >
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground truncate">
          {formatDateFull(selectedDate)}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          change ▾
        </span>
        {/* Hidden native date input */}
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={e => e.target.value && onSelect(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          aria-label="Pick a date"
        />
      </button>

      {/* Next day */}
      <button
        onClick={() => onSelect(isoOffset(selectedDate, 1))}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-background hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Today snap — only when not on today */}
      {!isToday && (
        <button
          onClick={() => onSelect(today)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15 transition-colors text-[11px] font-bold shrink-0 animate-in fade-in duration-150"
        >
          <RotateCcw className="h-3 w-3" />
          Today
        </button>
      )}
    </div>
  )
}

// ─── Venue section ────────────────────────────────────────────────────────────
function VenueSection({
  group,
  globalDate,
}: {
  group: VenueGroup
  globalDate: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const availableCount = group.rooms.filter(r => r.status === "published").length
  const blockedCount = group.rooms.filter(r => r.status === "unavailable").length

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-3 py-2 text-left group"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-bold text-foreground text-sm tracking-tight truncate">{group.venueName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {availableCount > 0 && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              {availableCount} open
            </span>
          )}
          {blockedCount > 0 && (
            <span className="text-[10px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-2 py-0.5">
              {blockedCount} blocked
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
        </div>
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-3 pl-4 border-l-2 border-primary/10">
          {group.rooms.map(room => (
            <InventoryToggle
              key={room.id}
              roomId={room.id}
              roomName={room.name}
              initialDbStatus={room.status}
              globalDate={globalDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { t } = useTranslation()
  const [venueGroups, setVenueGroups] = useState<VenueGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [globalDate, setGlobalDate] = useState(isoToday())

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const venues = await getPartnerVenues()
      setVenueGroups(groupByVenue(venues))
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load rooms")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

  const stats = useMemo(() => {
    const all = venueGroups.flatMap(g => g.rooms)
    return {
      total: all.length,
      available: all.filter(r => r.status === "published").length,
      blocked: all.filter(r => r.status === "unavailable").length,
    }
  }, [venueGroups])

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {t("partner.inventoryTitle")}
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">
          {t("partner.inventorySubtitle")}
        </p>
      </div>

      {/* Stat bar */}
      {!loading && venueGroups.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("partner.statTotalRooms"), value: stats.total, style: "bg-muted/40 border-border/50 text-foreground" },
            { label: t("partner.statAvailable"), value: stats.available, style: "bg-emerald-500/5 border-emerald-500/20 text-emerald-700" },
            { label: t("partner.statBlocked"), value: stats.blocked, style: "bg-destructive/5 border-destructive/20 text-destructive" },
          ].map(s => (
            <div key={s.label} className={`flex flex-col items-center justify-center rounded-2xl border p-4 gap-1 ${s.style}`}>
              <span className="text-2xl font-bold leading-none">{s.value}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70 text-center mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Date nav */}
        <DateNav selectedDate={globalDate} onSelect={setGlobalDate} />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Room list */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : venueGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-16 text-center gap-3">
            <Clock className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">{t("partner.noRoomsYet")}</p>
            <p className="text-xs text-muted-foreground">{t("partner.noRoomsDesc")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {venueGroups.map(group => (
              <VenueSection key={group.venueId} group={group} globalDate={globalDate} />
            ))}
          </div>
        )}

        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider text-center pt-2">
          {t("partner.inventorySyncNote")}
        </p>
      </div>
    </div>
  )
}
