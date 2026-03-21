"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { useBooking } from "@/lib/store/booking-store"
import type { Booking, PaymentMethod, TimeSlot } from "@/lib/types"
import { formatVND, generateBookingId, formatDate } from "@/lib/format"
import { formatTime } from "@/lib/data/time-slots"
import { CountdownTimer } from "@/components/countdown-timer"
import { QrCode as DinomadQrCode } from "@/components/qr-code"
import { PriceDisplay } from "@/components/price-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { Clock, Loader2, MapPin, QrCode as QrCodeIcon, Users } from "lucide-react"

type FieldErrors = Partial<Record<"fullName" | "phone" | "email", string>>

function getTimeRange(slots: TimeSlot[]) {
  if (slots.length === 0) return { startTime: "", endTime: "" }
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))
  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
  }
}

function validateEmail(email: string) {
  if (!email) return true
  // Simple email regex; good UX > perfect RFC validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const router = useRouter()

  const { state, dispatch } = useBooking()

  const [fullName, setFullName] = useState(state.guestName)
  const [phone, setPhone] = useState(state.guestPhone)
  const [email, setEmail] = useState(state.guestEmail)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [softLockExpired, setSoftLockExpired] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState<Booking | null>(null)

  const softLockDurationSeconds = 5 * 60
  const countdownKeyRef = useRef(0)

  useEffect(() => {
    setFullName(state.guestName)
    setPhone(state.guestPhone)
    setEmail(state.guestEmail)
  }, [state.guestName, state.guestPhone, state.guestEmail])

  const room = state.selectedRoom
  const timeRange = useMemo(() => getTimeRange(state.selectedSlots), [state.selectedSlots])
  const durationHours = useMemo(() => state.selectedSlots.length * 0.5, [state.selectedSlots.length])

  const computedFee = useMemo(() => {
    const roomFee = room ? room.pricePerHour * durationHours : 0
    const platformFee = Math.round(roomFee * 0.1)
    return { roomFee, platformFee, totalPrice: roomFee + platformFee }
  }, [room, durationHours])

  const checkoutTotal = state.totalPrice > 0 ? state.totalPrice : computedFee.totalPrice

  useEffect(() => {
    // If state changes (new room/date), restart soft lock timer visually.
    setSoftLockExpired(false)
    countdownKeyRef.current += 1
  }, [room?.id, state.selectedDate])

  const canProceed =
    !!room &&
    state.selectedSlots.length > 0 &&
    fullName.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 9 &&
    agreeTerms &&
    !softLockExpired &&
    !isPaying

  const handleCancel = () => {
    dispatch({ type: "RESET" })
    router.push(`/${locale}`)
  }

  const handleProceedPayment = async () => {
    setErrors({})

    const nextErrors: FieldErrors = {}
    if (fullName.trim().length < 2) nextErrors.fullName = locale === "vi" ? "Vui long nhap ho va ten" : "Please enter your full name"

    const normalizedPhone = phone.replace(/\s+/g, "")
    if (normalizedPhone.replace(/\D/g, "").length < 9)
      nextErrors.phone = locale === "vi" ? "So dien thoai khong hop le" : "Invalid phone number"

    if (!validateEmail(email)) nextErrors.email = locale === "vi" ? "Email khong hop le" : "Invalid email"

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (!room || state.selectedSlots.length === 0) return
    if (softLockExpired) return

    dispatch({ type: "SET_GUEST_INFO", name: fullName.trim(), phone: phone.trim(), email: email.trim() })
    setIsPaying(true)

    const newBookingId = generateBookingId()
    dispatch({ type: "SET_BOOKING_ID", id: newBookingId })

    const { startTime, endTime } = timeRange

    const newBooking: Booking = {
      id: newBookingId,
      roomId: room.id,
      roomName: room.name,
      venueName: room.venueName,
      venueAddress: room.address,
      date: state.selectedDate,
      startTime,
      endTime,
      duration: durationHours,
      guestName: fullName.trim(),
      guestPhone: phone.trim(),
      guestEmail: email.trim() || undefined,
      totalPrice: checkoutTotal,
      roomFee: computedFee.roomFee,
      platformFee: computedFee.platformFee,
      status: "confirmed",
      paymentMethod: state.paymentMethod,
      // UI demo: generate deterministic-ish identifiers/password.
      checkInQr: `DINOMAD-${newBookingId}`,
      wifiPassword: `${room.id}-wifi-${newBookingId.slice(-3)}`,
      createdAt: new Date().toISOString(),
    }

    // Simulate payment confirmation UX
    await new Promise((r) => setTimeout(r, 1400))
    setIsPaying(false)
    setBookingConfirmed(newBooking)
  }

  const summaryStartLabel = timeRange.startTime ? formatTime(timeRange.startTime) : ""
  const summaryEndLabel = timeRange.endTime ? formatTime(timeRange.endTime) : ""

  if (!room || state.selectedSlots.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t("checkout.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>{locale === "vi" ? "Khong tim thay du lieu dat phong" : "No booking data found"}</AlertTitle>
              <AlertDescription>
                {locale === "vi" ? "Hay quay lai trang phong va dat lai theo luong." : "Please go back to the room page and try again."}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => router.push(`/${locale}`)} className="rounded-none w-full">
                {t("common.home")}
              </Button>
              <Button variant="default" onClick={() => router.back()} className="rounded-none w-full">
                {t("common.back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden="true">←</span>
        {t("common.back")}
      </button>

      {bookingConfirmed ? (
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">{t("confirmation.title")}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{t("confirmation.subtitle")}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("confirmation.bookingId")}</p>
                        <p className="mt-1 font-black text-lg">{bookingConfirmed.id}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        <span>
                          {room.capacity} {t("common.people")}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{t("confirmation.room")}</span>
                        <span className="font-medium">{bookingConfirmed.roomName}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{t("confirmation.venue")}</span>
                        <span className="font-medium">
                          {bookingConfirmed.venueName}
                          <span className="text-xs text-muted-foreground"> ({room.district})</span>
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{t("confirmation.dateTime")}</span>
                        <span className="font-medium">
                          {formatDate(bookingConfirmed.date, locale)} {summaryStartLabel} - {summaryEndLabel}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{t("checkout.total")}</span>
                        <span className="font-black text-primary">{formatVND(bookingConfirmed.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-semibold">{t("confirmation.wifiPassword")}</p>
                    <p className="mt-2 font-mono text-lg font-bold text-primary">{bookingConfirmed.wifiPassword}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {locale === "vi" ? "Duoc cap nhat tu he thong demo." : "Provided by demo system."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-2">
                      <QrCodeIcon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">{t("confirmation.checkInQR")}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-center">
                      <DinomadQrCode
                        data={bookingConfirmed.checkInQr}
                        size={160}
                        className="rounded-lg overflow-hidden"
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{t("confirmation.showQR")}</p>
                  </div>

                  <Button
                    className="w-full rounded-none"
                    size="lg"
                    onClick={() => {
                      dispatch({ type: "RESET" })
                      router.push(`/${locale}`)
                    }}
                  >
                    {t("confirmation.backHome")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
            <Card className="p-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("checkout.yourDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("checkout.fullName")}</Label>
                  <Input
                    id="fullName"
                    placeholder={t("checkout.namePlaceholder")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(errors.fullName ? "border-destructive" : "")}
                    autoComplete="name"
                  />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("checkout.phone")}</Label>
                  <Input
                    id="phone"
                    placeholder={t("checkout.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(errors.phone ? "border-destructive" : "")}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("checkout.email")}</Label>
                  <Input
                    id="email"
                    placeholder={t("checkout.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(errors.email ? "border-destructive" : "")}
                    inputMode="email"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(Boolean(v))} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t("checkout.termsAgree")}</p>
                    <p className="text-xs text-muted-foreground">
                      {locale === "vi"
                        ? "Ban se khong duoc doi lich sau khi thanh toan thanh cong."
                        : "You can’t change the booking after successful payment."}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  className="w-full rounded-none lg:hidden"
                  size="lg"
                  onClick={handleProceedPayment}
                  disabled={!canProceed}
                >
                  {isPaying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("payment.waitingPayment")}
                    </span>
                  ) : (
                    t("checkout.proceedPayment")
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="p-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("payment.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={state.paymentMethod}
                  onValueChange={(v) => dispatch({ type: "SET_PAYMENT_METHOD", method: v as PaymentMethod })}
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
                        {locale === "vi" ? "Thanh toan bang vi MoMo (demo)." : "Pay using MoMo Wallet (demo)."}
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
                        {locale === "vi" ? "Thanh toan bang ZaloPay (demo)." : "Pay using ZaloPay (demo)."}
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <Separator />

                {state.paymentMethod === "vietqr" ? (
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{t("payment.bankInfo")}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("payment.transferNote")}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {locale === "vi" ? "So tien can thanh toan:" : "Amount to pay:"}{" "}
                          <span className="font-bold text-primary">{formatVND(checkoutTotal)}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {locale === "vi" ? "QR thanh toan" : "Payment QR"}
                        </p>
                        <DinomadQrCode
                          data={`PAY-${room.id}-${state.selectedDate}-${timeRange.startTime}-${checkoutTotal}`}
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
                        ? "He thong se mo phong thanh toan nhanh. Vui long giu nguyen thong tin truoc khi bam."
                        : "This is a quick payment simulation. Keep your details before you proceed."}
                    </AlertDescription>
                  </Alert>
                )}

                {isPaying && (
                  <Alert className="rounded-none" variant="default">
                    <AlertTitle>{t("payment.waitingPayment")}</AlertTitle>
                    <AlertDescription>
                      {locale === "vi" ? "Dang xac nhan thanh toan. Vui long doi..." : "Confirming your payment. Please wait..."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start flex flex-col gap-4">
            <Card className="p-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("checkout.bookingSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("confirmation.room")}</p>
                      <p className="mt-1 font-black text-lg">{room.name}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {room.venueName}
                        <span className="text-muted-foreground">·</span>
                        {room.district}
                      </p>
                    </div>
                    {room.verified && (
                      <span className="rounded-full border bg-background px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                        {t("common.verified")}
                      </span>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{locale === "vi" ? "Ngay" : "Date"}</span>
                      <span className="text-sm font-medium">{formatDate(state.selectedDate, locale)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{locale === "vi" ? "Thoi gian" : "Time"}</span>
                      <span className="text-sm font-medium">
                        {summaryStartLabel} - {summaryEndLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{t("room.selected")}</span>
                      <div className="flex flex-wrap justify-end gap-2">
                        {[...state.selectedSlots]
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((slot) => (
                            <span
                              key={slot.id}
                              className="rounded-full border bg-background px-2 py-1 text-xs font-bold uppercase tracking-wider text-foreground"
                            >
                              {formatTime(slot.startTime)}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground">{t("room.duration")}</span>
                      <span className="text-sm font-medium">{durationHours}h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{t("checkout.timeRemaining")}</p>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    {softLockExpired ? (
                      <Alert variant="destructive" className="rounded-none">
                        <AlertTitle>{locale === "vi" ? "Het thoi gian giu phong" : "Hold time expired"}</AlertTitle>
                        <AlertDescription>
                          {locale === "vi" ? "Vui long chon lai thoi gian va dat phong." : "Please select a new time and book again."}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <CountdownTimer
                        key={countdownKeyRef.current}
                        durationSeconds={softLockDurationSeconds}
                        onExpire={() => setSoftLockExpired(true)}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t("checkout.softLockNote")}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("checkout.roomFee")}</span>
                    <span className="font-medium">{formatVND(computedFee.roomFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("checkout.platformFee")}</span>
                    <span className="font-medium">{formatVND(computedFee.platformFee)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold">{t("checkout.total")}</span>
                    <span className="text-lg font-black text-primary">{formatVND(checkoutTotal)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  className="w-full rounded-none hidden lg:inline-flex"
                  size="lg"
                  onClick={handleProceedPayment}
                  disabled={!canProceed}
                >
                  {isPaying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("payment.waitingPayment")}
                    </span>
                  ) : (
                    t("checkout.proceedPayment")
                  )}
                  {!isPaying && <PriceDisplay amount={checkoutTotal} />}
                </Button>
              </CardFooter>
            </Card>

            <Button variant="outline" className="w-full rounded-none lg:hidden" onClick={handleCancel} disabled={isPaying}>
              {t("payment.cancelBooking")}
            </Button>
            <Button variant="outline" className="w-full rounded-none hidden lg:inline-flex" onClick={handleCancel} disabled={isPaying}>
              {t("payment.cancelBooking")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

