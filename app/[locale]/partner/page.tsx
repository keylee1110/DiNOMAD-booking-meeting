"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "@/lib/i18n/context"
import {
  TrendingUp, AlertCircle, Check, QrCode, Search, Activity, ArrowRight,
  ArrowUpRight, BarChart3, Clock, ArrowDownRight, Zap, CalendarCheck,
  UserCheck, RefreshCw, Loader2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatVND } from "@/lib/format"
import {
  getPartnerDashboard,
  type DashboardResponse,
  type DashboardMetrics,
  type DashboardPendingCheckIn,
  type DashboardActivityItem,
  type DashboardRevenuePoint,
} from "@/lib/api/partner"

const POLL_INTERVAL_MS = 30_000

type MetricStatus = "up" | "down" | "neutral"

const EMPTY_DASHBOARD: DashboardResponse = {
  metrics: { checkInsToday: 0, bookingsToday: 0, revenueToday: 0, activeWalkIns: 0 },
  pendingCheckIns: [],
  activityFeed: [],
  revenueChart: [],
}

// ─── Sparkline (pure SVG, no deps) ───────────────────────────────────────────
function Sparkline({ data, color = "currentColor" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 60
  const h = 24
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export default function PartnerDashboard() {
  const { t, locale } = useTranslation()
  const [showAlert, setShowAlert] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardResponse>(EMPTY_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const data = await getPartnerDashboard()
      setDashboard(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    intervalRef.current = setInterval(() => fetchDashboard(), POLL_INTERVAL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchDashboard])

  const { metrics, pendingCheckIns, activityFeed, revenueChart } = dashboard

  const revenueLast7 = useMemo(() => revenueChart.slice(-7).map(d => d.revenue), [revenueChart])
  const chartMax = useMemo(() => Math.max(...revenueLast7, 1), [revenueLast7])
  const totalWeekRevenue = useMemo(() => revenueLast7.reduce((s, v) => s + v, 0), [revenueLast7])

  const dayLabels = locale === "vi"
    ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const metricCards = useMemo(() => [
    {
      label: t("partner.checkInsToday"),
      value: loading ? "—" : metrics.checkInsToday.toString(),
      sparkData: revenueLast7, // reuse revenue trend as proxy for activity
      trend: "+0%",
      status: "neutral" as MetricStatus,
    },
    {
      label: t("partner.bookingsToday"),
      value: loading ? "—" : metrics.bookingsToday.toString(),
      sparkData: revenueLast7,
      trend: "+0%",
      status: "neutral" as MetricStatus,
    },
    {
      label: t("partner.revenueToday"),
      value: loading ? "—" : (metrics.revenueToday > 0 ? formatVND(metrics.revenueToday) : "0 ₫"),
      sparkData: revenueLast7,
      trend: "+12%",
      status: "up" as MetricStatus,
    },
    {
      label: t("partner.activeWalkIns"),
      value: loading ? "—" : metrics.activeWalkIns.toString(),
      sparkData: [],
      trend: "0%",
      status: "neutral" as MetricStatus,
    },
  ], [loading, metrics, revenueLast7, t])

  const actionItems = [
    { id: "A1", title: t("partner.actionPendingApproval"), desc: t("partner.actionPendingApprovalDesc"), urgency: "high", action: t("partner.actionReview") },
    { id: "A2", title: t("partner.actionRoomCleaning"), desc: t("partner.actionRoomCleaningDesc"), urgency: "medium", action: t("partner.actionMarkClean") },
  ]

  const feedIcon = (type: DashboardActivityItem["type"]) => {
    if (type === "check-in") return <ArrowRight className="h-4 w-4 text-[#84cc16]" />
    if (type === "check-out") return <Check className="h-4 w-4 text-muted-foreground" />
    if (type === "no-show") return <AlertCircle className="h-4 w-4 text-red-400" />
    if (type === "booking") return <AlertCircle className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-muted-foreground" />
  }

  const feedLabel = (item: DashboardActivityItem) => {
    if (item.type === "check-in") return `${t("partner.feedCheckedIn")} ${item.roomName}`
    if (item.type === "check-out") return `${t("partner.feedCheckedOut")} ${item.roomName}`
    if (item.type === "no-show") return `${t("partner.feedNoShow")} ${item.bookingCode}`
    return `${t("partner.feedBookingConfirmed")} ${item.bookingCode} — ${item.roomName}`
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{t("partner.loadingDashboard")}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 md:gap-12 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {t("partner.dashboard")}
          </h1>
          <p className="border-l-2 border-primary/40 pl-4 text-sm md:text-base text-muted-foreground max-w-xl">
            {t("partner.dashboardSubtitle")}
          </p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border/60 rounded-xl px-3 py-2 transition-all self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t("partner.refresh")}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-medium">{t("partner.dashboardLoadError")}</span>
        </div>
      )}

      {/* Alert */}
      {showAlert && (
        <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:p-5 relative animate-in slide-in-from-top-4 fade-in duration-300 shadow-[0_4px_12px_rgba(59,130,246,0.04)]">
          <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 tracking-tight text-sm md:text-base">{t("partner.newBookingAlert")}</h3>
            <p className="text-xs md:text-sm text-blue-700/90 mt-1">
              {t("partner.newBookingAlertDesc")}
            </p>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-blue-500 hover:bg-blue-100/80 p-1.5 rounded-lg transition-colors"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
        {metricCards.map((m, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-border/50 bg-card p-5 md:p-6 shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="text-xs font-semibold text-muted-foreground tracking-tight mb-2.5">{m.label}</span>
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{m.value}</span>
            <div className="flex items-center justify-between mt-4">
              <div className={`flex items-center gap-1.5 text-[10px] md:text-xs font-semibold self-start px-2.5 py-1 rounded-full border ${
                m.status === "up" ? "text-green-700 bg-green-500/10 border-green-500/20" :
                m.status === "down" ? "text-red-700 bg-red-500/10 border-red-500/20" :
                "text-muted-foreground bg-muted border-border/40"
              }`}>
                {m.status === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : m.status === "down" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5 opacity-50" />}
                {m.trend}
              </div>
              {m.sparkData.length >= 2 && (
                <Sparkline
                  data={m.sparkData}
                  color={m.status === "up" ? "#16a34a" : m.status === "down" ? "#dc2626" : "#94a3b8"}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">

        {/* Main column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Requires Action */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-6">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-3 border-b border-border/50 pb-4 text-foreground">
              <Zap className="h-5 w-5 text-orange-500 fill-orange-500" /> {t("partner.requiresAction")}
              {actionItems.filter(a => a.urgency === "high").length > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                  {actionItems.filter(a => a.urgency === "high").length}
                </span>
              )}
            </h2>
            <div className="flex flex-col gap-4">
              {actionItems.map(action => (
                <div
                  key={action.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-xl border transition-all duration-200 ${
                    action.urgency === "high"
                      ? "border-red-100 bg-red-50/50 hover:bg-red-50"
                      : "border-border/60 bg-background/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-sm md:text-base flex items-center gap-2 text-foreground">
                      {action.urgency === "high" && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                      {action.title}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{action.desc}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={action.urgency === "high" ? "destructive" : "default"}
                    className="rounded-xl px-5 font-semibold text-xs shadow-sm w-full sm:w-auto"
                  >
                    {action.action}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Check-ins */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-3 text-foreground">
                <UserCheck className="h-5 w-5 text-primary" /> {t("partner.pendingCheckIns")}
              </h2>
              {pendingCheckIns.length > 0 && (
                <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  {pendingCheckIns.length}
                </span>
              )}
            </div>

            {pendingCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("partner.noPendingCheckIns")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingCheckIns.map((b: DashboardPendingCheckIn) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">{b.bookingCode}</span>
                        <span className="text-xs font-semibold text-foreground">{b.guestName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{b.roomName}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{b.startTime} → {b.endTime}</span>
                      </div>
                    </div>
                    <Link href={`/${locale}/partner/scanner`}>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 w-full sm:w-auto">
                        <Search className="h-3.5 w-3.5" /> {t("partner.verifyNow")}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue chart */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-3 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" /> {t("partner.last7DaysRevenue")}
              </h2>
              <span className="text-sm md:text-base font-semibold text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/25">
                {formatVND(totalWeekRevenue)}
              </span>
            </div>
            {revenueLast7.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {t("partner.noDataPeriod")}
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 h-48 mt-8 px-2 md:px-6">
                {revenueLast7.map((revenue, i) => {
                  const heightPct = (revenue / chartMax) * 100
                  const isLast = i === revenueLast7.length - 1
                  const label = revenueChart.slice(-7)[i]
                  const dow = label ? new Date(label.date + "T00:00:00").getDay() : i
                  const dayLabel = dayLabels[dow === 0 ? 6 : dow - 1]
                  return (
                    <div key={i} className="w-full flex justify-end flex-col items-center gap-2 group h-full relative">
                      <div className="text-[10px] md:text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-primary bg-background border border-primary/30 shadow-md rounded-md px-2 py-0.5 -translate-y-2.5 absolute z-10">
                        {formatVND(revenue)}
                      </div>
                      <div
                        className={`w-full max-w-[32px] md:max-w-[40px] rounded-t-lg transition-all duration-300 ease-out group-hover:-translate-y-0.5 ${
                          isLast ? "bg-primary" : "bg-primary/15 hover:bg-primary/25"
                        }`}
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                      <div className="text-xs font-medium text-muted-foreground mt-1">{dayLabel}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="flex flex-col gap-8">

          {/* Quick Scanner */}
          <div className="rounded-2xl border border-transparent bg-primary text-primary-foreground p-6 md:p-8 shadow-[0_8px_30px_rgba(100,181,246,0.15)] relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-foreground/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0" />
            <h2 className="text-lg md:text-xl font-semibold mb-2.5 flex items-center gap-2 relative z-10 text-primary-foreground">
              <QrCode className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" /> {t("partner.quickScan")}
            </h2>
            <p className="text-sm mb-6 text-primary-foreground/90 font-medium relative z-10 leading-relaxed">
              {t("partner.quickScanDesc")}
            </p>
            <Link href={`/${locale}/partner/scanner`} className="relative z-10 w-full block">
              <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/95 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                <Search className="h-4 w-4" /> {t("partner.openScanner")}
              </Button>
            </Link>
          </div>

          {/* Upcoming / Pending Check-ins preview */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 p-4 bg-muted/10">
              <h2 className="text-sm md:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" /> {t("partner.upcomingBookings")}
              </h2>
            </div>
            {pendingCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-6">
                {t("partner.noUpcomingBookings")}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border/30">
                {pendingCheckIns.slice(0, 3).map(b => (
                  <div key={b.id} className="flex flex-col gap-1 p-4 hover:bg-muted/20 transition-colors">
                    <span className="text-xs font-bold text-foreground">{b.guestName}</span>
                    <span className="text-[11px] text-muted-foreground">{b.roomName}</span>
                    <span className="text-[11px] font-semibold text-primary mt-0.5">
                      {b.startTime} → {b.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/40 p-4 bg-muted/10">
              <h2 className="text-sm md:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" /> {t("partner.liveFeed")}
              </h2>
              <span className="text-[10px] font-semibold text-muted-foreground bg-background border border-border/60 rounded-full px-2.5 py-0.5">
                {t("partner.autoSync")}
              </span>
            </div>
            <div className="flex flex-col">
              {activityFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center p-6">{t("partner.noActivity")}</p>
              ) : (
                activityFeed.map((item, i) => (
                  <div
                    key={item.id}
                    className={`flex gap-3 p-4 border-b border-border/30 transition-colors ${
                      i === 0 ? "bg-primary/5 hover:bg-primary/10" : "bg-card hover:bg-muted/30"
                    } ${i === activityFeed.length - 1 ? "border-b-0" : ""}`}
                  >
                    <div className="pt-0.5 shrink-0">{feedIcon(item.type)}</div>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold leading-tight ${i === 0 ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                        {feedLabel(item)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">{item.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              href={`/${locale}/partner/schedule`}
              className="text-xs font-semibold text-foreground bg-muted/20 hover:bg-muted/40 border-t border-border/40 transition-colors text-center py-3.5 block"
            >
              {t("partner.viewFullLogs")} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
