"use client"

import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { QrCode as DinomadQrCode } from "@/components/qr-code"
import { Users, QrCode as QrCodeIcon, CheckCircle2 } from "lucide-react"
import { formatVND, formatDate } from "@/lib/format"
import { formatTime } from "@/lib/data/time-slots"
import type { Booking, Room } from "@/lib/types"

interface ConfirmationViewProps {
  booking: Booking
  room: Room
  onBackHome: () => void
  locale: string
}

export function ConfirmationView({
  booking,
  room,
  onBackHome,
  locale
}: ConfirmationViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <CardTitle className="text-2xl text-emerald-500 font-extrabold">{t("confirmation.title")}</CardTitle>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t("confirmation.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("confirmation.bookingId")}</p>
                    <p className="mt-1 font-black text-lg">{booking.id}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {room.capacity} {t("common.people")}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{t("confirmation.room")}</span>
                    <span className="font-medium">{booking.roomName}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{t("confirmation.venue")}</span>
                    <span className="font-medium">
                      {booking.venueName}
                      <span className="text-xs text-muted-foreground"> ({room.district})</span>
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{t("confirmation.dateTime")}</span>
                    <span className="font-medium">
                      {formatDate(booking.date, locale)} {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{t("checkout.total")}</span>
                    <span className="font-black text-primary">{formatVND(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold">{t("confirmation.wifiPassword")}</p>
                <p className="mt-2 font-mono text-lg font-bold text-primary">{booking.wifiPassword}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {locale === "vi" ? "Được cập nhật từ hệ thống demo." : "Provided by demo system."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <QrCodeIcon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{t("confirmation.checkInQR")}</p>
                </div>
                <div className="mt-3 flex items-center justify-center">
                  <DinomadQrCode
                    data={booking.checkInQr}
                    size={160}
                    className="rounded-lg overflow-hidden"
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t("confirmation.showQR")}</p>
              </div>

              <Button
                className="w-full rounded-none"
                size="lg"
                onClick={onBackHome}
              >
                {t("confirmation.backHome")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
