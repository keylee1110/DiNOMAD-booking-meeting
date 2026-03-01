"use client"

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
      <div className="flex items-center gap-3">
        <div className={cn("flex flex-shrink-0 items-center justify-center rounded-none border-2 border-primary bg-primary/10 shadow-[2px_2px_0px_0px_#64B5F6]", containerClasses[size])}>
          <Icon className={cn("text-primary", sizeClasses[size])} />
        </div>
        <span className="text-sm font-bold uppercase tracking-wider text-foreground">{t(`amenities.${amenity}`)}</span>
      </div>
    )
  }

  return (
    <div
      className={cn("flex items-center justify-center rounded-none border-[1.5px] border-border bg-card shadow-[1px_1px_0px_0px_var(--color-border)]", containerClasses[size])}
      title={t(`amenities.${amenity}`)}
    >
      <Icon className={cn("text-primary", sizeClasses[size])} />
    </div>
  )
}
