"use client"

import { useState, useMemo, useEffect, use } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { getRoomById } from "@/lib/data/rooms"
import { getPublicRoomById } from "@/lib/api/public-rooms"
import { getRoomReviews } from "@/lib/api/reviews"
import type { ApiReview } from "@/lib/api/reviews"
import { generateTimeSlots } from "@/lib/data/time-slots"
import { useBooking } from "@/lib/store/booking-store"
import { formatVND, getNextDays, formatDate } from "@/lib/format"
import { TimeSlotPicker } from "@/components/time-slot-picker"
import { AmenityIcon } from "@/components/amenity-icon"
import { VerifiedBadge } from "@/components/verified-badge"
import { CountdownTimer } from "@/components/countdown-timer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, MapPin, Users, ChevronLeft, ChevronRight, ExternalLink, Minus, Plus, Heart } from "lucide-react"
import type { Room, TimeSlot } from "@/lib/types"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"

export default function RoomDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params)
  const { t } = useTranslation()
  const router = useRouter()
  const { state, dispatch, wishlist, toggleWishlist } = useBooking()
  const isFavorited = wishlist ? wishlist.includes(id) : false

  const demoRoom = getRoomById(id, locale) ?? null
  const [room, setRoom] = useState<Room | null>(demoRoom)
  const [roomLoading, setRoomLoading] = useState(!demoRoom)
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(getNextDays(1)[0])
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  const [holdExpired, setHoldExpired] = useState(false)
  const [holdTimerKey, setHoldTimerKey] = useState(0)

  // Split bill states
  const [splitPeople, setSplitPeople] = useState(demoRoom?.capacity || 2)

  useEffect(() => {
    if (demoRoom) return

    getPublicRoomById(id)
      .then((publicRoom) => {
        setRoom(publicRoom)
        if (publicRoom) setSplitPeople(publicRoom.capacity)
      })
      .catch((error) => console.warn("Could not load published room:", error))
      .finally(() => setRoomLoading(false))
  }, [demoRoom, id])

  useEffect(() => {
    getRoomReviews(id)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [id])

  const slots = useMemo(
    () => room ? generateTimeSlots(selectedDate, room.id) : [],
    [selectedDate, room],
  )

  const handleToggleSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.id === slot.id)
      if (exists) {
        return prev.filter((s) => s.id !== slot.id)
      }

      if (prev.length > 0) {
        const earliest = prev[0]
        const latest = slot
        const startIndex = slots.findIndex((s) => s.id === earliest.id)
        const endIndex = slots.findIndex((s) => s.id === latest.id)

        if (startIndex !== -1 && endIndex !== -1) {
          const start = Math.min(startIndex, endIndex)
          const end = Math.max(startIndex, endIndex)
          const range = slots.slice(start, end + 1)
          const allAvailable = range.every((s) => s.available)
          if (allAvailable) {
            return range
          }
        }
      }

      return [...prev, slot].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    // Reset hold timer each time user picks a new slot
    setHoldExpired(false)
    setHoldTimerKey((k) => k + 1)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedSlots([])
  }

  const duration = selectedSlots.length
  const roomFee = (room?.pricePerHour ?? 0) * duration
  const platformFee = Math.round(roomFee * 0.1)
  const totalPrice = roomFee + platformFee

  const handleBookNow = () => {
    if (!room) return
    dispatch({ type: "SET_ROOM", room })
    dispatch({ type: "SET_DATE", date: selectedDate })
    dispatch({ type: "SET_SLOTS", slots: selectedSlots })
    dispatch({ type: "CALCULATE_PRICE" })
    router.push(`/${locale}/checkout`)
  }

  const nextImage = () => {
    if (room) setCurrentImageIndex((i) => (i + 1) % room.images.length)
  }
  const prevImage = () => {
    if (room) setCurrentImageIndex((i) => (i - 1 + room.images.length) % room.images.length)
  }

  // Split bill logic
  const splitAmount = Math.ceil(totalPrice / splitPeople)

  if (roomLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">Loading room...</div>
  }
  if (!room) notFound()

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWishlist(room.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background hover:bg-muted/40 transition-colors shadow-sm cursor-pointer active:scale-95 duration-200"
                  aria-label="Toggle wishlist"
                >
                  <Heart className={cn("h-5 w-5 transition-colors", isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                </button>
                <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 shadow-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-bold text-foreground">{room.rating}</span>
                  <span className="text-sm text-muted-foreground">({room.reviewCount})</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {room.category === "solo_nook"
                  ? (locale === "vi" ? `Còn ${room.slotsLeftToday} chỗ trống` : `${room.slotsLeftToday} seats left today`)
                  : `${room.capacity} ${t("common.people")}`}
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
                {locale === "vi" ? "Mở Google Maps" : "Open Google Maps"}
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
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("room.vibeTags")}</h2>
            <div className="flex flex-wrap gap-2">
              {room.vibeTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/12"
                >
                  {t(`vibes.${tag}`)}
                </span>
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
            {reviewsLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-card-foreground">{review.customerId}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt, locale)}</p>
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
          {selectedSlots.length > 0 && !holdExpired && (
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {locale === "vi" ? "Đang giữ chỗ cho bạn" : "Holding your spot"}
                </p>
                <CountdownTimer
                  key={holdTimerKey}
                  durationSeconds={600}
                  onExpire={() => setHoldExpired(true)}
                  className="mt-1 border-amber-500/20 bg-transparent text-amber-700 dark:text-amber-400 text-base px-0 py-0 gap-1.5"
                />
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8 border-amber-500/20 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 bg-transparent rounded-xl">
                {locale === "vi" ? "Cần thêm thời gian?" : "Need more time?"}
              </Button>
            </div>
          )}
          {selectedSlots.length > 0 && holdExpired && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-center gap-3 shadow-sm animate-in fade-in">
              <p className="text-xs font-semibold text-destructive flex-1">
                {locale === "vi" ? "Đã hết thời gian giữ chỗ. Vui lòng chọn lại." : "Hold time expired. Please reselect your slots."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/10 bg-transparent rounded-xl shrink-0"
                onClick={() => { setSelectedSlots([]); setHoldExpired(false); setHoldTimerKey(k => k + 1) }}
              >
                {locale === "vi" ? "Chọn lại" : "Reset"}
              </Button>
            </div>
          )}

          <Card className="p-5 rounded-2xl border border-border/50 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-card-foreground">
              {room.category === "solo_nook"
                ? (locale === "vi" ? "Mua Seat Pass" : "Buy Seat Pass")
                : t("common.bookNow")}
            </h3>

            <TimeSlotPicker
              slots={slots}
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />

            {selectedSlots.length > 0 && (
              <div className="mt-4 rounded-xl bg-muted/30 p-3.5 border border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("room.duration")}</span>
                  <span className="font-medium text-foreground">{duration}h</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.roomFee")}</span>
                  <span className="font-medium text-foreground">{formatVND(roomFee)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
                  <span className="font-medium text-foreground">{formatVND(platformFee)}</span>
                </div>
                <Separator className="my-3 opacity-60" />
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground">{t("room.totalPrice")}</span>
                  <span className="text-lg font-bold text-primary">{formatVND(totalPrice)}</span>
                </div>

                {room.category === "team_hub" && (
                  <div className="pt-3.5 border-t border-border/40 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider opacity-85">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {locale === "vi" ? `Chia tiền (${splitPeople} người)` : `Split bill (${splitPeople} people)`}
                      </div>
                      <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-0.5 border border-border/40">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-lg"
                          onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}
                          disabled={splitPeople <= 2}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-semibold w-6 text-center">{splitPeople}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-lg"
                          onClick={() => setSplitPeople(Math.min(50, splitPeople + 1))}
                          disabled={splitPeople >= 50}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3.5 py-2.5 border border-primary/10 shadow-sm">
                      <span className="text-xs font-medium text-muted-foreground">
                        {locale === "vi" ? "Mỗi người trả" : "Each person pays"}
                      </span>
                      <span className="font-bold text-primary">{formatVND(splitAmount)}</span>
                    </div>
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
