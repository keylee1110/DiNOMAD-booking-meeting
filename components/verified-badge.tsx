"use client"

import { useTranslation } from "@/lib/i18n/context"
import { BadgeCheck } from "lucide-react"

export function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const { t } = useTranslation()

  return (
    <span className={`inline-flex items-center gap-1 rounded-none border-2 border-border bg-background px-2 py-0.5 text-foreground font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--color-primary)] ${size === "md" ? "text-sm" : "text-[10px]"}`}>
      <BadgeCheck className={`text-primary ${size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
      {t("common.verified")}
    </span>
  )
}
