"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import {
  CalendarCheck, Search, Filter, Users, MapPin,
  Check, X, LogIn, LogOut, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPartnerBookings, updatePartnerBookingStatus, type PartnerBooking } from "@/lib/api/partner"
import { toast } from "sonner"

function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isoOffset(base: string, days: number): string {
  const d = new Date(base + "T00:00:00")
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDateHeader(iso: string): string {
  const today = isoToday()
  const d = new Date(iso + "T00:00:00")
  const base = d.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  if (iso === today) return `Today — ${base}`
  if (iso === isoOffset(today, 1)) return `Tomorrow — ${base}`
  if (iso === isoOffset(today, -1)) return `Yesterday — ${base}`
  return base
}

const STATUS_CONFIG: Record<string, { label: string; border: string; text: string; bg: string }> = {
  confirmed:  { label: "Confirmed",   border: "border-primary/20",         text: "text-primary",         bg: "bg-primary/10" },
  arriving:   { label: "Arriving",    border: "border-orange-500/20",      text: "text-orange-600",      bg: "bg-orange-500/5" },
  checked_in: { label: "Active",      border: "border-emerald-500/20",     text: "text-emerald-700",     bg: "bg-emerald-500/5" },
  completed:  { label: "Done",        border: "border-border/40",          text: "text-muted-foreground", bg: "bg-muted" },
  cancelled:  { label: "Cancelled",   border: "border-destructive/20",     text: "text-destructive",     bg: "bg-destructive/5" },
  pending:    { label: "Pending",     border: "border-border",             text: "text-muted-foreground", bg: "bg-background" },
  no_show:    { label: "No-show",     border: "border-red-200",            text: "text-red-600",         bg: "bg-red-50/50" },
}

export default function SchedulePage() {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(isoToday())
  const [filterMode, setFilterMode] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [bookings, setBookings] = useState<PartnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPartnerBookings(selectedDate)
      setBookings(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => { loadBookings() }, [loadBookings])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      await updatePartnerBookingStatus(id, newStatus)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      toast.success(`Booking updated to ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setUpdating(null)
    }
  }

  const filteredBookings = bookings.filter(b => {
    const matchesTab = filterMode === "all" || b.status === filterMode
    const matchesSearch = !searchQuery ||
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.roomName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const statusCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1
    return acc
  }, {})

  const tabs = [
    { id: "all",        label: `All (${bookings.length})` },
    { id: "arriving",   label: `Arriving (${statusCounts["arriving"] ?? 0})` },
    { id: "checked_in", label: `Active (${statusCounts["checked_in"] ?? 0})` },
    { id: "confirmed",  label: `Confirmed (${statusCounts["confirmed"] ?? 0})` },
    { id: "pending",    label: `Pending (${statusCounts["pending"] ?? 0})` },
    { id: "completed",  label: `Done (${statusCounts["completed"] ?? 0})` },
  ]

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-primary hidden md:block" />
            {t("partner.scheduleTitle")}
          </h1>
          <p className="text-base text-muted-foreground font-medium">
            {formatDateHeader(selectedDate)}
          </p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date navigation */}
          <div className="flex items-center rounded-xl border border-border/80 bg-background shadow-sm overflow-hidden">
            <button
              onClick={() => setSelectedDate(prev => isoOffset(prev, -1))}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-9 px-2 text-xs font-semibold bg-transparent text-foreground border-x border-border/60 focus:outline-none focus:ring-0 w-[130px] text-center"
            />
            <button
              onClick={() => setSelectedDate(prev => isoOffset(prev, 1))}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ID, name, room..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-xl border border-border/85 bg-background pl-9 pr-4 py-2 font-semibold text-xs md:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent transition-all w-44 md:w-56"
            />
          </div>

          {/* Today shortcut */}
          {selectedDate !== isoToday() && (
            <button
              onClick={() => setSelectedDate(isoToday())}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-xl px-3 py-2 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" /> Today
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-medium">{error}</span>
          <button onClick={loadBookings} className="ml-auto text-xs underline font-semibold">Retry</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/40">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterMode(tab.id)}
            className={`px-4 py-2 font-semibold text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${
              filterMode === tab.id
                ? "border-primary text-foreground bg-primary/10"
                : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredBookings.map(b => {
            const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG["pending"]
            const isUpdating = updating === b.id
            return (
              <div
                key={b.id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl border ${
                  b.status === "checked_in"
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : b.status === "completed" || b.status === "cancelled"
                      ? "border-border/40 bg-muted/20 opacity-70 hover:opacity-100"
                      : "border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)]"
                } hover:-translate-y-0.5 transition-all gap-4 md:gap-6`}
              >
                {/* Left info */}
                <div className="flex items-start gap-4 md:gap-6">
                  <div className={`p-2.5 md:px-3 md:py-2.5 rounded-xl border font-semibold text-sm md:text-base whitespace-nowrap flex flex-col items-center justify-center min-w-[70px] ${
                    b.status === "checked_in"
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-muted border-border/60 text-muted-foreground"
                  }`}>
                    <span className="font-bold">{b.startTime}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">{b.endTime}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className={`font-semibold text-base md:text-lg tracking-tight ${
                      b.status === "completed" || b.status === "cancelled"
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}>
                      {b.roomName}
                    </span>
                    <span className="text-sm text-foreground flex items-center gap-1.5 font-semibold mt-1">
                      <Users className="h-4 w-4 text-primary" /> {b.guestName}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1 bg-background px-2.5 py-1 rounded-lg border border-border/60 w-max shadow-sm">
                      <MapPin className="h-3 w-3" /> {b.bookingCode}
                    </span>
                  </div>
                </div>

                {/* Right: status + actions */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:self-center mt-2 md:mt-0 w-full lg:w-auto">
                  <span className={`px-3.5 py-1 border rounded-full text-[10px] md:text-xs font-semibold tracking-tight uppercase self-start md:self-center min-w-[100px] text-center ${cfg.border} ${cfg.text} ${cfg.bg}`}>
                    {cfg.label}
                  </span>

                  <div className="flex gap-3 w-full sm:w-auto">
                    {isUpdating && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                      </div>
                    )}

                    {!isUpdating && b.status === "pending" && (
                      <>
                        <Button onClick={() => handleStatusChange(b.id, "confirmed")} className="font-semibold rounded-xl w-full sm:w-[130px] shadow-sm flex items-center justify-center gap-1.5">
                          <Check className="h-4 w-4" /> Confirm
                        </Button>
                        <Button onClick={() => handleStatusChange(b.id, "cancelled")} variant="destructive" className="font-semibold rounded-xl w-full sm:w-[130px] shadow-sm flex items-center justify-center gap-1.5">
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}

                    {!isUpdating && b.status === "confirmed" && (
                      <Button onClick={() => handleStatusChange(b.id, "arriving")} variant="outline" className="font-semibold rounded-xl w-full sm:w-[160px] shadow-sm bg-transparent border-border hover:bg-muted/80 flex items-center justify-center gap-1.5">
                        <Clock className="h-4 w-4" /> Mark Arriving
                      </Button>
                    )}

                    {!isUpdating && b.status === "arriving" && (
                      <Button onClick={() => handleStatusChange(b.id, "checked_in")} className="font-semibold rounded-xl w-full sm:w-[160px] shadow-sm flex items-center justify-center gap-1.5">
                        <LogIn className="h-4 w-4" /> Check-in
                      </Button>
                    )}

                    {!isUpdating && b.status === "checked_in" && (
                      <Button onClick={() => handleStatusChange(b.id, "completed")} className="font-semibold rounded-xl w-full sm:w-[160px] shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5">
                        <LogOut className="h-4 w-4" /> Check-out
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredBookings.length === 0 && !loading && (
            <div className="p-12 rounded-2xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-center bg-muted/10 h-48">
              <span className="text-muted-foreground font-semibold text-lg md:text-xl mb-2">No bookings found</span>
              <span className="text-muted-foreground text-xs md:text-sm font-semibold tracking-tight bg-background px-4 py-2 rounded-xl border border-border/80 shadow-sm">
                {filterMode === "all" ? "No bookings for this date" : "Try checking a different status tab"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
