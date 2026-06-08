"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"
import type { Room } from "@/lib/types"
import { formatVND } from "@/lib/format"
import { VerifiedBadge } from "@/components/verified-badge"
import { AmenityIcon } from "@/components/amenity-icon"
import { Star, Users, MessageSquare, AudioLines, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBooking } from "@/lib/store/booking-store"
import { cn } from "@/lib/utils"

interface RoomCardProps {
  room: Room
  compact?: boolean
}

export function RoomCard({ room, compact = false }: RoomCardProps) {
  const { locale, t } = useTranslation()
  const { wishlist, toggleWishlist } = useBooking()
  const isFavorited = wishlist.includes(room.id)

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(room.id)
  }

  return (
    <Link href={`/${locale}/rooms/${room.id}`}>
      <Card className="group overflow-hidden rounded-2xl border border-border/50 bg-card p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_-6px_rgba(41,35,30,0.08)] shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)]">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border/40">
          <Image
            src={room.images[0]}
            alt={room.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <button
            onClick={handleHeartClick}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/90 text-muted-foreground transition-all duration-200 shadow-sm backdrop-blur-sm hover:scale-110 hover:bg-background hover:text-red-500 active:scale-95"
            aria-label="Toggle wishlist"
          >
            <Heart className={cn("h-4.5 w-4.5 transition-colors", isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            {room.noiseLevel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs font-semibold tracking-tight text-foreground backdrop-blur-sm shadow-sm">
                <AudioLines className="h-3.5 w-3.5 text-primary" />
                {room.noiseLevel}/10 {t("common.quiet")}
              </span>
            )}
            {room.verified && (
              <VerifiedBadge />
            )}
          </div>
          {room.slotsLeftToday <= 3 && (
            <div className="absolute right-3 bottom-3">
              <Badge className="rounded-full border border-amber-400/40 bg-amber-500/90 text-white text-xs font-bold tracking-tight shadow-sm backdrop-blur-sm">
                {room.slotsLeftToday} {room.slotsLeftToday === 1 ? t("common.slotLeft") : t("common.slotsLeft")}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-card-foreground">{room.name}</h3>
              <p className="truncate text-sm font-medium text-muted-foreground">{room.venueName} &middot; {room.district}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 border border-border/60 bg-background px-2.5 py-0.5 rounded-lg shadow-sm">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-card-foreground">{room.rating}</span>
            </div>
          </div>

          {!compact && (
            <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 4).map((amenity) => (
                <AmenityIcon key={amenity} amenity={amenity} size="sm" />
              ))}
              {room.amenities.length > 4 && (
                <span className="flex items-center px-2 text-xs font-semibold text-muted-foreground">
                  +{room.amenities.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40 pt-4">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-tight text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {room.category === "solo_nook"
                  ? (locale === "vi" ? `Còn ${room.slotsLeftToday} chỗ` : `${room.slotsLeftToday} seats left`)
                  : `${room.capacity} ${t("common.people")}`}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                {room.reviewCount} {t("common.reviews")}
              </span>
            </div>
            <p className="whitespace-nowrap text-lg font-bold text-foreground">
              {formatVND(room.pricePerHour)}<span className="text-xs font-normal text-muted-foreground">{t("common.perHour")}</span>
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
