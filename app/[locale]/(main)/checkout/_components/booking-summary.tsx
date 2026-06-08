"use client"

import { useMemo } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/countdown-timer"
import { PriceDisplay } from "@/components/price-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MapPin, Clock, Loader2 } from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import { formatTime } from "@/lib/data/time-slots"
import type { Room, TimeSlot } from "@/lib/types"

interface BookingSummaryProps {
  room: Room
  selectedDate: string
  selectedSlots: TimeSlot[]
  durationHours: number
  roomFee: number
  platformFee: number
  totalPrice: number
  softLockExpired: boolean
  softLockDurationSeconds: number
  countdownKey: number
  onExpire: () => void
  isPaying: boolean
  canProceed: boolean
  onProceed: () => void
  locale: string
  pointsDiscount?: number
  pointsEarned?: number
}

export function BookingSummary({
  room,
  selectedDate,
  selectedSlots,
  durationHours,
  roomFee,
  platformFee,
  totalPrice,
  softLockExpired,
  softLockDurationSeconds,
  countdownKey,
  onExpire,
  isPaying,
  canProceed,
  onProceed,
  locale,
  pointsDiscount = 0,
  pointsEarned = 0
}: BookingSummaryProps) {
  const { t } = useTranslation()

  const sortedSlots = useMemo(() => 
    [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedSlots]
  )

  const startTimeLabel = sortedSlots.length > 0 ? formatTime(sortedSlots[0].startTime) : ""
  const endTimeLabel = sortedSlots.length > 0 ? formatTime(sortedSlots[sortedSlots.length - 1].endTime) : ""

  return (
    <Card className="p-5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("checkout.bookingSummary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("confirmation.room")}</p>
              <p className="mt-1 font-black text-lg">{room.name}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {room.venueName}
                <span className="text-muted-foreground">·</span>
                {room.district}
              </p>
            </div>
            {room.verified && (
              <span className="rounded-full border bg-background px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {t("common.verified")}
              </span>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid gap-2">
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground">{locale === "vi" ? "Ngày" : "Date"}</span>
              <span className="text-sm font-medium">{formatDate(selectedDate, locale)}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground">{locale === "vi" ? "Thời gian" : "Time"}</span>
              <span className="text-sm font-medium">
                {startTimeLabel} - {endTimeLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{t("room.selected")}</span>
              <div className="flex flex-wrap justify-end gap-2">
                {sortedSlots.map((slot) => (
                  <span
                    key={slot.id}
                    className="rounded-full border bg-background px-2 py-1 text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    {formatTime(slot.startTime)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground">{t("room.duration")}</span>
              <span className="text-sm font-medium">{durationHours}h</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t("checkout.timeRemaining")}</p>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {softLockExpired ? (
              <Alert variant="destructive" className="rounded-none">
                <AlertTitle>{locale === "vi" ? "Hết thời gian giữ phòng" : "Hold time expired"}</AlertTitle>
                <AlertDescription>
                  {locale === "vi" ? "Vui lòng chọn lại thời gian và đặt phòng." : "Please select a new time and book again."}
                </AlertDescription>
              </Alert>
            ) : (
              <CountdownTimer
                key={countdownKey}
                durationSeconds={softLockDurationSeconds}
                onExpire={onExpire}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("checkout.softLockNote")}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("checkout.roomFee")}</span>
            <span className="font-medium">{formatVND(roomFee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
            <span className="font-medium">{formatVND(platformFee)}</span>
          </div>
          {pointsDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-primary animate-in fade-in duration-200">
              <span className="font-medium">{locale === "vi" ? "Khấu trừ điểm thưởng" : "Points Discount"}</span>
              <span className="font-bold">-{formatVND(pointsDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold">{t("checkout.total")}</span>
            <span className="text-lg font-black text-primary">{formatVND(totalPrice)}</span>
          </div>
          {pointsEarned > 0 && (
            <div className="flex items-center justify-between border-t border-dashed border-border/40 pt-2 text-[10px] text-amber-600 font-bold uppercase tracking-wider animate-in fade-in duration-200">
              <span>{locale === "vi" ? "Tích lũy điểm thưởng" : "Points to earn"}</span>
              <span>+{new Intl.NumberFormat("vi-VN").format(pointsEarned)} điểm</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full rounded-xl hidden lg:flex items-center justify-center gap-2 px-4 text-sm font-bold uppercase tracking-wider shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01] transition-all"
          size="lg"
          onClick={onProceed}
          disabled={!canProceed}
        >
          {isPaying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("payment.waitingPayment")}
            </span>
          ) : (
            t("checkout.proceedPayment")
          )}
          {!isPaying && <PriceDisplay amount={totalPrice} className="font-bold text-primary-foreground" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
