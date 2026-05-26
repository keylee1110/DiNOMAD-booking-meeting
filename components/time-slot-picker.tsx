"use client"

import { useTranslation } from "@/lib/i18n/context"
import type { TimeSlot } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/data/time-slots"
import { getNextDays, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selectedSlots: TimeSlot[]
  onToggleSlot: (slot: TimeSlot) => void
  selectedDate: string
  onDateChange: (date: string) => void
}

export function TimeSlotPicker({ slots, selectedSlots, onToggleSlot, selectedDate, onDateChange }: TimeSlotPickerProps) {
  const { locale, t } = useTranslation()
  const days = getNextDays(7)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-3 text-sm font-semibold tracking-tight text-foreground">{t("room.selectDate")}</h4>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 text-sm transition-all duration-300 shadow-sm",
                selectedDate === day
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-90">
                {i === 0 ? t("room.today") : i === 1 ? t("room.tomorrow") : "\u00A0"}
              </span>
              <span className="font-bold text-lg">{formatDate(day, locale)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-border/40 pt-4">
          <h4 className="text-sm font-semibold tracking-tight text-foreground">{t("room.selectTime")}</h4>
          <div className="flex items-center gap-4 text-xs font-semibold tracking-tight text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-full border border-border/60 bg-background" />
              {t("room.available")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-full border border-border/40 bg-muted/60 opacity-60 relative after:content-[''] after:absolute after:inset-0 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wLDggTDgsMCBaIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')] after:bg-repeat" />
              {t("room.booked")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-full border border-primary/20 bg-primary" />
              {t("room.selected")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {slots.map((slot) => {
            const isSelected = selectedSlots.some((s) => s.id === slot.id)
            return (
              <Button
                key={slot.id}
                variant="outline"
                size="sm"
                disabled={!slot.available}
                onClick={() => slot.available && onToggleSlot(slot)}
                className={cn(
                  "h-12 px-2 py-2 text-sm font-semibold rounded-xl border transition-all duration-300",
                  !slot.available && "cursor-not-allowed bg-muted/30 border-border/40 text-muted-foreground/60 opacity-50 relative after:content-[''] after:absolute after:inset-0 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wLDggTDgsMCBaIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')] after:bg-repeat shadow-none",
                  slot.available && !isSelected && "border-border/60 bg-background text-foreground hover:border-primary/50 hover:bg-primary/5 shadow-sm active:scale-[0.98]",
                  isSelected && "border-transparent bg-primary text-primary-foreground shadow-sm active:scale-[0.98]"
                )}
              >
                {formatTime(slot.startTime)}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

