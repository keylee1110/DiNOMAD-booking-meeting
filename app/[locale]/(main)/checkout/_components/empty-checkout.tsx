"use client"

import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface EmptyCheckoutProps {
  onGoHome: () => void
  onGoBack: () => void
  locale: string
}

export function EmptyCheckout({ onGoHome, onGoBack, locale }: EmptyCheckoutProps) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">{t("checkout.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>{locale === "vi" ? "Không tìm thấy dữ liệu đặt phòng" : "No booking data found"}</AlertTitle>
            <AlertDescription>
              {locale === "vi" ? "Hãy quay lại trang phòng và đặt lại theo luồng." : "Please go back to the room page and try again."}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={onGoHome} className="rounded-none w-full">
              {t("common.home")}
            </Button>
            <Button variant="default" onClick={onGoBack} className="rounded-none w-full">
              {t("common.back")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
