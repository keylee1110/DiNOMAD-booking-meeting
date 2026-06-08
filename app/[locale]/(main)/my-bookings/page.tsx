"use client"

import { useState, useEffect } from "react"
import { useBooking } from "@/lib/store/booking-store"
import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Receipt, Wifi, QrCode as QrIcon, Star, MessageSquare, Sparkles, CheckCircle2 } from "lucide-react"
import { formatVNDFull } from "@/lib/format"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Booking } from "@/lib/types"
import { cn } from "@/lib/utils"

type FilterStatus = "all" | "confirmed" | "completed" | "cancelled"

export default function MyBookingsPage() {
  const { myBookings, refreshBookings } = useBooking()
  const { locale, t } = useTranslation()
  const supabase = createClient()
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all")

  const canCompleteBooking = (booking: Booking) => {
    if (booking.status !== "confirmed") return false
    try {
      const endDateTime = new Date(`${booking.date}T${booking.endTime}:00`)
      return new Date() > endDateTime
    } catch (e) {
      return false
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from("bookings")
          .update({ status: "completed" })
          .eq("id", bookingId)

        if (error) {
          toast.error(locale === "vi" ? `Lỗi: ${error.message}` : `Error: ${error.message}`)
          return
        }
        toast.success(locale === "vi" ? "Đơn đặt đã được hoàn thành!" : "Booking completed successfully!")
      } else {
        // Guest: update local storage
        const saved: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
        const updated = saved.map(b => b.id === bookingId ? { ...b, status: "completed" as const } : b)
        localStorage.setItem("dinomad_bookings", JSON.stringify(updated))
        toast.success(locale === "vi" ? "Đơn đặt đã được hoàn thành (Khách)!" : "Booking completed successfully (Guest)!")
      }
      refreshBookings()
    } catch (e: any) {
      console.error(e)
      toast.error(locale === "vi" ? "Đã xảy ra lỗi hệ thống!" : "A system error occurred!")
    }
  }

  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewedIds, setReviewedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem("dinomad_reviewed_bookings") || "[]")
    } catch {
      return []
    }
  })

  // Sync reviewed booking IDs from Supabase (handles multi-device)
  useEffect(() => {
    async function syncReviewedFromDb() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("customer_id", user.id)
      if (data && !error) {
        const dbIds = data.map((r: any) => r.booking_id).filter(Boolean)
        setReviewedIds((prev) => {
          const merged = Array.from(new Set([...prev, ...dbIds]))
          localStorage.setItem("dinomad_reviewed_bookings", JSON.stringify(merged))
          return merged
        })
      }
    }
    syncReviewedFromDb()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredBookings = activeFilter === "all"
    ? myBookings
    : myBookings.filter((b) => b.status === activeFilter)

  const filterCounts = {
    all: myBookings.length,
    confirmed: myBookings.filter((b) => b.status === "confirmed").length,
    completed: myBookings.filter((b) => b.status === "completed").length,
    cancelled: myBookings.filter((b) => b.status === "cancelled").length,
  }

  const handleOpenReview = (booking: Booking) => {
    setSelectedBooking(booking)
    setRating(5)
    setComment("")
    setIsReviewOpen(true)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from("reviews")
          .insert({
            room_id: selectedBooking.roomId,
            customer_id: user.id,
            booking_id: selectedBooking.id,
            rating,
            comment
          })

        if (error) {
          toast.error(locale === "vi" ? `Gửi đánh giá thất bại: ${error.message}` : `Failed to submit review: ${error.message}`)
        } else {
          toast.success(locale === "vi" ? "Đã gửi đánh giá thành công!" : "Review submitted successfully!")
          markAsReviewed(selectedBooking.id)
          setIsReviewOpen(false)
        }
      } else {
        toast.success(locale === "vi" ? "Đã gửi đánh giá thành công (Demo)!" : "Review submitted successfully (Demo)!")
        markAsReviewed(selectedBooking.id)
        setIsReviewOpen(false)
      }
    } catch (e: any) {
      console.error(e)
      toast.error(locale === "vi" ? "Đã xảy ra lỗi hệ thống!" : "A system error occurred!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const markAsReviewed = (bookingId: string) => {
    setReviewedIds((prev) => {
      const updated = [...prev, bookingId]
      localStorage.setItem("dinomad_reviewed_bookings", JSON.stringify(updated))
      return updated
    })
  }

  const getStatusBadge = (status: string) => {
    const isVi = locale === "vi"
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20 font-semibold px-2.5 py-0.5 hover:bg-emerald-500/25 transition-colors">{isVi ? "Đã xác nhận" : "Confirmed"}</Badge>
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20 font-semibold px-2.5 py-0.5 hover:bg-amber-500/25 transition-colors">{isVi ? "Chờ xử lý" : "Pending"}</Badge>
      case "completed":
        return <Badge className="bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-500/20 font-semibold px-2.5 py-0.5 hover:bg-slate-500/25 transition-colors">{isVi ? "Đã hoàn thành" : "Completed"}</Badge>
      case "checked_in":
        return <Badge className="bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20 font-semibold px-2.5 py-0.5 hover:bg-blue-500/25 transition-colors">{isVi ? "Đã check-in" : "Checked In"}</Badge>
      case "cancelled":
        return <Badge className="bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20 font-semibold px-2.5 py-0.5 hover:bg-red-500/25 transition-colors">{isVi ? "Đã hủy" : "Cancelled"}</Badge>
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
        <div className="flex flex-col gap-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {([
              { key: "all", labelVi: "Tất cả", labelEn: "All" },
              { key: "confirmed", labelVi: "Đã xác nhận", labelEn: "Confirmed" },
              { key: "completed", labelVi: "Đã hoàn thành", labelEn: "Completed" },
              { key: "cancelled", labelVi: "Đã hủy", labelEn: "Cancelled" },
            ] as const).map(({ key, labelVi, labelEn }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 border",
                  activeFilter === key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {locale === "vi" ? labelVi : labelEn}
                <span className={cn(
                  "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-black",
                  activeFilter === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {filterCounts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Booking Cards */}
          {filteredBookings.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-10 text-center border-dashed border-border/60">
              <p className="text-muted-foreground text-sm">
                {locale === "vi" ? "Không có đơn nào trong mục này." : "No bookings in this category."}
              </p>
            </Card>
          ) : (
          <div className="grid gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-2 transition-all hover:shadow-md">
              <div className="flex flex-col md:flex-row">
                {/* Status and Summary Side */}
                <div className="bg-muted/30 p-6 md:w-64 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border">
                  <div>
                    <div className="mb-3">{getStatusBadge(booking.status)}</div>
                    <div className="text-sm font-black text-primary mb-1 uppercase tracking-wide">
                      {booking.bookingCode || booking.id.slice(0, 11)}
                    </div>
                    {booking.bookingCode && (
                      <div className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                        ID: {booking.id.slice(0, 8)}...
                      </div>
                    )}
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
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {booking.venueAddress}{" "}
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.venueAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-bold text-xs ml-1.5 inline-flex items-center gap-0.5"
                          >
                            ({locale === "vi" ? "Xem bản đồ" : "View Map"})
                          </a>
                        </p>
                      </div>
                    </div>

                    {booking.pointsRedeemed && booking.pointsRedeemed > 0 ? (
                      <div className="flex items-start gap-3 sm:col-span-2 text-xs font-semibold text-primary/95 bg-primary/5 p-2.5 rounded-xl border border-primary/10">
                        <Sparkles className="h-4 w-4 shrink-0 text-primary animate-pulse" />
                        <div>
                          <span>
                            {locale === "vi"
                              ? `Đã dùng ${new Intl.NumberFormat("vi-VN").format(booking.pointsRedeemed)} điểm (giảm -${formatVNDFull(booking.pointsRedeemed)})`
                              : `Redeemed ${new Intl.NumberFormat("vi-VN").format(booking.pointsRedeemed)} points (discounted -${formatVNDFull(booking.pointsRedeemed)})`}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {booking.pointsEarned && booking.pointsEarned > 0 ? (
                      <div className="flex items-start gap-3 sm:col-span-2 text-xs font-semibold text-amber-700 bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/10">
                        <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                        <div>
                          <span>
                            {locale === "vi"
                              ? `Tích lũy thêm +${new Intl.NumberFormat("vi-VN").format(booking.pointsEarned)} điểm thưởng từ đơn này`
                              : `Earned +${new Intl.NumberFormat("vi-VN").format(booking.pointsEarned)} loyalty points from this booking`}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700 border border-blue-100 uppercase tracking-tight">
                      <Wifi className="h-3 w-3" />
                      Pass: {booking.wifiPassword || "********"}
                    </div>
                    {booking.status === "completed" && !reviewedIds.includes(booking.id) && (
                      <Button
                        onClick={() => handleOpenReview(booking)}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold uppercase tracking-wider gap-1.5 rounded-xl border-amber-500/20 text-amber-600 hover:bg-amber-500/8 hover:text-amber-700 bg-transparent animate-in fade-in zoom-in-95 duration-200"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {locale === "vi" ? "Viết đánh giá" : "Write Review"}
                      </Button>
                    )}
                    {booking.status === "completed" && reviewedIds.includes(booking.id) && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-tight">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {locale === "vi" ? "Đã đánh giá" : "Reviewed"}
                      </span>
                    )}
                    {canCompleteBooking(booking) && (
                      <Button
                        onClick={() => handleCompleteBooking(booking.id)}
                        size="sm"
                        className="h-8 text-xs font-bold uppercase tracking-wider gap-1.5 rounded-xl bg-success text-white hover:bg-success/90 border border-success/35 shadow-sm transition-all duration-200 active:scale-95 animate-in fade-in zoom-in-95 duration-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {locale === "vi" ? "Hoàn thành" : "Complete"}
                      </Button>
                    )}
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
      )}

      {/* Review & Rating Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <DialogHeader className="pb-2 border-b border-border/40">
              <DialogTitle className="text-xl font-bold text-foreground">
                {locale === "vi" ? "Đánh giá phòng họp" : "Rate Workspace"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {locale === "vi"
                  ? `Chia sẻ trải nghiệm của bạn tại ${selectedBooking?.roomName} (${selectedBooking?.venueName})`
                  : `Share your experience at ${selectedBooking?.roomName} (${selectedBooking?.venueName})`}
              </DialogDescription>
            </DialogHeader>

            {/* Stars Picker */}
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {locale === "vi" ? "Số sao đánh giá" : "Rating Stars"}
              </Label>
              <div className="flex gap-1.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 active:scale-95 transition-transform duration-100 cursor-pointer"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30 hover:text-yellow-200"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment area */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {locale === "vi" ? "Ý kiến đóng góp" : "Your Review Comment"}
              </Label>
              <Textarea
                id="comment"
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  locale === "vi"
                    ? "Không gian như thế nào? Wifi có nhanh không? Phục vụ ra sao?..."
                    : "How was the noise level? Is the AC cold? How was the service?..."
                }
                className="rounded-xl border-border bg-background text-sm font-semibold focus-visible:ring-primary/20"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/30 gap-2 flex flex-col sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewOpen(false)}
                className="rounded-xl h-11 text-xs font-bold uppercase tracking-wider border-border hover:bg-muted"
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/10 hover:shadow-lg bg-primary text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  locale === "vi" ? "Đang gửi..." : "Submitting..."
                ) : (
                  locale === "vi" ? "Gửi đánh giá" : "Submit Review"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
