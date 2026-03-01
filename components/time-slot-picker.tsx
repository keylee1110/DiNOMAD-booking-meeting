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
        <h4 className="mb-3 text-sm font-black uppercase tracking-wider text-foreground">{t("room.selectDate")}</h4>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-none border-2 px-4 py-3 text-sm transition-all",
                selectedDate === day
                  ? "border-primary bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_var(--color-foreground)] -translate-y-1"
                  : "border-border bg-card text-foreground hover:border-primary shadow-[2px_2px_0px_0px_var(--color-border)] hover:-translate-y-0.5"
              )}
            >
              <span className="text-xs font-bold uppercase tracking-wider mb-1">
                {i === 0 ? t("room.today") : i === 1 ? t("room.tomorrow") : "\u00A0"}
              </span>
              <span className="font-black text-lg">{formatDate(day, locale)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t-2 border-border pt-4">
          <h4 className="text-sm font-black uppercase tracking-wider text-foreground">{t("room.selectTime")}</h4>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 border-2 border-border bg-background shadow-[2px_2px_0px_0px_var(--color-border)]" />
              {t("room.available")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 border-2 border-border bg-muted/80 opacity-50 relative after:content-[''] after:absolute after:inset-0 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wLDggTDgsMCBaIiBzdHJva2U9IiNhMGEwYTAiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] after:bg-repeat" />
              {t("room.booked")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 border-2 border-foreground bg-primary shadow-[2px_2px_0px_0px_var(--color-foreground)]" />
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
                  "h-14 px-2 py-2 text-sm font-black rounded-none border-2",
                  !slot.available && "cursor-not-allowed bg-muted/50 border-border text-muted-foreground opacity-60 relative after:content-[''] after:absolute after:inset-0 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wLDggTDgsMCBaIiBzdHJva2U9IiNhMGEwYTAiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] after:bg-repeat",
                  slot.available && !isSelected && "border-border bg-background text-foreground hover:border-primary hover:bg-primary/5 shadow-[2px_2px_0px_0px_var(--color-border)] hover:shadow-[3px_3px_0px_0px_#64B5F6] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_#64B5F6]",
                  isSelected && "border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_var(--color-foreground)] -translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_0px_var(--color-foreground)]"
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

