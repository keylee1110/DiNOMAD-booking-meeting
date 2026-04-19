"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"
import type { Room } from "@/lib/types"
import { formatVND } from "@/lib/format"
import { VerifiedBadge } from "@/components/verified-badge"
import { AmenityIcon } from "@/components/amenity-icon"
import { Star, Users, Clock, AudioLines } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RoomCardProps {
  room: Room
  compact?: boolean
}

export function RoomCard({ room, compact = false }: RoomCardProps) {
  const { locale, t } = useTranslation()

  return (
    <Link href={`/${locale}/rooms/${room.id}`}>
      <Card className="group overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 shadow-sm">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={room.images[0]}
            alt={room.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            {room.noiseLevel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 group-hover:bg-white/20">
                <AudioLines className="h-3.5 w-3.5" />
                {room.noiseLevel}/10 {t("common.quiet")}
              </span>
            )}
            {room.verified && (
              <VerifiedBadge />
            )}
          </div>
          {room.slotsLeftToday <= 3 && (
            <div className="absolute right-3 bottom-3">
              <Badge variant="glass">
                {room.slotsLeftToday} {room.slotsLeftToday === 1 ? t("common.slotLeft") : t("common.slotsLeft")}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-card-foreground transition-colors group-hover:text-primary">{room.name}</h3>
              <p className="truncate text-xs font-medium text-muted-foreground">{room.venueName} &middot; {room.district}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/50 bg-muted/30 px-2 py-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-card-foreground">{room.rating}</span>
            </div>
          </div>

          {!compact && (
            <div className="mb-4 mt-3 flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity) => (
                <div key={amenity} className="rounded-lg border border-border/50 p-2 bg-muted/20 text-foreground transition-colors group-hover:border-primary/20">
                  <AmenityIcon amenity={amenity} size="sm" />
                </div>
              ))}
              {room.amenities.length > 4 && (
                <span className="flex items-center text-[10px] font-bold text-muted-foreground ml-1 uppercase tracking-tighter">+{room.amenities.length - 4} More</span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/50 pt-4">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                {room.category === "solo_nook" ? `Còn ${room.slotsLeftToday} chỗ` : `${room.capacity} ${t("common.people")}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {room.reviewCount} {t("common.reviews")}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatVND(room.pricePerHour)}<span className="text-[10px] font-medium text-muted-foreground">/{t("common.perHour")}</span>
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
