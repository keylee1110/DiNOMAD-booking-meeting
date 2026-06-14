"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, X, Loader2, CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n/context"
import { updateRoomStatus, getRoomSlots, updateSlotStatuses } from "@/lib/api/partner"
import { toast } from "sonner"
import type { TimeSlot, RoomStatusReason, RoomStatusEntry } from "@/lib/types"

interface InventoryToggleProps {
  roomId?: string
  roomName?: string
  /** DB status from API: "published" | "unavailable" | "draft" */
  initialDbStatus?: string
  className?: string
}

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

export function InventoryToggle({
  roomId = "1",
  roomName = "Room A",
  initialDbStatus,
  className,
}: InventoryToggleProps) {
  const { t } = useTranslation()

  const [expanded, setExpanded] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(isoToday())

  // When initialDbStatus is provided as a prop, start hydrated immediately
  // to avoid a flash where buttons are hidden on mount.
  const [roomStatus, setRoomStatus] = useState<"available" | "busy">(
    dbStatusToUi(initialDbStatus)
  )
  const [hydrated, setHydrated] = useState(initialDbStatus !== undefined)

  const [showReasonPanel, setShowReasonPanel] = useState(false)
  const [pendingReason, setPendingReason] = useState<RoomStatusReason | "">("")
  const [toggling, setToggling] = useState(false)

  const minDate = isoOffset(isoToday(), -7)
  const maxDate = isoOffset(isoToday(), 30)

  // Sync from DB status prop (only when prop changes — e.g. parent re-fetches)
  useEffect(() => {
    if (initialDbStatus !== undefined) {
      setRoomStatus(dbStatusToUi(initialDbStatus))
      setHydrated(true)
      return
    }
    // Fallback: localStorage for legacy / static usage
    const stored: Record<string, RoomStatusEntry> = JSON.parse(
      localStorage.getItem("dinomad_room_status") || "{}"
    )
    const entry = stored[roomId]
    if (entry) setRoomStatus(entry.status)
    setHydrated(true)
  }, [roomId, initialDbStatus])

  // Load slots whenever roomId or selectedDate changes
  useEffect(() => {
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

  const changeDate = (delta: number) => {
    const next = isoOffset(selectedDate, delta)
    if (next < minDate || next > maxDate) return
    setSelectedDate(next)
    setSelectedIds(new Set())
  }

  const toggleSelection = (slotId: string) => {
    if (roomStatus === "busy") return
    if (slotId.startsWith("booked-")) return  // customer bookings are read-only
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
  }

  const applyStatusToSelected = async (makeAvailable: boolean) => {
    const ids = Array.from(selectedIds)
    const selectedSlots = slots.filter(s => ids.includes(s.id))
    const startTimes = selectedSlots.map(s => s.startTime)
    const dbStatus = makeAvailable ? "available" : "blocked"

    // Optimistic update
    setSlots(current => current.map(s => ids.includes(s.id) ? { ...s, available: makeAvailable } : s))
    setSelectedIds(new Set())

    try {
      await updateSlotStatuses(roomId, selectedDate, startTimes, dbStatus)
      toast.success(`${ids.length} slot${ids.length > 1 ? "s" : ""} ${makeAvailable ? "freed" : "blocked"}.`)
    } catch (err) {
      // Revert on failure
      setSlots(current => current.map(s => ids.includes(s.id) ? { ...s, available: !makeAvailable } : s))
      const msg = err instanceof Error ? err.message : "Failed to update slots"
      toast.error(msg)
    }
  }

  const handleSetBusy = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowReasonPanel(true)
  }

  const handleConfirmBlock = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // Optimistic: update UI immediately, revert on error
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
      toast.success("Room blocked.")
    } catch (err: unknown) {
      // Revert on failure
      setRoomStatus("available")
      setShowReasonPanel(true)
      const msg = err instanceof Error ? err.message : "Failed to block room"
      toast.error(msg)
    } finally {
      setToggling(false)
    }
  }

  const handleSetAvailable = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // Optimistic: update UI immediately, revert on error
    setRoomStatus("available")
    setToggling(true)
    try {
      await updateRoomStatus(roomId, "published")
      const stored = JSON.parse(localStorage.getItem("dinomad_room_status") || "{}")
      stored[roomId] = { status: "available", timestamp: new Date().toISOString() }
      localStorage.setItem("dinomad_room_status", JSON.stringify(stored))
      toast.success("Room is now available.")
    } catch (err: unknown) {
      // Revert on failure
      setRoomStatus("busy")
      const msg = err instanceof Error ? err.message : "Failed to unblock room"
      toast.error(msg)
    } finally {
      setToggling(false)
    }
  }

  const handleCancelReason = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowReasonPanel(false)
    setPendingReason("")
  }

  const availableCount = slots.filter(s => s.available).length
  const totalCount = slots.length

  return (
    <div className={`flex flex-col gap-0 border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm transition-all ${className ?? ""}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 bg-background/50">
        <span className="font-semibold text-sm tracking-tight text-foreground truncate mr-3">{roomName}</span>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${
            roomStatus === "busy"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : availableCount > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                : "bg-muted/40 text-muted-foreground border-border/40"
          }`}>
            {roomStatus === "busy"
              ? t("partner.roomStatusBusy")
              : slotsLoading
                ? "..."
                : totalCount === 0
                  ? "No slots"
                  : `${availableCount}/${totalCount} Slots`}
          </span>

          {/* Toggle buttons */}
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : hydrated ? (
            roomStatus === "available" ? (
              <button
                onClick={handleSetBusy}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                {t("partner.roomStatusBusy")}
              </button>
            ) : (
              <button
                onClick={handleSetAvailable}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 transition-colors"
              >
                {t("partner.unblockRoom")}
              </button>
            )
          ) : null}

          {/* Expand / collapse */}
          <button
            onClick={() => { setExpanded(!expanded); if (expanded) setSelectedIds(new Set()) }}
            className="p-1 rounded hover:bg-muted/40 transition-colors"
          >
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* ── Reason panel ───────────────────────────────────────────────────── */}
      {showReasonPanel && (
        <div className="px-4 py-3 border-t border-border/40 bg-destructive/5 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
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
          <Button
            size="sm"
            variant="destructive"
            disabled={!pendingReason || toggling}
            onClick={handleConfirmBlock}
            className="w-full sm:w-auto rounded-xl text-xs h-8"
          >
            {toggling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            {t("partner.confirmBlock")}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelReason} className="w-full sm:w-auto rounded-xl text-xs h-8">
            {t("common.cancel")}
          </Button>
        </div>
      )}

      {/* ── Slot grid (expanded) ───────────────────────────────────────────── */}
      {expanded && (
        <div className="p-4 border-t border-border/40 bg-muted/10 animate-in slide-in-from-top-2 fade-in duration-200">

          {/* Date navigation */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40 gap-2">
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

            {/* Direct date picker */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1 hover:bg-muted/40 relative">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Pick</span>
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

          {/* Busy overlay */}
          {roomStatus === "busy" ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Badge variant="destructive" className="text-xs">{t("partner.roomStatusBusy")}</Badge>
              <p className="text-xs text-muted-foreground text-center">
                This room is blocked. Click &ldquo;{t("partner.unblockRoom")}&rdquo; above to restore availability.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end mb-3">
                <span className="text-xs font-medium text-muted-foreground tracking-tight">
                  Select slots → apply action
                </span>
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading slots...</span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No slots for this date — publish the room to generate its schedule.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                  {slots.map(slot => {
                    const isSelected = selectedIds.has(slot.id)
                    return (
                      <button
                        key={slot.id}
                        onClick={() => toggleSelection(slot.id)}
                        disabled={slot.id.startsWith("booked-")}
                        className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 duration-200 ${
                          slot.id.startsWith("booked-")
                            ? "bg-amber-500/10 text-amber-700 border-amber-400/30 cursor-not-allowed opacity-75"
                            : isSelected
                              ? "bg-primary text-primary-foreground border-transparent scale-[1.03]"
                              : slot.available
                                ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 text-foreground"
                                : "bg-destructive/5 text-destructive/80 border-destructive/20 hover:border-destructive/50"
                        }`}
                      >
                        <span className="text-[10px] md:text-[11px] font-semibold block">{slot.startTime}</span>
                        {isSelected
                          ? <span className="text-[8px] font-semibold uppercase tracking-wider block">Sel</span>
                          : <span className="text-[8px] font-medium uppercase tracking-wider opacity-60 block">
                              {slot.id.startsWith("booked-") ? "Booked" : slot.available ? "Free" : "Busy"}
                            </span>
                        }
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="mt-4 pt-3.5 border-t border-border/40 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-xs font-semibold text-foreground mr-auto">
                    {selectedIds.size} selected
                  </span>
                  <div className="w-full sm:w-auto flex gap-2">
                    <button
                      onClick={() => applyStatusToSelected(true)}
                      className="flex-1 sm:flex-none bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-[0.98] duration-200"
                    >
                      <Check className="h-3.5 w-3.5" /> Set Free
                    </button>
                    <button
                      onClick={() => applyStatusToSelected(false)}
                      className="flex-1 sm:flex-none bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-[0.98] duration-200"
                    >
                      <X className="h-3.5 w-3.5" /> Set Busy
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
