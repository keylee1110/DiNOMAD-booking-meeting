"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Check, X, Loader2, CalendarDays, SquareCheck, SquareX, Square, Lock, History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n/context"
import { updateRoomStatus, getRoomSlots, updateSlotStatuses } from "@/lib/api/partner"
import { toast } from "sonner"
import type { TimeSlot, RoomStatusReason, RoomStatusEntry } from "@/lib/types"

// ─── Props ───────────────────────────────────────────────────────────────────
interface InventoryToggleProps {
  roomId?: string
  roomName?: string
  /** DB status from API: "published" | "unavailable" | "draft" */
  initialDbStatus?: string
  /** Global date set from the parent week-strip — overrides internal date when provided */
  globalDate?: string
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dbStatusToUi(dbStatus?: string): "available" | "busy" {
  return dbStatus === "unavailable" ? "busy" : "available"
}

function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isoOffset(base: string, days: number): string {
  const d = new Date(base + "T00:00:00")
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDateLabel(iso: string): string {
  const today = isoToday()
  const d = new Date(iso + "T00:00:00")
  const base = d.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })
  if (iso === today) return `${base} · Today`
  if (iso === isoOffset(today, 1)) return `${base} · Tomorrow`
  if (iso === isoOffset(today, -1)) return `${base} · Yesterday`
  return base
}

// ─── Slot status helpers ──────────────────────────────────────────────────────
function slotKind(slot: TimeSlot): "booked" | "blocked" | "free" {
  if (slot.id.startsWith("booked-")) return "booked"
  if (!slot.available) return "blocked"
  return "free"
}

