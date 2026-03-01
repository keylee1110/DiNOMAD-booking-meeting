"use client"

import { formatVND } from "@/lib/format"
import { useTranslation } from "@/lib/i18n/context"

export function PriceDisplay({ amount, showPerHour = false }: { amount: number; showPerHour?: boolean }) {
  const { t } = useTranslation()

  return (
    <span className="font-bold text-primary">
      {formatVND(amount)}
      {showPerHour && <span className="text-xs font-normal text-muted-foreground">{t("common.perHour")}</span>}
    </span>
  )
}
