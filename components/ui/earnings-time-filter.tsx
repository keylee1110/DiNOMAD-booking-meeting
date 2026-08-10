"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export type PeriodMode = "daily" | "weekly" | "monthly"

export interface TimeFilterValue {
  period: PeriodMode
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  label: string     // Display text
}

interface EarningsTimeFilterProps {
  value: TimeFilterValue
  onChange: (newValue: TimeFilterValue) => void
  locale?: string
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDM(dStr: string): string {
  const parts = dStr.split("-")
  if (parts.length !== 3) return dStr
  return `${parts[2]}/${parts[1]}`
}

function formatDMY(dStr: string): string {
  const parts = dStr.split("-")
  if (parts.length !== 3) return dStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/** Returns Monday of the week for a given date */
function getMonday(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay()
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff))
}

export function EarningsTimeFilter({ value, onChange, locale = "vi font-sans" }: EarningsTimeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const now = useMemo(() => new Date(), [])
  const todayStr = useMemo(() => formatYMD(now), [now])

  // Year state for monthly picker view
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const [viewYear, setViewYear] = useState(currentYear)

  // Week offset state for weekly picker
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const monthNamesVi = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ]
  const monthNamesEn = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
  ]
  const monthNames = locale.startsWith("vi") ? monthNamesVi : monthNamesEn

  // ─── Actions for Mode Switch ───────────────────────────────────────────────

  const handleSelectPeriod = (newPeriod: PeriodMode) => {
    if (newPeriod === "daily") {
      // Default to last 14 days
      const d14 = new Date(now)
      d14.setDate(d14.getDate() - 13)
      onChange({
        period: "daily",
        startDate: formatYMD(d14),
        endDate: todayStr,
        label: locale.startsWith("vi") ? "14 ngày gần nhất" : "Last 14 days",
      })
    } else if (newPeriod === "weekly") {
      // Default to current week (Monday to Sunday)
      const monday = getMonday(now)
      const sunday = new Date(monday)
      sunday.setDate(sunday.getDate() + 6)
      const end = sunday > now ? now : sunday
      onChange({
        period: "weekly",
        startDate: formatYMD(monday),
        endDate: formatYMD(end),
        label: locale.startsWith("vi")
          ? `Tuần này (${formatDM(formatYMD(monday))} - ${formatDM(formatYMD(end))})`
          : `This week (${formatDM(formatYMD(monday))} - ${formatDM(formatYMD(end))})`,
      })
      setWeekOffset(0)
    } else if (newPeriod === "monthly") {
      // Default to current month
      const start = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
      onChange({
        period: "monthly",
        startDate: start,
        endDate: todayStr,
        label: locale.startsWith("vi")
          ? `Tháng Này (${currentMonth}/${currentYear})`
          : `This Month (${currentMonth}/${currentYear})`,
      })
    }
  }

  // ─── Daily Custom Selection ──────────────────────────────────────────────

  const handleSelectDayPreset = (preset: "today" | "yesterday" | "d7" | "d14") => {
    const todayObj = new Date(now)
    if (preset === "today") {
      onChange({
        period: "daily",
        startDate: todayStr,
        endDate: todayStr,
        label: locale.startsWith("vi") ? `Hôm nay (${formatDM(todayStr)})` : `Today (${formatDM(todayStr)})`,
      })
    } else if (preset === "yesterday") {
      const yest = new Date(todayObj)
      yest.setDate(yest.getDate() - 1)
      const yestStr = formatYMD(yest)
      onChange({
        period: "daily",
        startDate: yestStr,
        endDate: yestStr,
        label: locale.startsWith("vi") ? `Hôm qua (${formatDM(yestStr)})` : `Yesterday (${formatDM(yestStr)})`,
      })
    } else if (preset === "d7") {
      const d7 = new Date(todayObj)
      d7.setDate(d7.getDate() - 6)
      onChange({
        period: "daily",
        startDate: formatYMD(d7),
        endDate: todayStr,
        label: locale.startsWith("vi") ? "7 ngày qua" : "Last 7 days",
      })
    } else if (preset === "d14") {
      const d14 = new Date(todayObj)
      d14.setDate(d14.getDate() - 13)
      onChange({
        period: "daily",
        startDate: formatYMD(d14),
        endDate: todayStr,
        label: locale.startsWith("vi") ? "14 ngày qua" : "Last 14 days",
      })
    }
    setIsOpen(false)
  }

  const handleSelectCustomDay = (dateStr: string) => {
    if (!dateStr) return
    onChange({
      period: "daily",
      startDate: dateStr,
      endDate: dateStr,
      label: locale.startsWith("vi") ? `Ngày ${formatDMY(dateStr)}` : `Day ${formatDMY(dateStr)}`,
    })
    setIsOpen(false)
  }

  // ─── Weekly Selection ─────────────────────────────────────────────────────

  const handleWeekChange = (offset: number) => {
    const mon = getMonday(now)
    mon.setDate(mon.getDate() + offset * 7)
    const sun = new Date(mon)
    sun.setDate(sun.getDate() + 6)

    const startStr = formatYMD(mon)
    const endStr = formatYMD(sun > now ? now : sun)

    const isThisWeek = offset === 0
    const label = isThisWeek
      ? (locale.startsWith("vi") ? `Tuần này (${formatDM(startStr)} - ${formatDM(endStr)})` : `This Week (${formatDM(startStr)} - ${formatDM(endStr)})`)
      : (locale.startsWith("vi") ? `Tuần ${formatDM(startStr)} - ${formatDM(formatYMD(sun))}` : `Week ${formatDM(startStr)} - ${formatDM(formatYMD(sun))}`)

    setWeekOffset(offset)
    onChange({
      period: "weekly",
      startDate: startStr,
      endDate: endStr,
      label,
    })
  }

  // ─── Monthly Selection ────────────────────────────────────────────────────

  const handleSelectMonth = (year: number, month: number) => {
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const lastDayObj = new Date(Date.UTC(year, month, 0))
    let end = `${year}-${String(month).padStart(2, "0")}-${String(lastDayObj.getUTCDate()).padStart(2, "0")}`

    if (year === currentYear && month === currentMonth) {
      end = todayStr
    }

    const isCurrent = year === currentYear && month === currentMonth
    const label = isCurrent
      ? (locale.startsWith("vi") ? `Tháng Này (${month}/${year})` : `This Month (${month}/${year})`)
      : `${monthNames[month - 1]}, ${year}`

    onChange({
      period: "monthly",
      startDate: start,
      endDate: end,
      label,
    })
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Main Filter Bar Container */}
      <div className="flex items-center gap-2">
        {/* Trigger Popover Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md active:scale-98 cursor-pointer select-none backdrop-blur-md",
            isOpen && "border-primary ring-2 ring-primary/20 bg-card shadow-md",
          )}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <span className="tracking-tight max-w-[170px] sm:max-w-none truncate">{value.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-primary",
            )}
          />
        </button>

        {/* Period Tabs Pill (Ngày | Tuần | Tháng) */}
        <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => handleSelectPeriod("daily")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              value.period === "daily"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale.startsWith("vi") ? "Ngày" : "Daily"}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPeriod("weekly")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              value.period === "weekly"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale.startsWith("vi") ? "Tuần" : "Weekly"}
          </button>

          <button
            type="button"
            onClick={() => handleSelectPeriod("monthly")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              value.period === "monthly"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {locale.startsWith("vi") ? "Tháng" : "Monthly"}
          </button>
        </div>
      </div>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/80 bg-card/98 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.15)] backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Mode Header Tabs */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {locale.startsWith("vi") ? "Lọc theo thời gian" : "Select Time Range"}
            </span>

            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase">
              {value.period}
            </span>
          </div>

          {/* ────────────────── 1. DAILY MODE POPOVER ────────────────── */}
          {value.period === "daily" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectDayPreset("today")}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold bg-muted/40 border border-border/40 text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{locale.startsWith("vi") ? "Hôm nay" : "Today"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDayPreset("yesterday")}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold bg-muted/40 border border-border/40 text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{locale.startsWith("vi") ? "Hôm qua" : "Yesterday"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDayPreset("d7")}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold bg-muted/40 border border-border/40 text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                >
                  <span>{locale.startsWith("vi") ? "7 ngày qua" : "Last 7 days"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDayPreset("d14")}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold bg-muted/40 border border-border/40 text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                >
                  <span>{locale.startsWith("vi") ? "14 ngày qua" : "Last 14 days"}</span>
                </button>
              </div>

              {/* Custom Specific Date Input */}
              <div className="pt-2 border-t border-border/40 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {locale.startsWith("vi") ? "Chọn ngày cụ thể:" : "Choose specific date:"}
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={value.startDate === value.endDate ? value.startDate : ""}
                  onChange={(e) => handleSelectCustomDay(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ────────────────── 2. WEEKLY MODE POPOVER ────────────────── */}
          {value.period === "weekly" && (
            <div className="flex flex-col gap-3">
              {/* Week Switcher Control */}
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2">
                <button
                  type="button"
                  onClick={() => handleWeekChange(weekOffset - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title={locale.startsWith("vi") ? "Tuần trước" : "Previous week"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="text-center">
                  <p className="text-xs font-extrabold text-foreground">
                    {weekOffset === 0
                      ? (locale.startsWith("vi") ? "TUẦN NÀY" : "THIS WEEK")
                      : weekOffset === -1
                      ? (locale.startsWith("vi") ? "TUẦN TRƯỚC" : "LAST WEEK")
                      : (locale.startsWith("vi") ? `${Math.abs(weekOffset)} tuần trước` : `${Math.abs(weekOffset)} weeks ago`)}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {formatDMY(value.startDate)} → {formatDMY(value.endDate)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleWeekChange(weekOffset + 1)}
                  disabled={weekOffset >= 0}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title={locale.startsWith("vi") ? "Tuần sau" : "Next week"}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Week Presets */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleWeekChange(0)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold border transition-all cursor-pointer",
                    weekOffset === 0
                      ? "bg-primary/10 border-primary/30 text-primary shadow-xs"
                      : "bg-muted/40 border-border/40 text-foreground hover:bg-muted",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{locale.startsWith("vi") ? "Tuần này" : "This Week"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleWeekChange(-1)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold border transition-all cursor-pointer",
                    weekOffset === -1
                      ? "bg-primary/10 border-primary/30 text-primary shadow-xs"
                      : "bg-muted/40 border-border/40 text-foreground hover:bg-muted",
                  )}
                >
                  <span>{locale.startsWith("vi") ? "Tuần trước" : "Last Week"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ────────────────── 3. MONTHLY MODE POPOVER ────────────────── */}
          {value.period === "monthly" && (
            <div className="flex flex-col gap-3">
              {/* Year Switcher Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <button
                  type="button"
                  onClick={() => setViewYear(viewYear - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5 font-extrabold text-sm text-foreground">
                  <span>{viewYear}</span>
                  {viewYear === currentYear && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {locale.startsWith("vi") ? "Năm nay" : "Current"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewYear(viewYear + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Month Presets */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectMonth(currentYear, currentMonth)}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[11px] font-bold bg-primary/10 border border-primary/30 text-primary transition-all cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{locale.startsWith("vi") ? "Tháng này" : "This Month"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const prevM = currentMonth === 1 ? 12 : currentMonth - 1
                    const prevY = currentMonth === 1 ? currentYear - 1 : currentYear
                    handleSelectMonth(prevY, prevM)
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl py-1.5 px-2 text-[11px] font-bold bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                >
                  <span>{locale.startsWith("vi") ? "Tháng trước" : "Last Month"}</span>
                </button>
              </div>

              {/* 12 Months Grid (4x3) */}
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((name, idx) => {
                  const mNum = idx + 1
                  const mStart = `${viewYear}-${String(mNum).padStart(2, "0")}-01`
                  const isSelected = value.startDate.startsWith(`${viewYear}-${String(mNum).padStart(2, "0")}`)
                  const isTodayMonth = currentYear === viewYear && currentMonth === mNum

                  return (
                    <button
                      key={mNum}
                      type="button"
                      onClick={() => handleSelectMonth(viewYear, mNum)}
                      className={cn(
                        "relative flex items-center justify-center rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 border cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md font-bold scale-[1.03]"
                          : "bg-background border-border/50 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                      )}
                    >
                      <span>{name}</span>
                      {isTodayMonth && !isSelected && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                      {isSelected && (
                        <Check className="absolute top-1 right-1 h-3 w-3 text-primary-foreground" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