// ─── Timeline strip ───────────────────────────────────────────────────────────
interface TimelineStripProps {
  slots: TimeSlot[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  disabled: boolean
}

function TimelineStrip({ slots, selectedIds, onToggle, disabled }: TimelineStripProps) {
  if (slots.length === 0) return null

  // Tooltip state
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Compute hour boundaries for ruler
  const firstHour = parseInt(slots[0].startTime.split(":")[0], 10)
  const lastHour  = parseInt(slots[slots.length - 1].endTime?.split(":")[0] ?? slots[slots.length - 1].startTime.split(":")[0], 10) + 1
  const totalHours = lastHour - firstHour

  return (
    <div className="flex flex-col gap-2 select-none">
      {/* Hour ruler */}
      <div
        className="relative flex"
        style={{ paddingLeft: 0 }}
      >
        {Array.from({ length: totalHours + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute text-[9px] font-semibold text-muted-foreground/60 -translate-x-1/2"
            style={{ left: `${(i / totalHours) * 100}%` }}
          >
            {String(firstHour + i).padStart(2, "0")}
          </div>
        ))}
        <div className="h-3" /> {/* spacer */}
      </div>

      {/* Timeline bar */}
      <div className="relative flex rounded-xl overflow-hidden h-10 border border-border/40 shadow-sm">
        {slots.map((slot, idx) => {
          const kind = slotKind(slot)
          const isSelected = selectedIds.has(slot.id)
          const isHovered = hoveredId === slot.id
          const canClick = !disabled && kind !== "booked"

          const baseClass = (() => {
            if (isSelected) return "bg-primary"
            if (kind === "booked") return "bg-amber-400/70"
            if (kind === "blocked") return "bg-destructive/50"
            return "bg-emerald-500/25 hover:bg-emerald-500/40"
          })()

          return (
            <div
              key={slot.id}
              className="relative flex-1 flex items-center justify-center transition-all duration-150"
              style={{ minWidth: 0 }}
            >
              <button
                onClick={() => canClick && onToggle(slot.id)}
                onMouseEnter={() => setHoveredId(slot.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={!canClick}
                className={`
                  w-full h-full flex items-center justify-center transition-colors
                  ${baseClass}
                  ${canClick ? "cursor-pointer" : "cursor-default"}
                  ${isSelected ? "ring-2 ring-primary ring-inset" : ""}
                `}
                aria-label={`${slot.startTime}–${slot.endTime ?? ""} · ${kind}`}
              >
                {isSelected && <Check className="h-3 w-3 text-primary-foreground opacity-80 shrink-0" />}
                {kind === "booked" && <span className="text-[8px] font-bold text-amber-800 opacity-60 leading-none">●</span>}
              </button>

              {/* Segment divider */}
              {idx < slots.length - 1 && (
                <div className="absolute right-0 top-1 bottom-1 w-px bg-background/50 z-10" />
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-semibold whitespace-nowrap shadow-lg pointer-events-none">
                  {slot.startTime}–{slot.endTime ?? ""}
                  <span className="ml-1 opacity-60">
                    {kind === "booked" ? "Booked" : kind === "blocked" ? "Blocked" : "Free"}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1">
        {[
          { color: "bg-emerald-500/30 border-emerald-500/30", label: "Free" },
          { color: "bg-amber-400/70 border-amber-400/50", label: "Booked" },
          { color: "bg-destructive/50 border-destructive/30", label: "Blocked" },
          { color: "bg-primary border-primary", label: "Selected" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-4 rounded-sm border ${l.color}`} />
            <span className="text-[10px] font-semibold text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InventoryToggle({
  roomId = "1",
  roomName = "Room A",
  initialDbStatus,
  globalDate,
  className,
}: InventoryToggleProps) {
  const { t } = useTranslation()

  // Date — synced from globalDate prop when provided
  const [selectedDate, setSelectedDate] = useState(globalDate ?? isoToday())
  useEffect(() => {
    if (globalDate) {
      setSelectedDate(globalDate)
      setSelectedIds(new Set())
    }
  }, [globalDate])

  const [expanded, setExpanded] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [roomStatus, setRoomStatus] = useState<"available" | "busy">(dbStatusToUi(initialDbStatus))
  const [hydrated, setHydrated] = useState(initialDbStatus !== undefined)
  const [showReasonPanel, setShowReasonPanel] = useState(false)
  const [pendingReason, setPendingReason] = useState<RoomStatusReason | "">("")
  const [toggling, setToggling] = useState(false)

  // Undo ref — stores previous slots + a cleanup fn for the timeout
  const undoRef = useRef<{ prevSlots: TimeSlot[]; timeoutId: ReturnType<typeof setTimeout> } | null>(null)

  const minDate = isoOffset(isoToday(), -7)
  const maxDate = isoOffset(isoToday(), 30)

  // Hydrate room status
  useEffect(() => {
    if (initialDbStatus !== undefined) {
      setRoomStatus(dbStatusToUi(initialDbStatus))
      setHydrated(true)
      return
    }
    const stored: Record<string, RoomStatusEntry> = JSON.parse(
      localStorage.getItem("dinomad_room_status") || "{}"
    )
    const entry = stored[roomId]
    if (entry) setRoomStatus(entry.status)
    setHydrated(true)
  }, [roomId, initialDbStatus])

  // Load slots
  const loadSlots = useCallback(() => {
    let cancelled = false
    setSlotsLoading(true)
    setSlots([])
    getRoomSlots(roomId, selectedDate)
      .then(apiSlots => {
        if (cancelled) return
        setSlots(apiSlots.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          available: s.available,
          price: 0,
        })))
      })
      .catch(() => { if (!cancelled) setSlots([]) })
      .finally(() => { if (!cancelled) setSlotsLoading(false) })
    return () => { cancelled = true }
  }, [roomId, selectedDate])

  useEffect(() => { if (expanded) return loadSlots() }, [expanded, loadSlots])

  // Date navigation (only when not driven by globalDate)
  const changeDate = (delta: number) => {
    const next = isoOffset(selectedDate, delta)
    if (next < minDate || next > maxDate) return
    setSelectedDate(next)
    setSelectedIds(new Set())
  }

  // Slot selection
  const toggleSelection = (slotId: string) => {
    if (roomStatus === "busy") return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
  }

  // Select-all helpers
  const selectAllFree = () => {
    const freeIds = slots
      .filter(s => s.available && !s.id.startsWith("booked-"))
      .map(s => s.id)
    setSelectedIds(new Set(freeIds))
  }
  const selectAllBlocked = () => {
    const blockedIds = slots
      .filter(s => !s.available && !s.id.startsWith("booked-"))
      .map(s => s.id)
    setSelectedIds(new Set(blockedIds))
  }

  // Apply with undo
  const applyStatusToSelected = async (makeAvailable: boolean) => {
    const ids = Array.from(selectedIds)
    const selectedSlots = slots.filter(s => ids.includes(s.id))
    const startTimes = selectedSlots.map(s => s.startTime)
    const prevSlots = [...slots]

    // Clear any existing undo window
    if (undoRef.current) {
      clearTimeout(undoRef.current.timeoutId)
      undoRef.current = null
    }

    // Optimistic update
    setSlots(current => current.map(s => ids.includes(s.id) ? { ...s, available: makeAvailable } : s))
    setSelectedIds(new Set())

    // Sonner undo toast
    const label = makeAvailable ? "freed" : "blocked"
    toast(`${ids.length} slot${ids.length > 1 ? "s" : ""} ${label}`, {
      duration: 5000,
      action: {
        label: t("partner.undo"),
        onClick: () => {
          if (undoRef.current) {
            clearTimeout(undoRef.current.timeoutId)
            undoRef.current = null
          }
          setSlots(prevSlots)
          toast.success(t("partner.undoDone"))
          return // skip API call
        },
      },
    })

    // Commit after 5s (if not undone)
    const timeoutId = setTimeout(async () => {
      undoRef.current = null
      try {
        await updateSlotStatuses(roomId, selectedDate, startTimes, makeAvailable ? "available" : "blocked")
      } catch (err) {
        setSlots(prevSlots)
        toast.error(err instanceof Error ? err.message : t("partner.slotUpdateFailed"))
      }
    }, 5000)

    undoRef.current = { prevSlots, timeoutId }
  }

  // Room-level block / unblock
  const handleSetBusy = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowReasonPanel(true)
  }

  const handleConfirmBlock = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRoomStatus("busy")
    setShowReasonPanel(false)
    setPendingReason("")
    setSelectedIds(new Set())
    setToggling(true)
    try {
      await updateRoomStatus(roomId, "unavailable")
      const stored = JSON.parse(localStorage.getItem("dinomad_room_status") || "{}")
      stored[roomId] = { status: "busy", reason: pendingReason as RoomStatusReason, timestamp: new Date().toISOString() }
      localStorage.setItem("dinomad_room_status", JSON.stringify(stored))
      toast.success(t("partner.roomBlocked"))
    } catch (err) {
      setRoomStatus("available")
      setShowReasonPanel(true)
      toast.error(err instanceof Error ? err.message : t("partner.blockFailed"))
    } finally {
      setToggling(false)
    }
  }

  const handleSetAvailable = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setRoomStatus("available")
    setToggling(true)
    try {
      await updateRoomStatus(roomId, "published")
      const stored = JSON.parse(localStorage.getItem("dinomad_room_status") || "{}")
      stored[roomId] = { status: "available", timestamp: new Date().toISOString() }
      localStorage.setItem("dinomad_room_status", JSON.stringify(stored))
      toast.success(t("partner.roomUnblocked"))
    } catch (err) {
      setRoomStatus("busy")
      toast.error(err instanceof Error ? err.message : t("partner.unblockFailed"))
    } finally {
      setToggling(false)
    }
  }

  const handleCancelReason = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowReasonPanel(false)
    setPendingReason("")
  }

  const freeCount    = slots.filter(s => s.available && !s.id.startsWith("booked-")).length
  const bookedCount  = slots.filter(s => s.id.startsWith("booked-")).length
  const blockedCount = slots.filter(s => !s.available && !s.id.startsWith("booked-")).length
  const totalCount   = slots.length
  const isBusy      = roomStatus === "busy"
  // Past dates are read-only — slots are shown for historical review only
  const isPastDate  = selectedDate < isoToday()

  return (
    <div className={`flex flex-col border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
      roomStatus === "busy"
        ? "border-l-4 border-l-destructive border-border/40 bg-destructive/3"
        : "border-l-4 border-l-emerald-500 border-border/40 bg-card"
    } ${className ?? ""}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2 w-2 rounded-full shrink-0 ${
            roomStatus === "busy" ? "bg-destructive" : "bg-emerald-500 animate-pulse"
          }`} />
          <span className="font-semibold text-sm tracking-tight text-foreground truncate">{roomName}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Slot count badge — only when expanded and loaded */}
          {expanded && !slotsLoading && totalCount > 0 && roomStatus !== "busy" && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold rounded-full border px-2.5 py-0.5 bg-background border-border/50 text-muted-foreground">
              <span className="text-emerald-600">{freeCount}F</span>
              <span className="opacity-30">·</span>
              <span className="text-amber-600">{bookedCount}B</span>
              <span className="opacity-30">·</span>
              <span className="text-destructive">{blockedCount}X</span>
            </div>
          )}

          {/* Status badge (collapsed) */}
          {!expanded && (
            <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap ${
              roomStatus === "busy"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
            }`}>
              {roomStatus === "busy" ? t("partner.roomStatusBusy") : t("partner.roomStatusAvailable")}
            </span>
          )}

          {/* Block / Unblock toggle — hidden for past dates */}
          {!isPastDate && (
            toggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : hydrated ? (
              roomStatus === "available" ? (
                <button
                  onClick={handleSetBusy}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  {t("partner.roomStatusBusy")}
                </button>
              ) : (
                <button
                  onClick={handleSetAvailable}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 transition-colors"
                >
                  {t("partner.unblockRoom")}
                </button>
              )
            ) : null
          )}

          {/* Expand/collapse */}
          <button
            onClick={() => { setExpanded(!expanded); if (expanded) setSelectedIds(new Set()) }}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Reason panel (inline drawer) ───────────────────────────────────── */}
      {showReasonPanel && (
        <div className="px-4 py-3 border-t border-destructive/20 bg-destructive/5 animate-in slide-in-from-top-1 fade-in duration-150">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-destructive">{t("partner.roomBlockReason")}</span>
            <button onClick={handleCancelReason} className="p-1 rounded hover:bg-destructive/10 transition-colors">
              <X className="h-3.5 w-3.5 text-destructive/70" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={pendingReason} onValueChange={v => setPendingReason(v as RoomStatusReason)}>
              <SelectTrigger className="w-full sm:w-52 text-xs h-8" onClick={e => e.stopPropagation()}>
                <SelectValue placeholder={t("partner.roomBlockReason")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk_in">{t("partner.reasonWalkIn")}</SelectItem>
                <SelectItem value="maintenance">{t("partner.reasonMaintenance")}</SelectItem>
                <SelectItem value="private_event">{t("partner.reasonPrivateEvent")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="destructive"
                disabled={!pendingReason || toggling}
                onClick={handleConfirmBlock}
                className="flex-1 sm:flex-none rounded-xl text-xs h-8"
              >
                {toggling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {t("partner.confirmBlock")}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelReason} className="flex-1 sm:flex-none rounded-xl text-xs h-8">
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded slot panel ─────────────────────────────────────────────── */}
      {expanded && (
        <div className="p-4 border-t border-border/30 animate-in slide-in-from-top-1 fade-in duration-150">

          {/* Date navigation — only show when NOT driven by globalDate */}
          {!globalDate && (
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30 gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeDate(-1)}
                  disabled={selectedDate <= minDate}
                  className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="text-xs font-semibold text-foreground min-w-[150px] text-center">
                  {formatDateLabel(selectedDate)}
                </span>
                <button
                  onClick={() => changeDate(1)}
                  disabled={selectedDate >= maxDate}
                  className="p-1.5 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2.5 py-1.5 hover:bg-muted/40 border border-border/50 relative">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{t("partner.pick")}</span>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  max={maxDate}
                  onChange={e => { if (e.target.value) { setSelectedDate(e.target.value); setSelectedIds(new Set()) } }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
              </label>
            </div>
          )}

          {/* When globalDate is driving — show a read-only date label */}
          {globalDate && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/30">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{formatDateLabel(selectedDate)}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{t("partner.syncedFromWeekStrip")}</span>
            </div>
          )}

          {/* Historical view banner — past date */}
          {isPastDate && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-muted/40 border border-border/40 animate-in fade-in duration-150">
              <History className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground">{t("partner.historicalView")}</span>
            </div>
          )}

          {/* Busy room overlay */}
          {roomStatus === "busy" ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4 rounded-xl bg-destructive/5 border border-destructive/15">
              <Lock className="h-8 w-8 text-destructive/40" />
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold text-destructive">{t("partner.roomBlocked")}</span>
                <span className="text-xs text-muted-foreground max-w-xs">{t("partner.roomBlockedDesc")}</span>
              </div>
              {/* Strikethrough ghost timeline */}
              {slotsLoading ? null : slots.length > 0 && (
                <div className="relative w-full opacity-30 pointer-events-none">
                  <div className="flex rounded-xl overflow-hidden h-7 border border-destructive/20">
                    {slots.map(slot => (
                      <div key={slot.id} className="flex-1 bg-destructive/20 border-r border-background/50 last:border-r-0" />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-px w-full bg-destructive/60" />
                  </div>
                </div>
              )}
              <button
                onClick={handleSetAvailable}
                disabled={toggling || isPastDate}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {toggling ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
                {t("partner.unblockRoom")}
              </button>
            </div>
          ) : slotsLoading ? (
            /* Skeleton timeline */
            <div className="flex flex-col gap-3">
              <div className="flex rounded-xl overflow-hidden h-10 border border-border/30">
                {[40, 20, 60, 30, 50].map((w, i) => (
                  <div
                    key={i}
                    className="h-full animate-pulse"
                    style={{ flex: w, background: i % 2 === 0 ? "hsl(var(--muted)/0.5)" : "hsl(var(--muted)/0.3)" }}
                  />
                ))}
              </div>
              <div className="h-3 rounded-full bg-muted/30 animate-pulse w-2/3" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border/50">
              {t("partner.noSlotsForDate")}
            </p>
          ) : (
            <>
              {/* Select-all helpers — hidden for past dates */}
              {!isPastDate ? (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground mr-auto">
                    {t("partner.selectSlotsHint")}
                  </span>
                  <button
                    onClick={selectAllFree}
                    title={t("partner.selectAllFree")}
                    className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1 transition-colors"
                  >
                    <SquareCheck className="h-3 w-3" /> {t("partner.free")}
                  </button>
                  <button
                    onClick={selectAllBlocked}
                    title={t("partner.selectAllBlocked")}
                    className="flex items-center gap-1 text-[10px] font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1 transition-colors"
                  >
                    <SquareX className="h-3 w-3" /> {t("partner.blocked")}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      title={t("partner.deselectAll")}
                      className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted/50 border border-border/50 rounded-lg px-2 py-1 transition-colors"
                    >
                      <Square className="h-3 w-3" /> ×
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-muted-foreground mb-3">
                  {t("partner.pastSlotsReadOnly")}
                </p>
              )}

              {/* Timeline strip */}
              <TimelineStrip
                slots={slots}
                selectedIds={selectedIds}
                onToggle={toggleSelection}
                disabled={isBusy || isPastDate}
              />

              {/* Bulk action bar — hidden for past dates */}
              {!isPastDate && selectedIds.size > 0 && (
                <div className="mt-4 pt-3.5 border-t border-border/30 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <span className="text-xs font-semibold text-foreground mr-auto">
                    {selectedIds.size} {t("partner.slotsSelected")}
                  </span>
                  <div className="w-full sm:w-auto flex gap-2">
                    <button
                      onClick={() => applyStatusToSelected(true)}
                      className="flex-1 sm:flex-none bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-[0.98] duration-150"
                    >
                      <Check className="h-3.5 w-3.5" /> {t("partner.setFree")}
                    </button>
                    <button
                      onClick={() => applyStatusToSelected(false)}
                      className="flex-1 sm:flex-none bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-[0.98] duration-150"
                    >
                      <X className="h-3.5 w-3.5" /> {t("partner.setBusy")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
