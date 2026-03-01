"use client"

import { useState, useMemo, use } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { getRoomById, getReviewsByRoomId } from "@/lib/data/rooms"
import { generateTimeSlots } from "@/lib/data/time-slots"
import { useBooking } from "@/lib/store/booking-store"
import { formatVND, getNextDays, formatDate } from "@/lib/format"
import { TimeSlotPicker } from "@/components/time-slot-picker"
import { AmenityIcon } from "@/components/amenity-icon"
import { VerifiedBadge } from "@/components/verified-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Users, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import type { TimeSlot } from "@/lib/types"
import { notFound } from "next/navigation"

export default function RoomDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params)
  const { t } = useTranslation()
  const router = useRouter()
  const { state, dispatch } = useBooking()

  const room = getRoomById(id)
  if (!room) notFound()

  const reviews = getReviewsByRoomId(id)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(getNextDays(1)[0])
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])

  const slots = useMemo(() => generateTimeSlots(selectedDate, room.id), [selectedDate, room.id])

  const handleToggleSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.id === slot.id)
      if (exists) return prev.filter((s) => s.id !== slot.id)
      return [...prev, slot].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedSlots([])
  }

  const duration = selectedSlots.length * 0.5
  const roomFee = room.pricePerHour * duration
  const platformFee = Math.round(roomFee * 0.1)
  const totalPrice = roomFee + platformFee

  const handleBookNow = () => {
    dispatch({ type: "SET_ROOM", room })
    dispatch({ type: "SET_DATE", date: selectedDate })
    dispatch({ type: "SET_SLOTS", slots: selectedSlots })
    dispatch({ type: "CALCULATE_PRICE" })
    router.push(`/${locale}/checkout`)
  }

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % room.images.length)
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + room.images.length) % room.images.length)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: Details */}
        <div className="flex flex-col gap-6">
          {/* Photo Gallery */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
            <Image
              src={room.images[currentImageIndex] || room.images[0]}
              alt={room.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {room.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur hover:bg-background"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur hover:bg-background"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {room.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${i === currentImageIndex ? "bg-primary-foreground" : "bg-primary-foreground/50"}`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Room Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
                  {room.verified && <VerifiedBadge size="md" />}
                </div>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {room.venueName} &middot; {room.district}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-secondary/30 px-3 py-1.5">
                <Star className="h-5 w-5 fill-secondary text-secondary" />
                <span className="text-lg font-bold text-foreground">{room.rating}</span>
                <span className="text-sm text-muted-foreground">({room.reviewCount})</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {room.category === "solo_nook" ? `Còn ${room.slotsLeftToday} chỗ trống` : `${room.capacity} ${t("common.people")}`}
              </span>
              <span className="text-xl font-bold text-primary">
                {formatVND(room.pricePerHour)}<span className="text-xs font-normal text-muted-foreground">{t("common.perHour")}</span>
              </span>
            </div>

            <Button variant="outline" className="mt-5 w-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-medium" asChild>
              <a
                href={`https://www.google.com/maps?q=${room.lat},${room.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Mở Google Maps
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>

          <Separator />

          {/* About */}
          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{t("room.about")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{room.description}</p>
          </div>

          {/* Vibe Tags */}
          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{t("room.vibeTags")}</h2>
            <div className="flex flex-wrap gap-2">
              {room.vibeTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1">
                  {t(`vibes.${tag}`)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("room.amenitiesList")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {room.amenities.map((amenity) => (
                <AmenityIcon key={amenity} amenity={amenity} size="md" showLabel />
              ))}
            </div>
          </div>

          {/* Specs */}
          {Object.keys(room.specs).length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{t("room.specs")}</h2>
              <div className="grid gap-2">
                {Object.entries(room.specs).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                      <span className="text-sm capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Reviews */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">{t("room.reviewsTitle")}</h2>
            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-card-foreground">{review.userName}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.date, locale)}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("room.noReviews")}</p>
            )}
          </div>



        </div>

        {/* Right: Booking Widget (sticky) */}
        <div className="lg:sticky lg:top-20 lg:self-start flex flex-col gap-4">
          {selectedSlots.length > 0 && (
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
              <div>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Đang giữ chỗ cho bạn</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 tracking-tight">10:00</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 bg-transparent">
                Cần thêm thời gian?
              </Button>
            </div>
          )}

          <Card className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">
              {room.category === "solo_nook" ? "Mua Seat Pass" : t("common.bookNow")}
            </h3>

            <TimeSlotPicker
              slots={slots}
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />

            {selectedSlots.length > 0 && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("room.duration")}</span>
                  <span className="font-medium text-foreground">{duration}h</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.roomFee")}</span>
                  <span className="font-medium text-foreground">{formatVND(roomFee)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
                  <span className="font-medium text-foreground">{formatVND(platformFee)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground">{t("room.totalPrice")}</span>
                  <span className="text-lg font-bold text-primary">{formatVND(totalPrice)}</span>
                </div>

                {room.category === "team_hub" && (
                  <div className="pt-3 border-t border-border/50">
                    <Button
                      variant="secondary"
                      className="w-full text-xs font-medium bg-secondary/50 hover:bg-secondary flex items-center justify-center py-2 h-auto"
                      onClick={() => alert("Tính năng chia tiền đang được xây dựng!")}
                    >
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      Tính hộ mỗi người bao nhiêu (Split Bill)
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleBookNow}
              disabled={selectedSlots.length === 0}
              className="mt-4 w-full"
              size="lg"
            >
              {t("common.bookNow")}
              {selectedSlots.length > 0 && ` - ${formatVND(totalPrice)}`}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
