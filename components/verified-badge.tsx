"use client"

import { useTranslation } from "@/lib/i18n/context"
import { BadgeCheck } from "lucide-react"

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const { t } = useTranslation()

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm px-2.5 py-1 text-primary font-bold uppercase tracking-wider shadow-sm ${size === "md" ? "text-xs" : "text-[9px]"}`}>
      <BadgeCheck className={`${size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
      {t("common.verified")}
    </span>
  )
}
