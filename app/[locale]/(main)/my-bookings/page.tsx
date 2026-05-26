"use client"

import { useBooking } from "@/lib/store/booking-store"
import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Receipt, Wifi, QrCode as QrIcon } from "lucide-react"
import { formatVNDFull } from "@/lib/format"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MyBookingsPage() {
  const { myBookings, refreshBookings } = useBooking()
  const { locale, t } = useTranslation()

  const getStatusBadge = (status: string) => {
    const isVi = locale === "vi"
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20 font-semibold px-2.5 py-0.5 hover:bg-emerald-500/25 transition-colors">{isVi ? "Đã xác nhận" : "Confirmed"}</Badge>
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20 font-semibold px-2.5 py-0.5 hover:bg-amber-500/25 transition-colors">{isVi ? "Chờ xử lý" : "Pending"}</Badge>
      case "completed":
        return <Badge className="bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/20 font-semibold px-2.5 py-0.5 hover:bg-slate-500/25 transition-colors">{isVi ? "Hoàn thành" : "Completed"}</Badge>
      case "checked_in":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20 font-semibold px-2.5 py-0.5 hover:bg-blue-500/25 transition-colors">{isVi ? "Đã check-in" : "Checked In"}</Badge>
      default:
        return <Badge variant="outline" className="font-semibold px-2.5 py-0.5">{status}</Badge>
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {locale === "vi" ? "Đơn đặt của tôi" : "My Bookings"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === "vi" 
              ? "Xem lại lịch sử đặt chỗ và mã check-in của bạn." 
              : "View your booking history and check-in codes."}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshBookings()}
          className="w-fit"
        >
          {locale === "vi" ? "Làm mới" : "Refresh"}
        </Button>
      </div>

      {myBookings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">{locale === "vi" ? "Chưa có đơn đặt nào" : "No bookings found"}</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            {locale === "vi" 
              ? "Bạn chưa thực hiện đơn đặt chỗ nào. Hãy bắt đầu tìm kiếm không gian làm việc lý tưởng ngay!" 
              : "You haven't made any bookings yet. Start searching for your ideal workspace now!"}
          </p>
          <Link href={`/${locale}/search`} className="mt-6">
            <Button>{locale === "vi" ? "Tìm kiếm ngay" : "Search Now"}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6">
          {myBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-2 transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row">
                {/* Status and Summary Side */}
                <div className="bg-muted/30 p-6 md:w-64 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border">
                  <div>
                    <div className="mb-3">{getStatusBadge(booking.status)}</div>
                    <div className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                      {booking.id}
                    </div>
                    <h3 className="font-bold text-lg leading-tight">{booking.roomName}</h3>
                    <p className="text-sm text-primary font-medium mt-1">{booking.venueName}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("checkout.total")}</span>
                      <span className="font-bold text-foreground">{formatVNDFull(booking.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Details Side */}
                <div className="flex-1 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {t("checkout.date")}
                        </p>
                        <p className="text-sm font-semibold">{booking.date}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {t("checkout.time")}
                        </p>
                        <p className="text-sm font-semibold">{booking.startTime} - {booking.endTime}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {locale === "vi" ? "Địa chỉ" : "Address"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{booking.venueAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 border border-blue-100 uppercase tracking-tight">
                      <Wifi className="h-3 w-3" />
                      Pass: {booking.wifiPassword || "********"}
                    </div>
                    <Link href={`/${locale}/checkout/success?id=${booking.id}`} className="ml-auto">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase tracking-wider gap-2">
                        <QrIcon className="h-3 w-3" />
                        {locale === "vi" ? "Xem mã QR" : "View QR Code"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
