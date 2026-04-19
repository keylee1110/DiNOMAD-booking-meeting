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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Star, MapPin, Users, ChevronLeft, ChevronRight,
  ExternalLink, Minus, Plus, Clock, Wifi, CheckCircle2,
} from "lucide-react"
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
  const [splitPeople, setSplitPeople] = useState(room?.capacity || 2)

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
  const splitAmount = Math.ceil(totalPrice / splitPeople)

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
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        {t("common.back")}
      </button>

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        {/* ─── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="flex flex-col gap-8">

          {/* Photo Gallery */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={room.images[currentImageIndex] || room.images[0]}
              alt={room.name}
              fill
              className="object-cover transition-transform duration-700"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Nav arrows */}
            {room.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2.5 shadow-lg hover:bg-white transition-all hover:scale-105 active:scale-95"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2.5 shadow-lg hover:bg-white transition-all hover:scale-105 active:scale-95"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-foreground" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {room.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badge overlay */}
            {room.verified && (
              <div className="absolute top-4 left-4">
                <VerifiedBadge />
              </div>
            )}
          </div>

          {/* ── Room Identity ── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{room.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{room.venueName} · {room.district}</span>
                </p>
              </div>
              {/* Rating pill */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-border/40 px-4 py-2 shadow-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-base font-bold text-foreground">{room.rating}</span>
                <span className="text-xs text-muted-foreground">({room.reviewCount})</span>
              </div>
            </div>

            {/* Key stats row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {room.category === "solo_nook"
                    ? `${room.slotsLeftToday} ${t("common.slotLeft")}`
                    : `${room.capacity} ${t("common.people")}`}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {formatVND(room.pricePerHour)}
                  <span className="text-[10px] font-normal text-muted-foreground ml-0.5">/{t("common.perHour")}</span>
                </span>
              </div>
              {room.noiseLevel && (
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-3 py-1.5">
                  <span className="text-sm font-semibold text-foreground">Noise {room.noiseLevel}/10</span>
                </div>
              )}
            </div>

            {/* Google Maps */}
            <a
              href={`https://www.google.com/maps?q=${room.lat},${room.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <MapPin className="h-4 w-4" />
              Xem trên Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <Separator className="opacity-50" />

          {/* ── About ── */}
          <div>
            <h2 className="mb-3 text-xl font-bold text-foreground">{t("room.about")}</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{room.description}</p>
          </div>

          {/* ── Vibe Tags ── */}
          {room.vibeTags.length > 0 && (
            <div>
              <h2 className="mb-3 text-xl font-bold text-foreground">{t("room.vibeTags")}</h2>
              <div className="flex flex-wrap gap-2">
                {room.vibeTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-sm">
                    {t(`vibes.${tag}`)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Amenities ── */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-foreground">{t("room.amenitiesList")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {room.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2.5 rounded-2xl border border-border/40 bg-white/50 px-4 py-3 backdrop-blur-sm"
                >
                  <AmenityIcon amenity={amenity} size="md" showLabel />
                </div>
              ))}
            </div>
          </div>

          {/* ── Specs ── */}
          {Object.keys(room.specs).length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-foreground">{t("room.specs")}</h2>
              <div className="grid gap-2">
                {Object.entries(room.specs).map(([key, value]) =>
                  value ? (
                    <div key={key} className="flex items-center justify-between rounded-2xl bg-white/50 backdrop-blur-sm border border-border/30 px-4 py-3">
                      <span className="text-sm capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-sm font-semibold text-foreground">{value}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          <Separator className="opacity-50" />

          {/* ── Reviews ── */}
          <div>
            <h2 className="mb-5 text-xl font-bold text-foreground">{t("room.reviewsTitle")}</h2>
            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border/40 bg-white/50 backdrop-blur-sm p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {review.userName[0]}
                        </div>
                        <span className="font-semibold text-foreground">{review.userName}</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 border border-yellow-200">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground/60">{formatDate(review.date, locale)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("room.noReviews")}</p>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN — Booking Widget ──────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
          {/* Holding banner */}
          {selectedSlots.length > 0 && (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 shadow-sm">
              <div>
                <p className="text-xs font-semibold text-orange-600">Đang giữ chỗ cho bạn</p>
                <p className="text-2xl font-bold text-orange-600 tracking-tight">10:00</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50 bg-transparent">
                Cần thêm thời gian?
              </Button>
            </div>
          )}

          {/* Main booking card */}
          <div className="rounded-3xl border border-border/40 bg-white/70 backdrop-blur-xl shadow-xl shadow-black/5 p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {room.category === "solo_nook" ? "Mua Seat Pass" : t("common.bookNow")}
              </h3>
              <span className="text-sm font-bold text-primary">
                {formatVND(room.pricePerHour)}<span className="text-[10px] font-normal text-muted-foreground">/{t("common.perHour")}</span>
              </span>
            </div>

            <TimeSlotPicker
              slots={slots}
              selectedSlots={selectedSlots}
              onToggleSlot={handleToggleSlot}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />

            {/* Price breakdown */}
            {selectedSlots.length > 0 && (
              <div className="rounded-2xl bg-muted/30 border border-border/30 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("room.duration")}</span>
                  <span className="font-semibold text-foreground">{duration}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.roomFee")}</span>
                  <span className="font-semibold text-foreground">{formatVND(roomFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
                  <span className="font-semibold text-foreground">{formatVND(platformFee)}</span>
                </div>
                <Separator className="my-1 opacity-40" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{t("room.totalPrice")}</span>
                  <span className="text-xl font-bold text-primary">{formatVND(totalPrice)}</span>
                </div>

                {/* Split bill */}
                {room.category === "team_hub" && (
                  <div className="mt-2 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Chia tiền ({splitPeople} người)
                      </div>
                      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-0.5 border border-border/40">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                          onClick={() => setSplitPeople(Math.max(2, splitPeople - 1))}
                          disabled={splitPeople <= 2}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold w-6 text-center">{splitPeople}</span>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                          onClick={() => setSplitPeople(Math.min(50, splitPeople + 1))}
                          disabled={splitPeople >= 50}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-2.5 border border-primary/10">
                      <span className="text-xs font-semibold text-muted-foreground">Mỗi người trả</span>
                      <span className="font-bold text-primary">{formatVND(splitAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleBookNow}
              disabled={selectedSlots.length === 0}
              className="w-full h-13 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
              size="lg"
            >
              {selectedSlots.length === 0 ? "Chọn khung giờ" : `${t("common.bookNow")} · ${formatVND(totalPrice)}`}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground/60 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Xác nhận tức thì · Hoàn tiền trong 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
