"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import type { TimeSlot } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/data/time-slots"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selectedSlots: TimeSlot[]
  onToggleSlot: (slot: TimeSlot) => void
  selectedDate: string
  onDateChange: (date: string) => void
}

export function TimeSlotPicker({ slots, selectedSlots, onToggleSlot, selectedDate, onDateChange }: TimeSlotPickerProps) {
  const { locale, t } = useTranslation()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Long date format for premium display
  const getFormattedDateLong = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Parse YYYY-MM-DD string to local Date object
  const parsedDate = selectedDate ? new Date(selectedDate + "T00:00:00") : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-3 text-sm font-semibold tracking-tight text-foreground">{t("room.selectDate")}</h4>
        
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 justify-between text-left font-semibold rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-all shadow-sm px-4",
                isPopoverOpen && "border-primary ring-1 ring-primary/20"
              )}
            >
              <span className="flex items-center gap-2 text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-sm">
                  {getFormattedDateLong(selectedDate) || t("landing.date")}
                </span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isPopoverOpen && "rotate-180")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border border-border/50 shadow-lg bg-card" align="start">
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={(date) => {
                if (date) {
                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, "0")
                  const dateVal = String(date.getDate()).padStart(2, "0")
                  const formatted = `${year}-${month}-${dateVal}`
                  onDateChange(formatted)
                  setIsPopoverOpen(false)
                }
              }}
              disabled={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
                  "h-12 px-2 py-2 text-sm font-semibold rounded-xl border transition-colors duration-150",
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

