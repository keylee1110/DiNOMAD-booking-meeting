"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatVND } from "@/lib/format"
import type { PaymentMethod } from "@/lib/types"
import { Copy, Check, Info, ShieldCheck } from "lucide-react"

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (v: PaymentMethod) => void
  totalPrice: number
  isPaying: boolean
  locale: string
  bookingCode?: string // Added bookingCode for SePay
}

export function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  totalPrice,
  isPaying,
  locale,
  bookingCode
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation()
  const [copiedField, setCopiedField] = useState<"acc" | "amount" | "des" | null>(null)

  const handleCopy = (text: string, field: "acc" | "amount" | "des") => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // SePay configurations
  const bankCode = process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || "BIDV"
  const accountNumber = process.env.NEXT_PUBLIC_SEPAY_BANK_ACC || "96247AVTD7"
  const accountHolder = "LE DANG KHOA"

  const cleanBookingCode = bookingCode ? bookingCode.replace("-", "") : ""

  // SePay VietQR Quick Link URL
  const qrCodeUrl = cleanBookingCode
    ? `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${totalPrice}&des=${cleanBookingCode}&template=compact`
    : ""

  return (
    <Card className="p-5 border border-border/50 shadow-sm rounded-2xl">
      <CardHeader className="pb-3 px-0 pt-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t("payment.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pb-0">
        <RadioGroup
          value={paymentMethod}
          onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
          className="grid gap-3"
        >
          <div className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${paymentMethod === 'vietqr' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-card hover:bg-muted/10'}`}>
            <RadioGroupItem value="vietqr" id="pm-vietqr" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="pm-vietqr" className="font-bold text-sm cursor-pointer text-foreground">
                {t("payment.vietqr")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("payment.scanInstruction")}</p>
            </div>
          </div>

          <div className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${paymentMethod === 'momo' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-card hover:bg-muted/10'}`}>
            <RadioGroupItem value="momo" id="pm-momo" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="pm-momo" className="font-bold text-sm cursor-pointer text-foreground">
                {t("payment.momo")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {locale === "vi" ? "Thanh toán bằng ví MoMo (demo)." : "Pay using MoMo Wallet (demo)."}
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${paymentMethod === 'zalopay' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-card hover:bg-muted/10'}`}>
            <RadioGroupItem value="zalopay" id="pm-zalopay" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="pm-zalopay" className="font-bold text-sm cursor-pointer text-foreground">
                {t("payment.zalopay")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {locale === "vi" ? "Thanh toán bằng ZaloPay (demo)." : "Pay using ZaloPay (demo)."}
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-card hover:bg-muted/10'}`}>
            <RadioGroupItem value="card" id="pm-card" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="pm-card" className="font-bold text-sm cursor-pointer text-foreground">
                {locale === "vi" ? "Thẻ Quốc tế ATM / Visa / Mastercard" : "ATM / Visa / Mastercard / Credit Card"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {locale === "vi" ? "Thẻ nội địa hoặc thẻ quốc tế Visa, Mastercard, JCB (demo)." : "Local ATM cards or international credit cards Visa, Mastercard, JCB (demo)."}
              </p>
            </div>
          </div>
        </RadioGroup>

        <Separator className="my-2" />

        {paymentMethod === "vietqr" ? (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-5 items-center md:items-start justify-between">
              
              {/* Bank Transfer Details List */}
              <div className="space-y-3 w-full md:flex-1">
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  {locale === "vi" ? "Thông tin chuyển khoản" : "Bank Transfer Information"}
                </p>

                <div className="space-y-2 text-xs">
                  {/* Bank Name */}
                  <div className="flex flex-col bg-card/50 p-2.5 rounded-xl border border-border/30">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                      {locale === "vi" ? "Ngân hàng" : "Bank"}
                    </span>
                    <span className="font-bold text-foreground">
                      BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between bg-card/50 p-2.5 rounded-xl border border-border/30">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        {locale === "vi" ? "Số tài khoản" : "Account Number"}
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {accountNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(accountNumber, "acc")}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors border border-border/20 text-muted-foreground hover:text-foreground"
                      title={locale === "vi" ? "Sao chép số tài khoản" : "Copy Account Number"}
                    >
                      {copiedField === "acc" ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Account Holder */}
                  <div className="flex flex-col bg-card/50 p-2.5 rounded-xl border border-border/30">
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                      {locale === "vi" ? "Chủ tài khoản" : "Account Holder"}
                    </span>
                    <span className="font-bold text-foreground">
                      {accountHolder}
                    </span>
                  </div>

                  {/* Transfer Amount */}
                  <div className="flex items-center justify-between bg-card/50 p-2.5 rounded-xl border border-border/30">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        {locale === "vi" ? "Số tiền" : "Amount"}
                      </span>
                      <span className="font-bold text-primary text-sm">
                        {formatVND(totalPrice)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(String(totalPrice), "amount")}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors border border-border/20 text-muted-foreground hover:text-foreground"
                      title={locale === "vi" ? "Sao chép số tiền" : "Copy Amount"}
                    >
                      {copiedField === "amount" ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Transfer Content */}
                  <div className="flex items-center justify-between bg-primary/5 p-2.5 rounded-xl border border-primary/20">
                    <div className="flex flex-col">
                      <span className="text-primary text-[10px] uppercase font-bold tracking-wider">
                        {locale === "vi" ? "Nội dung chuyển khoản (bắt buộc)" : "Transfer Memo (required)"}
                      </span>
                      <span className="font-mono font-black text-primary text-sm tracking-wide">
                        {cleanBookingCode || "DNXXXXXX"}
                      </span>
                    </div>
                    {cleanBookingCode && (
                      <button
                        onClick={() => handleCopy(cleanBookingCode, "des")}
                        className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/10 text-primary"
                        title={locale === "vi" ? "Sao chép nội dung" : "Copy Content"}
                      >
                        {copiedField === "des" ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* VietQR Card Display */}
              <div className="flex flex-col items-center gap-2 border border-border/40 bg-card rounded-2xl p-4 shadow-sm shrink-0 w-[200px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === "vi" ? "Quét mã chuyển nhanh" : "Scan to Pay Fast"}
                </span>
                
                {bookingCode ? (
                  <img
                    src={qrCodeUrl}
                    alt="VietQR BIDV Payment QR"
                    className="rounded-xl overflow-hidden w-[160px] h-[160px] object-contain border border-border/20 bg-white p-1 shadow-inner"
                  />
                ) : (
                  <div className="w-[160px] h-[160px] bg-muted animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground text-center p-3">
                    {locale === "vi" ? "Đang khởi tạo mã QR từ hệ thống..." : "Generating dynamic QR code..."}
                  </div>
                )}
                
                <span className="text-[9px] text-muted-foreground text-center leading-normal max-w-[150px]">
                  {locale === "vi" 
                    ? "Dùng ví điện tử hoặc ứng dụng ngân hàng quét VietQR" 
                    : "Scan using Mobile Banking or E-Wallet"}
                </span>
              </div>

            </div>
          </div>
        ) : (
          <Alert className="rounded-xl border border-border/50 bg-muted/10">
            <AlertTitle className="font-bold">{t("payment.simulatePayment")}</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              {locale === "vi"
                ? "Hệ thống sẽ mô phỏng thanh toán nhanh. Vui lòng giữ nguyên thông tin trước khi bấm."
                : "This is a quick payment simulation. Keep your details before you proceed."}
            </AlertDescription>
          </Alert>
        )}

        {isPaying && (
          <Alert className="rounded-xl border-primary/20 bg-primary/5 animate-pulse" variant="default">
            <AlertTitle className="font-bold text-primary">{t("payment.waitingPayment")}</AlertTitle>
            <AlertDescription className="text-xs text-primary/80">
              {locale === "vi" 
                ? "Hệ thống đang chờ SePay xác nhận giao dịch chuyển khoản. Vui lòng không đóng trang này..." 
                : "System is waiting for SePay bank transfer verification. Please do not close this page..."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
