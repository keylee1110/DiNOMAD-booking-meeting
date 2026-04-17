"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import type { TimeSlot } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/data/time-slots"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Parse "YYYY-MM-DD" into a local Date (no timezone shift) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Format Date to display label */
function formatDisplayDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selectedSlots: TimeSlot[]
  onToggleSlot: (slot: TimeSlot) => void
  selectedDate: string        // "YYYY-MM-DD"
  onDateChange: (date: string) => void
}

export function TimeSlotPicker({
  slots,
  selectedSlots,
  onToggleSlot,
  selectedDate,
  onDateChange,
}: TimeSlotPickerProps) {
  const { locale, t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const calendarDate = selectedDate ? parseLocalDate(selectedDate) : undefined

  const handleCalendarSelect = (date?: Date) => {
    if (!date) return
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    onDateChange(`${y}-${m}-${d}`)
    setOpen(false)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* ── Compact Date Picker ── */}
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-foreground">{t("room.selectDate")}</h4>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 rounded-xl justify-start text-left font-normal border-border/60 bg-white/60 hover:bg-white/80 backdrop-blur-sm",
                !calendarDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
              {calendarDate
                ? formatDisplayDate(calendarDate, locale)
                : <span>{t("room.selectDate")}</span>
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-xl" align="start">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={handleCalendarSelect}
              defaultMonth={calendarDate}
              captionLayout="dropdown"
              disabled={{ before: today }}
              className="rounded-2xl"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Time Slots ── */}
      <div>
        <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-border/40 pt-4">
          <h4 className="text-sm font-semibold text-foreground">{t("room.selectTime")}</h4>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-border bg-background" />
              {t("room.available")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-sm border border-border bg-muted/60 opacity-50" />
              {t("room.booked")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-sm bg-primary" />
              {t("room.selected")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const isSelected = selectedSlots.some((s) => s.id === slot.id)
            return (
              <button
                key={slot.id}
                disabled={!slot.available}
                onClick={() => slot.available && onToggleSlot(slot)}
                className={cn(
                  "h-12 rounded-xl px-2 text-sm font-semibold transition-all duration-200 border",
                  !slot.available &&
                    "cursor-not-allowed bg-muted/40 border-border/30 text-muted-foreground/50 line-through",
                  slot.available &&
                    !isSelected &&
                    "border-border/50 bg-white/50 text-foreground hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-95",
                  isSelected &&
                    "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                )}
              >
                {formatTime(slot.startTime)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
