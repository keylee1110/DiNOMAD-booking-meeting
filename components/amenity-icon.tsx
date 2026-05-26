"use client"

import React from "react"
import { useTranslation } from "@/lib/i18n/context"
import type { Amenity } from "@/lib/types"
import { Wifi, Tv, PenLine, Snowflake, Cable, Projector, Plug, Coffee, Droplets, Car } from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<Amenity, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  tv: Tv,
  whiteboard: PenLine,
  ac: Snowflake,
  hdmi: Cable,
  projector: Projector,
  power_outlets: Plug,
  coffee: Coffee,
  water: Droplets,
  parking: Car,
}

interface AmenityIconProps {
  amenity: Amenity
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function AmenityIcon({ amenity, size = "sm", showLabel = false }: AmenityIconProps) {
  const { t } = useTranslation()
  const Icon = iconMap[amenity]

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const containerClasses = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  if (showLabel) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary/5">
        <div className={cn("flex shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10", containerClasses[size])}>
          <Icon className={cn("text-primary", sizeClasses[size])} />
        </div>
        <span className="text-sm font-semibold text-foreground">{t(`amenities.${amenity}`)}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border border-border/50 bg-muted/30 transition-colors hover:border-primary/20 hover:bg-primary/5",
        containerClasses[size]
      )}
      title={t(`amenities.${amenity}`)}
    >
      <Icon className={cn("text-primary", sizeClasses[size])} />
    </div>
  )
}
