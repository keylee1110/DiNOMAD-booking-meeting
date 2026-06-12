"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { QrCode, Search, CheckCircle2, XCircle, Loader2, User, MapPin, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { bookings as mockBookings } from "@/lib/data/bookings"
import { cn } from "@/lib/utils"
import type { Booking, CheckInRecord } from "@/lib/types"

type ScannerPhase =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "found"; booking: Booking }
  | { phase: "error"; message: string }
  | { phase: "success"; booking: Booking; checkedInAt: string }

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export default function ScannerPage() {
  const { t } = useTranslation()
  const [bookingId, setBookingId] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [state, setState] = useState<ScannerPhase>({ phase: "idle" })
  const [recentScans, setRecentScans] = useState<CheckInRecord[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored: CheckInRecord[] = JSON.parse(localStorage.getItem("dinomad_checkins") || "[]")
    setRecentScans([...stored].reverse().slice(0, 5))
    setHydrated(true)
  }, [])

  const handleSearch = useCallback(() => {
    if (!bookingId.trim() || !accessCode.trim()) return
    setState({ phase: "searching" })

    setTimeout(() => {
      const lsBookings: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
      // Merge; localStorage version wins for duplicate IDs
      const map = new Map([...mockBookings, ...lsBookings].map(b => [b.id, b]))
      const allBookings = Array.from(map.values())

      const booking = allBookings.find(
        b => b.id.toUpperCase() === bookingId.trim().toUpperCase()
      )

      if (!booking) {
        setState({ phase: "error", message: t("partner.checkInNotFound") })
        return
      }

      if (!booking.accessCode || booking.accessCode !== accessCode.trim().toUpperCase()) {
        setState({ phase: "error", message: t("partner.checkInNotFound") })
        return
      }

      if (booking.status === "checked_in") {
        const time = booking.checkedInAt
          ? new Date(booking.checkedInAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          : "N/A"
        setState({
          phase: "error",
          message: t("partner.checkInAlreadyDone").replace("{time}", time),
        })
        return
      }
      if (booking.status === "cancelled") {
        setState({ phase: "error", message: t("partner.checkInCancelled") })
        return
      }
      if (booking.status === "completed") {
        setState({ phase: "error", message: t("partner.checkInEnded") })
        return
      }
      if (booking.status === "pending") {
        setState({ phase: "error", message: t("partner.checkInPending") })
        return
      }

      const today = new Date().toISOString().slice(0, 10)
      if (booking.date !== today) {
        setState({ phase: "error", message: t("partner.checkInWrongDate") })
        return
      }

      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const windowOpen = timeToMinutes(booking.startTime) - 15
      const windowClose = timeToMinutes(booking.endTime) + 30

      if (nowMinutes < windowOpen) {
        setState({ phase: "error", message: t("partner.checkInNotYet") })
        return
      }
      if (nowMinutes > windowClose) {
        setState({ phase: "error", message: t("partner.checkInWindowClosed") })
        return
      }

      setState({ phase: "found", booking })
    }, 400)
  }, [bookingId, accessCode, t])

  const handleConfirmCheckIn = useCallback((booking: Booking) => {
    const now = new Date().toISOString()
    const updatedBooking: Booking = { ...booking, status: "checked_in", checkedInAt: now }

    // Update dinomad_bookings
    const lsBookings: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
    const idx = lsBookings.findIndex(b => b.id === booking.id)
    if (idx >= 0) {
      lsBookings[idx] = updatedBooking
    } else {
      lsBookings.push(updatedBooking)
    }
    localStorage.setItem("dinomad_bookings", JSON.stringify(lsBookings))

    // Append to dinomad_checkins
    const checkIns: CheckInRecord[] = JSON.parse(localStorage.getItem("dinomad_checkins") || "[]")
    const record: CheckInRecord = {
      bookingId: booking.id,
      guestName: booking.guestName,
      roomName: booking.roomName,
      checkedInAt: now,
    }
    checkIns.push(record)
    localStorage.setItem("dinomad_checkins", JSON.stringify(checkIns))

    setRecentScans([...checkIns].reverse().slice(0, 5))
    setState({ phase: "success", booking: updatedBooking, checkedInAt: now })
  }, [])

  const handleReset = () => {
    setState({ phase: "idle" })
    setBookingId("")
    setAccessCode("")
  }

  const isSearching = state.phase === "searching"

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {t("partner.scannerTitle")}
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto md:mx-0">
          {t("partner.scannerSubtitle")}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: QR placeholder */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-10 flex flex-col items-center text-center shadow-sm opacity-60 pointer-events-none select-none">
            <div className="relative w-full max-w-[220px] aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center mb-6 overflow-hidden">
              <QrCode className="h-20 w-20 text-muted-foreground/30" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-muted-foreground/40" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-muted-foreground/40" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-muted-foreground/40" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-muted-foreground/40" />
            </div>
            <h2 className="text-base font-semibold tracking-tight mb-1 text-muted-foreground">
              {t("partner.cameraComingSoon")}
            </h2>
            <p className="text-sm text-muted-foreground/70">
              Use the manual form to verify bookings.
            </p>
          </div>
        </div>

        {/* Right: Verification form + result */}
        <div className="flex flex-col gap-6">

          {/* Idle / Error: show form */}
          {(state.phase === "idle" || state.phase === "error" || state.phase === "searching") && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-base uppercase tracking-wider text-foreground border-b border-border/40 pb-2">
                {t("partner.verifyBooking")}
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("partner.bookingIdLabel")}
                  </label>
                  <Input
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value)}
                    placeholder={t("partner.enterBookingIdPlaceholder")}
                    disabled={isSearching}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("partner.accessCode")}
                  </label>
                  <Input
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value.toUpperCase())}
                    placeholder={t("partner.enterAccessCode")}
                    maxLength={4}
                    disabled={isSearching}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    className="font-mono text-sm tracking-widest uppercase"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !bookingId.trim() || !accessCode.trim()}
                  className="w-full rounded-xl font-semibold gap-2"
                >
                  {isSearching
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</>
                    : <><Search className="h-4 w-4" /> {t("partner.searchVerify")}</>
                  }
                </Button>
              </div>

              {/* Error message */}
              {state.phase === "error" && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-destructive">{t("partner.checkInError")}</span>
                    <span className="text-xs text-destructive/80">{state.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Found: show booking summary */}
          {state.phase === "found" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-base text-foreground">{t("partner.bookingFound")}</h3>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{state.booking.guestName}</p>
                    <p className="text-xs text-muted-foreground">{state.booking.guestPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{state.booking.roomName}</p>
                    <p className="text-xs text-muted-foreground">{state.booking.venueName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground">
                    {state.booking.date} · {state.booking.startTime} → {state.booking.endTime}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleConfirmCheckIn(state.booking)}
                  className="flex-1 rounded-xl font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> {t("partner.confirmCheckIn")}
                </Button>
                <Button variant="outline" onClick={handleReset} className="rounded-xl">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Success */}
          {state.phase === "success" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <div>
                  <p className="text-lg font-bold text-foreground">{t("partner.checkInSuccess")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("partner.checkInSuccessDesc")}</p>
                </div>
                <div className="w-full rounded-lg bg-background/60 border border-border/40 p-3 text-left flex flex-col gap-1">
                  <p className="text-xs font-semibold text-foreground">{state.booking.guestName}</p>
                  <p className="text-xs text-muted-foreground">{state.booking.roomName} · {state.booking.startTime} → {state.booking.endTime}</p>
                  <p className="text-[11px] text-muted-foreground/70 font-mono mt-1">
                    {new Date(state.checkedInAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                </div>
              </div>
              <Button onClick={handleReset} className="w-full rounded-xl font-semibold">
                {t("partner.scannerTitle")} — Scan Another
              </Button>
            </div>
          )}

          {/* Recent Scans */}
          {hydrated && (
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="font-semibold text-base uppercase tracking-wider text-foreground border-b border-border/40 pb-2">
                {t("partner.recentScans")}
              </h3>
              {recentScans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent check-ins.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentScans.map((scan, i) => (
                    <div
                      key={`${scan.bookingId}-${i}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 shadow-sm bg-card",
                        i === 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60"
                      )}
                    >
                      <CheckCircle2 className={cn("h-5 w-5 shrink-0", i === 0 ? "text-emerald-500" : "text-muted-foreground")} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {scan.bookingId} — {scan.roomName}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                          {scan.guestName} · {new Date(scan.checkedInAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
