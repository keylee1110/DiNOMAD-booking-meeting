"use client"

import { useTranslation } from "@/lib/i18n/context"
import { BadgeCheck } from "lucide-react"

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 text-primary font-bold tracking-wide backdrop-blur-sm ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      <BadgeCheck className={`text-primary ${size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"}`} />
      {t("common.verified")}
    </span>
  )
}
