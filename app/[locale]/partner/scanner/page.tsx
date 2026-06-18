"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import {
  QrCode, Search, CheckCircle2, XCircle, Loader2,
  User, MapPin, Clock, ArrowLeft, UserX, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatVND } from "@/lib/format"
import { scannerLookup, scannerCheckIn, scannerNoShow, type ScannerBooking } from "@/lib/api/partner"
import { toast } from "sonner"

interface CheckInRecord {
  bookingId: string
  bookingCode: string
  guestName: string
  roomName: string
  checkedInAt: string
}

type Phase =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "found"; booking: ScannerBooking; timeWarning?: string }
  | { phase: "confirming-no-show"; booking: ScannerBooking }
  | { phase: "error"; message: string }
  | { phase: "success-checkin"; booking: ScannerBooking }
  | { phase: "success-noshow"; booking: ScannerBooking }

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export default function ScannerPage() {
  const { locale, t } = useTranslation()
  const [bookingCode, setBookingCode] = useState("")
  const [state, setState] = useState<Phase>({ phase: "idle" })
  const [actionLoading, setActionLoading] = useState(false)
  const [recentScans, setRecentScans] = useState<CheckInRecord[]>([])
  const [hydrated, setHydrated] = useState(false)

  const [isScanning, setIsScanning] = useState(false)
  const [html5QrScanner, setHtml5QrScanner] = useState<any>(null)

  useEffect(() => {
    const stored: CheckInRecord[] = JSON.parse(localStorage.getItem("dinomad_checkins") || "[]")
    setRecentScans([...stored].reverse().slice(0, 5))
    setHydrated(true)
  }, [])

  useEffect(() => {
    return () => {
      if (html5QrScanner) {
        html5QrScanner.clear()
      }
    }
  }, [html5QrScanner])

  const verifyBookingAndTransition = useCallback((booking: ScannerBooking) => {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const windowOpen = timeToMinutes(booking.startTime) - 15
    const windowClose = timeToMinutes(booking.endTime) + 30

    let timeWarning = ""
    if (booking.date !== today) {
      timeWarning = t("partner.checkInWrongDate") || "Đơn đặt không thuộc ngày hôm nay."
    } else if (nowMinutes < windowOpen) {
      timeWarning = t("partner.checkInNotYet") || "Khách đến sớm hơn khung giờ đặt phòng."
    } else if (nowMinutes > windowClose) {
      timeWarning = t("partner.checkInWindowClosed") || "Khách đến muộn hơn khung giờ đặt phòng."
    }

    setState({ phase: "found", booking, timeWarning })
  }, [t])

  const handleSearch = useCallback(async () => {
    const code = bookingCode.trim().toUpperCase()
    if (!code) return

    setState({ phase: "searching" })
    try {
      const booking = await scannerLookup(code)
      verifyBookingAndTransition(booking)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState({ phase: "error", message: msg })
    }
  }, [bookingCode, verifyBookingAndTransition])

  const handleConfirmCheckIn = useCallback(async (booking: ScannerBooking) => {
    setActionLoading(true)
    try {
      const updated = await scannerCheckIn(booking.id)
      setState({ phase: "success-checkin", booking: updated })
      toast.success(t("partner.checkInSuccess"))

      // Add to local recent scans
      const now = new Date().toISOString()
      const checkIns: CheckInRecord[] = JSON.parse(localStorage.getItem("dinomad_checkins") || "[]")
      const record: CheckInRecord = {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        guestName: booking.guestName,
        roomName: booking.roomName,
        checkedInAt: now,
      }
      checkIns.push(record)
      localStorage.setItem("dinomad_checkins", JSON.stringify(checkIns))
      setRecentScans([...checkIns].reverse().slice(0, 5))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState({ phase: "error", message: msg })
    } finally {
      setActionLoading(false)
    }
  }, [t])

  const handleConfirmNoShow = useCallback(async (booking: ScannerBooking) => {
    setActionLoading(true)
    try {
      const updated = await scannerNoShow(booking.id)
      setState({ phase: "success-noshow", booking: updated })
      toast.success(t("partner.noShowSuccess"))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState({ phase: "error", message: msg })
    } finally {
      setActionLoading(false)
    }
  }, [t])

  const handleReset = () => {
    setState({ phase: "idle" })
    setBookingCode("")
  }

  const startScanning = useCallback(() => {
    import("html5-qrcode").then((module) => {
      const scanner = new module.Html5Qrcode("reader")
      setHtml5QrScanner(scanner)
      setIsScanning(true)

      scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setIsScanning(false)
          
          await scanner.stop().catch(console.error)
          scanner.clear()
          setHtml5QrScanner(null)
          
          const codeMatch = decodedText.match(/(DN-[A-Z0-9]+)/i) || decodedText.match(/(BK-[A-Z0-9]+)/i)
          const parsedCode = codeMatch ? codeMatch[0] : decodedText.trim()
          setBookingCode(parsedCode.toUpperCase())
          
          // Trigger search directly
          setState({ phase: "searching" })
          try {
            const booking = await scannerLookup(parsedCode.toUpperCase())
            verifyBookingAndTransition(booking)
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            setState({ phase: "error", message: msg })
          }
        },
        () => {}
      ).catch((err) => {
        console.error("Failed to start scanner:", err)
        setIsScanning(false)
      })
    })
  }, [verifyBookingAndTransition])

  const stopScanning = useCallback(async () => {
    if (html5QrScanner) {
      await html5QrScanner.stop().catch(console.error)
      html5QrScanner.clear()
      setHtml5QrScanner(null)
    }
    setIsScanning(false)
  }, [html5QrScanner])

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
        {/* Left: QR Scanner Viewport */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-10 flex flex-col items-center text-center shadow-sm">
            <div id="reader" className="w-full max-w-[280px] aspect-square overflow-hidden rounded-2xl bg-muted/20 mb-6 flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
              {!isScanning && (
                <div className="flex flex-col items-center">
                  <QrCode className="h-20 w-20 text-muted-foreground/30 mb-2" />
                  <span className="text-xs text-muted-foreground/60">Camera Preview</span>
                </div>
              )}
            </div>
            {isScanning ? (
              <Button onClick={stopScanning} variant="destructive" className="w-full max-w-[200px] rounded-xl font-semibold gap-2">
                Stop Camera
              </Button>
            ) : (
              <Button onClick={startScanning} className="w-full max-w-[200px] rounded-xl font-semibold gap-2">
                <QrCode className="h-4 w-4" /> Start Camera
              </Button>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("partner.statusGuide")}</p>
            {[
              { color: "bg-emerald-500", label: t("partner.statusCheckedIn") },
              { color: "bg-amber-500", label: t("partner.statusNoShow") },
              { color: "bg-muted-foreground/30", label: t("partner.statusConfirmed") },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.color)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Verification form + states */}
        <div className="flex flex-col gap-6">

          {/* ── Idle / Error / Searching: show form ── */}
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
                    value={bookingCode}
                    onChange={e => setBookingCode(e.target.value.toUpperCase())}
                    placeholder="DN-ABC123"
                    disabled={isSearching}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    className="font-mono text-sm tracking-widest"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !bookingCode.trim()}
                  className="w-full rounded-xl font-semibold gap-2"
                >
                  {isSearching
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("partner.searching")}</>
                    : <><Search className="h-4 w-4" /> {t("partner.searchVerify")}</>
                  }
                </Button>
              </div>

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

          {/* ── Found: booking summary + actions ── */}
          {state.phase === "found" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-base text-foreground">{t("partner.bookingFound")}</h3>
              </div>

              {/* Time warning banner */}
              {state.timeWarning && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 animate-in fade-in duration-200">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-amber-500">{locale === "vi" ? "Cảnh báo Check-in lệch giờ" : "Check-in Time Warning"}</span>
                    <span className="text-xs text-amber-500/80">{state.timeWarning}</span>
                  </div>
                </div>
              )}

              <BookingCard booking={state.booking} />

              <div className="flex gap-2">
                <Button
                  onClick={() => handleConfirmCheckIn(state.booking)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {state.timeWarning ? (locale === "vi" ? "Bỏ qua & Check-in" : "Bypass & Check-in") : t("partner.confirmCheckIn")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setState({ phase: "confirming-no-show", booking: state.booking })}
                  disabled={actionLoading}
                  className="rounded-xl border-amber-400/40 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 gap-2"
                >
                  <UserX className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("partner.markNoShow")}</span>
                </Button>
                <Button variant="outline" onClick={handleReset} className="rounded-xl px-3">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Confirming No-Show: destructive confirmation step ── */}
          {state.phase === "confirming-no-show" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-base text-foreground">{t("partner.noShowConfirm")}</h3>
              </div>

              <BookingCard booking={state.booking} />

              <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">{t("partner.noShowDesc")}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleConfirmNoShow(state.booking)}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1 rounded-xl font-semibold gap-2"
                >
                  {actionLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <UserX className="h-4 w-4" />
                  }
                  {t("partner.confirmNoShow")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setState({ phase: "found", booking: state.booking })}
                  disabled={actionLoading}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Success: Checked In ── */}
          {state.phase === "success-checkin" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <div>
                  <p className="text-lg font-bold text-foreground">{t("partner.checkInSuccess")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("partner.checkInSuccessDesc")}</p>
                </div>
                <BookingSummaryLine booking={state.booking} />
              </div>
              <Button onClick={handleReset} className="w-full rounded-xl font-semibold">
                {t("partner.verifyAnother")}
              </Button>
            </div>
          )}

          {/* ── Success: No-Show ── */}
          {state.phase === "success-noshow" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5 flex flex-col items-center text-center gap-3">
                <UserX className="h-12 w-12 text-amber-500" />
                <div>
                  <p className="text-lg font-bold text-foreground">{t("partner.noShowSuccess")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("partner.noShowSuccessDesc")}</p>
                </div>
                <BookingSummaryLine booking={state.booking} />
              </div>
              <Button onClick={handleReset} variant="outline" className="w-full rounded-xl font-semibold">
                {t("partner.verifyAnother")}
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
                          {scan.bookingCode} — {scan.roomName}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: ScannerBooking }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-foreground bg-muted/40 border border-border/50 rounded-lg px-2.5 py-1">
          {booking.bookingCode}
        </span>
        <StatusBadge status={booking.status} checkedInAt={booking.checkedInAt} />
      </div>

      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-bold text-foreground">{booking.guestName}</p>
          {booking.guestPhone && (
            <p className="text-xs text-muted-foreground">{booking.guestPhone}</p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">{booking.roomName}</p>
          <p className="text-xs text-muted-foreground">{booking.venueName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-foreground">
          {booking.date} · {booking.startTime} → {booking.endTime}
        </p>
      </div>

      <div className="border-t border-border/30 pt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("partner.roomFeeLabel")}</span>
        <span className="font-semibold text-foreground">{formatVND(booking.subtotal)}</span>
      </div>
    </div>
  )
}

function BookingSummaryLine({ booking }: { booking: ScannerBooking }) {
  return (
    <div className="w-full rounded-lg bg-background/60 border border-border/40 p-3 text-left flex flex-col gap-1">
      <p className="text-xs font-semibold text-foreground">{booking.guestName}</p>
      <p className="text-xs text-muted-foreground">
        {booking.roomName} · {booking.startTime} → {booking.endTime}
      </p>
      <p className="font-mono text-[11px] text-muted-foreground/70 mt-0.5">{booking.bookingCode}</p>
    </div>
  )
}

function StatusBadge({ status, checkedInAt }: { status: string; checkedInAt: string | null }) {
  const { t } = useTranslation()
  if (checkedInAt || status === "checked_in") {
    return (
      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
        {t("partner.statusCheckedIn")}
      </span>
    )
  }
  if (status === "no_show") {
    return (
      <span className="text-[10px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
        {t("partner.statusNoShow")}
      </span>
    )
  }
  if (status === "confirmed") {
    return (
      <span className="text-[10px] font-semibold text-blue-700 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
        {t("partner.statusConfirmed")}
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold text-muted-foreground bg-muted/40 border border-border/50 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
      {status}
    </span>
  )
}
