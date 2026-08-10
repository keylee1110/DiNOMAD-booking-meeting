"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthYearPickerProps {
  selectedYear: number
  selectedMonth: number // 1..12
  onChange: (year: number, month: number) => void
  locale?: string
}

export function MonthYearPicker({
  selectedYear,
  selectedMonth,
  onChange,
  locale = "vi",
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewYear, setViewYear] = useState(selectedYear)
  const containerRef = useRef<HTMLDivElement>(null)

  const now = useMemo(() => new Date(), [])
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sync viewYear when selectedYear changes
  useEffect(() => {
    setViewYear(selectedYear)
  }, [selectedYear])

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

  const monthNames = locale === "vi" ? monthNamesVi : monthNamesEn

  const isCurrentMonthSelected = selectedYear === currentYear && selectedMonth === currentMonth

  const displayLabel = isCurrentMonthSelected
    ? (locale === "vi" ? `Tháng Này (${selectedMonth}/${selectedYear})` : `This Month (${selectedMonth}/${selectedYear})`)
    : `${monthNames[selectedMonth - 1]}, ${selectedYear}`

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-card hover:shadow-md active:scale-98 backdrop-blur-md cursor-pointer select-none",
          isOpen && "border-primary ring-2 ring-primary/20 bg-card shadow-md",
        )}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Calendar className="h-3.5 w-3.5" />
        </div>
        <span className="tracking-tight">{displayLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Header: Year Selector */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={locale === "vi" ? "Năm trước" : "Previous year"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-tight text-foreground">
              <span>{viewYear}</span>
              {viewYear === currentYear && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {locale === "vi" ? "Năm nay" : "Current"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={locale === "vi" ? "Năm sau" : "Next year"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => {
                onChange(currentYear, currentMonth)
                setIsOpen(false)
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-[11px] font-bold transition-all border cursor-pointer",
                isCurrentMonthSelected
                  ? "bg-primary/10 border-primary/30 text-primary shadow-xs"
                  : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{locale === "vi" ? "Tháng này" : "This Month"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const prevM = currentMonth === 1 ? 12 : currentMonth - 1
                const prevY = currentMonth === 1 ? currentYear - 1 : currentYear
                onChange(prevY, prevM)
                setIsOpen(false)
              }}
              className="flex items-center justify-center gap-1 rounded-xl py-1.5 px-2 text-[11px] font-bold bg-muted/40 border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            >
              <span>{locale === "vi" ? "Tháng trước" : "Last Month"}</span>
            </button>
          </div>

          {/* 12 Months Grid (4x3) */}
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((name, idx) => {
              const mNum = idx + 1
              const isSelected = selectedYear === viewYear && selectedMonth === mNum
              const isTodayMonth = currentYear === viewYear && currentMonth === mNum

              return (
                <button
                  key={mNum}
                  type="button"
                  onClick={() => {
                    onChange(viewYear, mNum)
                    setIsOpen(false)
                  }}
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
  )
}
