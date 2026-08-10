"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Clock, Loader2, AlertCircle, Download } from "lucide-react"

import { formatVND } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  getPartnerEarnings,
  type EarningsResponse,
  type EarningsBookingRow,
} from "@/lib/api/partner"
import { EarningsTimeFilter, type TimeFilterValue } from "@/components/ui/earnings-time-filter"

const emptyResponse: EarningsResponse = {
  summary: {
    totalRevenue: 0,
    totalCommission: 0,
    totalNet: 0,
    pendingPayout: 0,
    collectedAtCounter: 0,
  },
  chartData: [],
  bookings: [],
}

const mockPayouts: any[] = []

export default function EarningsPage() {
  const { t, locale } = useTranslation()
  const now = useMemo(() => new Date(), [])

  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const todayStr = useMemo(() => now.toISOString().slice(0, 10), [now])

  const [filterValue, setFilterValue] = useState<TimeFilterValue>(() => {
    const start = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
    return {
      period: "monthly",
      startDate: start,
      endDate: todayStr,
      label: locale.startsWith("vi") ? `Tháng Này (${currentMonth}/${currentYear})` : `This Month (${currentMonth}/${currentYear})`,
    }
  })

  const [earnings, setEarnings] = useState<EarningsResponse | null>(null)
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const { startDate, endDate, period } = filterValue

    // Calculate previous period for comparison trend (% vs period trước)
    let prevStart = startDate
    let prevEnd = endDate

    if (period === "monthly") {
      const parts = startDate.split("-")
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const prevM = m === 1 ? 12 : m - 1
      const prevY = m === 1 ? y - 1 : y
      prevStart = `${prevY}-${String(prevM).padStart(2, "0")}-01`
      const lastDayObj = new Date(Date.UTC(prevY, prevM, 0))
      prevEnd = `${prevY}-${String(prevM).padStart(2, "0")}-${String(lastDayObj.getUTCDate()).padStart(2, "0")}`
    } else if (period === "daily") {
      const dStart = new Date(startDate)
      const dEnd = new Date(endDate)
      const diffTime = Math.abs(dEnd.getTime() - dStart.getTime())
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1)

      const pEnd = new Date(dStart)
      pEnd.setDate(pEnd.getDate() - 1)
      const pStart = new Date(pEnd)
      pStart.setDate(pStart.getDate() - (diffDays - 1))

      prevStart = pStart.toISOString().slice(0, 10)
      prevEnd = pEnd.toISOString().slice(0, 10)
    } else if (period === "weekly") {
      const dStart = new Date(startDate)
      const pEnd = new Date(dStart)
      pEnd.setDate(pEnd.getDate() - 1)
      const pStart = new Date(pEnd)
      pStart.setDate(pStart.getDate() - 6)

      prevStart = pStart.toISOString().slice(0, 10)
      prevEnd = pEnd.toISOString().slice(0, 10)
    }

    Promise.all([
      getPartnerEarnings(startDate, endDate),
      getPartnerEarnings(prevStart, prevEnd),
    ])
      .then(([current, prev]) => {
        if (cancelled) return
        setEarnings(current)
        setLastMonthRevenue(prev.summary.totalRevenue)
      })
      .catch(() => {
        if (cancelled) return
        setEarnings(emptyResponse)
        setLastMonthRevenue(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [filterValue])

  const data = earnings ?? emptyResponse
  const { totalRevenue, pendingPayout, collectedAtCounter } = data.summary

  const revenueChange = lastMonthRevenue > 0
    ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0

  const chartDays = useMemo(() => {
    return data.chartData
  }, [data.chartData])

  const chartMax = useMemo(
    () => Math.max(...chartDays.map(d => d.revenue), 1),
    [chartDays],
  )

  const statCards = [
    {
      label: t("partner.totalEarningsMonth"),
      value: formatVND(totalRevenue),
      sub: lastMonthRevenue > 0
        ? `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}% ${t("partner.vsLastMonth")}`
        : t("partner.noPriorData"),
      trend: revenueChange >= 0 ? "up" : "down",
      icon: BarChart3,
    },
    {
      label: t("partner.lastMonth"),
      value: formatVND(lastMonthRevenue),
      sub: locale.startsWith("vi") ? "Kỳ trước" : "Previous period",
      trend: "neutral" as const,
      icon: Clock,
    },
    {
      label: t("partner.collectedAtCounter"),
      value: formatVND(collectedAtCounter),
      sub: t("partner.collectedAtCounterHint"),
      trend: "neutral" as const,
      icon: DollarSign,
    },
    {
      label: t("partner.pendingPayout"),
      value: formatVND(pendingPayout),
      sub: t("partner.awaitingSettlement"),
      trend: "neutral" as const,
      icon: Clock,
    },
  ]

  // ─── CSV export ───────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (data.bookings.length === 0) return
    const filename = `dinomad-earnings-${filterValue.startDate}_${filterValue.endDate}.csv`

    const header = [
      "Booking Code",
      "Room",
      "Guest",
      "Date",
      "Room Fee (your earnings)",
      "Platform Fee (paid by guest)",
      "Held by DiNOMAD",
      "Collected at Counter",
    ].join(",")
    const rows = data.bookings.map(b =>
      [
        b.bookingCode,
        `"${b.roomName}"`,
        `"${b.guestName}"`,
        b.date,
        b.net,
        b.platformFee,
        b.heldByPlatform,
        b.dueAtCounter,
      ].join(","),
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium">{t("partner.loadingEarnings")}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {t("partner.earningsTitle")}
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">
          {t("partner.earningsSubtitle")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-border/50 bg-card p-5 md:p-6 shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground tracking-tight">{card.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{card.value}</span>
              <div className={cn(
                "flex items-center gap-1 mt-3 text-[10px] font-semibold",
                card.trend === "up" ? "text-emerald-600" : card.trend === "down" ? "text-red-600" : "text-muted-foreground",
              )}>
                {card.trend === "up" && <TrendingUp className="h-3 w-3" />}
                {card.trend === "down" && <TrendingDown className="h-3 w-3" />}
                {card.sub}
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue chart */}
      <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-3 text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            {locale.startsWith("vi") 
              ? `Doanh Thu — ${filterValue.label}` 
              : `Earnings — ${filterValue.label}`}
          </h2>
          
          {/* Universal Time Filter (Day, Week, Month) */}
          <EarningsTimeFilter
            value={filterValue}
            onChange={(val) => setFilterValue(val)}
            locale={locale}
          />
        </div>

        {chartDays.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {t("partner.noDataPeriod")}
          </div>
        ) : (
          <div className="flex items-end justify-between gap-1.5 h-40 px-2">
            {chartDays.map((day, i) => {
              const heightPct = (day.revenue / chartMax) * 100
              const isLast = i === chartDays.length - 1
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <div
                    className={cn(
                      "w-full max-w-[28px] rounded-t-lg transition-all duration-300 group-hover:-translate-y-0.5",
                      isLast ? "bg-primary" : "bg-primary/15 hover:bg-primary/30",
                    )}
                    style={{ height: `${heightPct}%` }}
                    title={formatVND(day.revenue)}
                  />
                  <span className="text-[9px] font-medium text-muted-foreground hidden sm:block">
                    {day.date.slice(8)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Per-booking breakdown */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-border/50">
          <h2 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            {t("partner.perBookingBreakdown")}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground bg-muted/40 border border-border/50 rounded-full px-2.5 py-1">
              {data.bookings.length} {t("partner.bookingsCountLabel")}
            </span>
            {data.bookings.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-background border border-border/60 hover:border-border rounded-xl px-3 py-1.5 transition-all shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            )}
          </div>
        </div>

        {data.bookings.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t("partner.noBookingsPeriod")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 whitespace-nowrap">{t("confirmation.bookingId")}</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{t("confirmation.room")}</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{t("landing.date")}</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{t("partner.guestPlatformFee")}</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{t("partner.heldByPlatform")}</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{t("partner.dueAtCounter")}</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3 whitespace-nowrap">{t("partner.netEarnings")}</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b: EarningsBookingRow, i: number) => {
                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        "border-b border-border/30 transition-colors hover:bg-muted/20",
                        i % 2 === 0 ? "bg-card" : "bg-muted/5",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-foreground">{b.bookingCode}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-foreground">{b.roomName}</span>
                          <span className="text-[11px] text-muted-foreground">{b.guestName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground">{b.date}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs text-muted-foreground">{formatVND(b.platformFee)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-medium text-foreground">{formatVND(b.heldByPlatform)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-medium text-foreground">{formatVND(b.dueAtCounter)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs font-bold text-emerald-700">{formatVND(b.net)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="p-5 md:p-6 border-b border-border/50">
          <h2 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            {t("partner.payoutHistory")}
          </h2>
        </div>
        <div className="flex flex-col divide-y divide-border/30">
          {mockPayouts.map((payout, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">{payout.date}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{payout.ref}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">{formatVND(payout.amount)}</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                  {t("partner.payoutPaid")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
