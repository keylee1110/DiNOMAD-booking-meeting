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
      <Card className="group overflow-hidden rounded-none border-2 border-border bg-card transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[8px_8px_0px_0px_#64B5F6] shadow-[4px_4px_0px_0px_var(--color-border)]">
        <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-border">
          <Image
            src={room.images[0]}
            alt={room.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            {room.noiseLevel && (
              <span className="inline-flex items-center gap-1.5 rounded-none border-2 border-border bg-background px-2.5 py-1 text-xs font-black uppercase tracking-wider text-foreground shadow-[2px_2px_0px_0px_var(--color-primary)]">
                <AudioLines className="h-4 w-4 text-primary" />
                {room.noiseLevel}/10 {t("common.quiet")}
              </span>
            )}
            {room.verified && (
              <VerifiedBadge />
            )}
          </div>
          {room.slotsLeftToday <= 3 && (
            <div className="absolute right-3 bottom-3">
              <Badge variant="secondary" className="rounded-none border-2 border-border bg-secondary text-secondary-foreground text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--color-border)]">
                {room.slotsLeftToday} {room.slotsLeftToday === 1 ? t("common.slotLeft") : t("common.slotsLeft")}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black uppercase tracking-tight text-card-foreground">{room.name}</h3>
              <p className="truncate text-sm font-bold text-muted-foreground">{room.venueName} &middot; {room.district}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 border-2 border-border bg-background px-2 py-0.5 shadow-[2px_2px_0px_0px_var(--color-border)]">
              <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
              <span className="text-sm font-black text-card-foreground">{room.rating}</span>
            </div>
          </div>

          {!compact && (
            <div className="mb-4 mt-3 flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity) => (
                <div key={amenity} className="border-2 border-border p-1 bg-background text-foreground shadow-[2px_2px_0px_0px_var(--color-border)]">
                  <AmenityIcon amenity={amenity} size="sm" />
                </div>
              ))}
              {room.amenities.length > 4 && (
                <span className="flex items-center text-xs font-bold text-muted-foreground ml-1">+{room.amenities.length - 4} MORE</span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t-2 border-border pt-4">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {room.category === "solo_nook" ? `Còn ${room.slotsLeftToday} chỗ` : `${room.capacity} ${t("common.people")}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                {room.reviewCount} {t("common.reviews")}
              </span>
            </div>
            <p className="text-lg font-black text-foreground">
              {formatVND(room.pricePerHour)}<span className="text-xs font-bold uppercase text-muted-foreground">/{t("common.perHour")}</span>
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
