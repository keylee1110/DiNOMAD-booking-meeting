"use client"

import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { QrCode as DinomadQrCode } from "@/components/qr-code"
import { formatVND } from "@/lib/format"
import type { PaymentMethod, Room } from "@/lib/types"

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (v: PaymentMethod) => void
  totalPrice: number
  room: Room
  selectedDate: string
  startTime: string
  isPaying: boolean
  locale: string
}

export function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  totalPrice,
  room,
  selectedDate,
  startTime,
  isPaying,
  locale
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation()

  return (
    <Card className="p-5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("payment.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={paymentMethod}
          onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
          className="grid gap-3"
        >
          <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <RadioGroupItem value="vietqr" id="pm-vietqr" />
            <div className="space-y-1">
              <Label htmlFor="pm-vietqr" className="font-semibold">
                {t("payment.vietqr")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("payment.scanInstruction")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <RadioGroupItem value="momo" id="pm-momo" />
            <div className="space-y-1">
              <Label htmlFor="pm-momo" className="font-semibold">
                {t("payment.momo")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {locale === "vi" ? "Thanh toán bằng ví MoMo (demo)." : "Pay using MoMo Wallet (demo)."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <RadioGroupItem value="zalopay" id="pm-zalopay" />
            <div className="space-y-1">
              <Label htmlFor="pm-zalopay" className="font-semibold">
                {t("payment.zalopay")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {locale === "vi" ? "Thanh toán bằng ZaloPay (demo)." : "Pay using ZaloPay (demo)."}
              </p>
            </div>
          </div>
        </RadioGroup>

        <Separator />

        {paymentMethod === "vietqr" ? (
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t("payment.bankInfo")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("payment.transferNote")}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {locale === "vi" ? "Số tiền cần thanh toán:" : "Amount to pay:"}{" "}
                  <span className="font-bold text-primary">{formatVND(totalPrice)}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === "vi" ? "QR thanh toán" : "Payment QR"}
                </p>
                <DinomadQrCode
                  data={`PAY-${room.id}-${selectedDate}-${startTime}-${totalPrice}`}
                  size={96}
                  className="rounded-lg overflow-hidden"
                />
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTitle>{t("payment.simulatePayment")}</AlertTitle>
            <AlertDescription>
              {locale === "vi"
                ? "Hệ thống sẽ mô phỏng thanh toán nhanh. Vui lòng giữ nguyên thông tin trước khi bấm."
                : "This is a quick payment simulation. Keep your details before you proceed."}
            </AlertDescription>
          </Alert>
        )}

        {isPaying && (
          <Alert className="rounded-none" variant="default">
            <AlertTitle>{t("payment.waitingPayment")}</AlertTitle>
            <AlertDescription>
              {locale === "vi" ? "Đang xác nhận thanh toán. Vui lòng đợi..." : "Confirming your payment. Please wait..."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
