"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { useBooking } from "@/lib/store/booking-store"
import type { Booking, PaymentMethod, TimeSlot } from "@/lib/types"
import { generateBookingId, formatVND } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode as DinomadQrCode } from "@/components/qr-code"
import { CreditCard, Smartphone, Check, Loader2, ShieldCheck, Clock, Sparkles } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { createBooking } from "@/lib/api/bookings"
import { toast } from "sonner"

import { BookingSummary } from "./_components/booking-summary"
import { GuestInfoForm } from "./_components/guest-info-form"
import { PaymentMethodSelector } from "./_components/payment-method-selector"
import { EmptyCheckout } from "./_components/empty-checkout"

type FieldErrors = Partial<Record<"fullName" | "phone" | "email" | "agreeTerms", string>>

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()

  const { state, dispatch, addBooking } = useBooking()

  const [fullName, setFullName] = useState(state.guestName)
  const [phone, setPhone] = useState(state.guestPhone)
  const [email, setEmail] = useState(state.guestEmail)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [softLockExpired, setSoftLockExpired] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  
  const [userPoints, setUserPoints] = useState(0)
  const [redeemPoints, setRedeemPoints] = useState(false)

  useEffect(() => {
    async function getProfileData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("points, full_name, phone, email")
          .eq("id", user.id)
          .single()
        if (data && !error) {
          setUserPoints(data.points || 0)
          setFullName(prev => prev || data.full_name || "")
          setPhone(prev => prev || data.phone || "")
          setEmail(prev => prev || data.email || "")
        } else {
          setFullName(prev => prev || user.user_metadata?.full_name || "")
          setPhone(prev => prev || user.user_metadata?.phone || "")
          setEmail(prev => prev || user.email || "")
        }
      }
    }
    getProfileData()
  }, [])

  // Booking Flow & Payment Options (Agoda/Booking style)
  const [paymentMode, setPaymentMode] = useState<"deposit" | "full">("deposit")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [simulatedStatus, setSimulatedStatus] = useState<"idle" | "verifying" | "success">("idle")
  
  // Visa Card Input Mocks
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444")
  const [cardExpiry, setCardExpiry] = useState("12/28")
  const [cardCvv, setCardCvv] = useState("123")

  // Payment Countdown Timer
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const softLockDurationSeconds = 10 * 60
  const [countdownKey, setCountdownKey] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.guestName) setFullName(state.guestName)
      if (state.guestPhone) setPhone(state.guestPhone)
      if (state.guestEmail) setEmail(state.guestEmail)
    }, 0)
    return () => clearTimeout(timer)
  }, [state.guestName, state.guestPhone, state.guestEmail])

  const room = state.selectedRoom
  const timeRange = useMemo(() => getTimeRange(state.selectedSlots), [state.selectedSlots])
  const durationHours = useMemo(() => state.selectedSlots.length, [state.selectedSlots.length])

  const fees = useMemo(() => {
    const roomFee = room ? room.pricePerHour * durationHours : 0
    const platformFee = Math.round(roomFee * 0.1)
    return { roomFee, platformFee, totalPrice: roomFee + platformFee }
  }, [room, durationHours])

  const checkoutTotal = state.totalPrice > 0 ? state.totalPrice : fees.totalPrice

  const pointsDiscount = useMemo(() => {
    return redeemPoints ? Math.min(checkoutTotal, userPoints) : 0
  }, [redeemPoints, checkoutTotal, userPoints])

  const finalPayableTotal = useMemo(() => {
    return checkoutTotal - pointsDiscount
  }, [checkoutTotal, pointsDiscount])

  const pointsEarned = useMemo(() => {
    return Math.round(finalPayableTotal * 0.01)
  }, [finalPayableTotal])
  
  // Calculate specific amount to pay right now (Agoda style)
  const amountToPayNow = useMemo(() => {
    if (paymentMode === "deposit") {
      return Math.max(0, Math.round(fees.roomFee * 0.2 + fees.platformFee) - pointsDiscount) // 20% room fee + 10% platform fee minus points discount
    }
    return finalPayableTotal
  }, [paymentMode, fees, finalPayableTotal, pointsDiscount])

  // Payment countdown effect
  useEffect(() => {
    if (!isPaymentDialogOpen) {
      const timer = setTimeout(() => {
        setTimeLeft(600)
      }, 0)
      return () => clearTimeout(timer)
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setSoftLockExpired(true)
          setIsPaymentDialogOpen(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isPaymentDialogOpen])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // Defer soft lock resets
  useEffect(() => {
    const timer = setTimeout(() => {
      setSoftLockExpired(false)
      setCountdownKey(prev => prev + 1)
    }, 0)
    return () => clearTimeout(timer)
  }, [room?.id, state.selectedDate])

  const canProceed =
    !!room &&
    state.selectedSlots.length > 0 &&
    fullName.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 9 &&
    !softLockExpired &&
    !isPaying

  const handleCancel = () => {
    router.push(`/${locale}/checkout/cancel`)
  }

  const handleProceedPayment = () => {
    setErrors({})

    const nextErrors: FieldErrors = {}
    if (fullName.trim().length < 2) {
      nextErrors.fullName = locale === "vi" ? "Vui lòng nhập họ và tên" : "Please enter your full name"
    }

    const normalizedPhone = phone.replace(/\s+/g, "")
    if (normalizedPhone.replace(/\D/g, "").length < 9) {
      nextErrors.phone = locale === "vi" ? "Số điện thoại không hợp lệ" : "Invalid phone number"
    }

    if (!validateEmail(email)) {
      nextErrors.email = locale === "vi" ? "Email không hợp lệ" : "Invalid email"
    }

    if (!agreeTerms) {
      nextErrors.agreeTerms = locale === "vi" ? "Vui lòng đồng ý với điều khoản" : "Please agree to the terms"
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (!room || state.selectedSlots.length === 0 || softLockExpired) return

    dispatch({ type: "SET_GUEST_INFO", name: fullName.trim(), phone: phone.trim(), email: email.trim() })
    
    // Open high-fidelity simulator modal instead of automatic routing
    setIsPaymentDialogOpen(true)
    setSimulatedStatus("idle")
  }

  const handleSimulatePaymentSuccess = async () => {
    if (!room) return
    setSimulatedStatus("verifying")
    setIsPaying(true)

    // Fallback id/code for guests (no DB row) — the DB generates real values for
    // authenticated bookings, so these are only used for the localStorage cache.
    const generateFrontCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let code = "DN-"
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }
    const fallbackBookingId = generateBookingId()
    const fallbackBookingCode = generateFrontCode()

    // These hold the canonical values used downstream. For authenticated users they
    // are replaced by the backend's server-computed booking (id, code, amounts).
    let finalBookingId = fallbackBookingId
    let finalBookingCode = fallbackBookingCode

    // Server-authoritative amounts. Default to the client estimate (guests / mock
    // rooms); replaced by the backend response for authenticated bookings.
    let savedTotal = finalPayableTotal
    let savedRoomFee = fees.roomFee
    let savedPlatformFee = fees.platformFee
    let savedPaidAmount = amountToPayNow
    let savedPointsRedeemed = pointsDiscount
    let savedPointsEarned = pointsEarned

    // Create via backend if authenticated and room.id is a valid UUID (real DB room).
    // The backend recomputes all amounts/points and writes booking + payment.
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room.id)

      if (user && isUuid) {
        const created = await createBooking({
          roomId: room.id,
          date: state.selectedDate,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
          paymentMode,
          paymentMethod: state.paymentMethod,
          redeemPoints,
        })

        finalBookingId = created.id
        finalBookingCode = created.bookingCode
        savedTotal = created.totalAmount
        savedRoomFee = created.subtotal
        savedPlatformFee = created.platformFee
        savedPaidAmount = created.amountPaidNow
        savedPointsRedeemed = created.pointsRedeemed
        savedPointsEarned = created.pointsEarned
        console.info("[Booking] Created via backend:", created.id, created.bookingCode)
      } else if (!user) {
        console.info("[Booking] Guest user — saved to localStorage only.")
      } else if (!isUuid) {
        console.warn("[Booking] room.id is not a valid UUID, skipping backend call:", room.id)
      }
    } catch (e: any) {
      // Authenticated booking failed — surface the real error and stop.
      // Do NOT pretend the booking succeeded.
      console.error("[Booking] Backend create failed:", e)
      toast.error(
        locale === "vi"
          ? `Không thể tạo đơn đặt: ${e?.message || e}`
          : `Could not create booking: ${e?.message || e}`,
      )
      setIsPaying(false)
      setSimulatedStatus("idle")
      return
    }

    dispatch({ type: "SET_BOOKING_ID", id: finalBookingId })

    const newBooking: Booking = {
      id: finalBookingId,
      roomId: room.id,
      roomName: room.name,
      venueName: room.venueName,
      venueAddress: room.address,
      date: state.selectedDate,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      duration: durationHours,
      guestName: fullName.trim(),
      guestPhone: phone.trim(),
      guestEmail: email.trim() || undefined,
      totalPrice: savedTotal,
      roomFee: savedRoomFee,
      platformFee: savedPlatformFee,
      status: "confirmed",
      paymentMethod: state.paymentMethod,
      checkInQr: `DINOMAD-${finalBookingId}`,
      wifiPassword: `${room.id}-wifi-${finalBookingId.slice(-3)}`,
      createdAt: new Date().toISOString(),

      // Dynamic payment metadata (deposited amount vs full payment)
      paidAmount: savedPaidAmount,
      paymentStatus: paymentMode === "deposit" ? "deposited" : "fully_paid",

      // Points metadata
      bookingCode: finalBookingCode,
      pointsRedeemed: savedPointsRedeemed,
      pointsEarned: savedPointsEarned
    }

    // Defer API / Webhook loading spinner simulation
    await new Promise((r) => setTimeout(r, 1500))
    setSimulatedStatus("success")
    
    await new Promise((r) => setTimeout(r, 800))
    setIsPaying(false)
    setIsPaymentDialogOpen(false)
    addBooking(newBooking)
    dispatch({ type: "SET_CONFIRMED_BOOKING", booking: newBooking })
    router.push(`/${locale}/checkout/success?id=${finalBookingId}`)
  }

  if (!room || state.selectedSlots.length === 0) {
    return (
      <EmptyCheckout 
        onGoHome={() => router.push(`/${locale}`)}
        onGoBack={() => router.back()}
        locale={locale}
      />
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

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
            {/* 1. Agoda/Booking.com Style Booking Mode Selector */}
            <Card className="overflow-hidden border border-border/50 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 bg-muted/5 border-b border-border/40">
                <CardTitle className="text-lg flex items-center gap-2 font-bold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  {locale === "vi" ? "Lựa chọn Đặt chỗ & Đặt cọc" : "Booking & Payment Options"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 pt-5">
                <button
                  onClick={() => setPaymentMode("deposit")}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all gap-2 shadow-sm active:translate-y-[1px] ${
                    paymentMode === "deposit"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                      : "border-border hover:border-primary/50 bg-card text-muted-foreground"
                  }`}
                >
                  <span className={`font-bold text-xs uppercase tracking-wider ${paymentMode === "deposit" ? "text-primary" : "text-foreground"}`}>
                    {locale === "vi" ? "Đặt cọc trước 20%" : "Pay 20% Deposit"}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "vi" 
                      ? "Thanh toán một phần nhỏ ngay bây giờ để giữ chỗ chắc chắn. Phần còn lại thanh toán tại quán." 
                      : "Pay a small portion now to secure your space. Pay remaining 80% at property."}
                  </span>
                  <div className="text-lg font-black text-foreground mt-3 flex items-baseline gap-1">
                    {formatVND(fees.roomFee * 0.2 + fees.platformFee)}
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">{locale === "vi" ? "Đặt cọc" : "Deposit"}</span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMode("full")}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all gap-2 shadow-sm active:translate-y-[1px] ${
                    paymentMode === "full"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                      : "border-border hover:border-primary/50 bg-card text-muted-foreground"
                  }`}
                >
                  <span className={`font-bold text-xs uppercase tracking-wider ${paymentMode === "full" ? "text-primary" : "text-foreground"}`}>
                    {locale === "vi" ? "Thanh toán 100% ngay" : "Pay 100% In Full"}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {locale === "vi" 
                      ? "Trả trước toàn bộ để được thủ tục nhận phòng (check-in) siêu tốc ngay khi đến quán." 
                      : "Pay the full amount today for a completely hassle-free check-in experience."}
                  </span>
                  <div className="text-lg font-black text-foreground mt-3 flex items-baseline gap-1">
                    {formatVND(checkoutTotal)}
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">{locale === "vi" ? "Trả trước" : "Prepaid"}</span>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* 2. Customer details form */}
            <GuestInfoForm 
              fullName={fullName}
              setFullName={setFullName}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              agreeTerms={agreeTerms}
              setAgreeTerms={setAgreeTerms}
              errors={errors}
              onProceed={handleProceedPayment}
              canProceed={canProceed}
              isPaying={isPaying}
              locale={locale}
            />

            {/* Loyalty Points Section */}
            {userPoints > 0 && (
              <Card className="overflow-hidden border border-border/50 shadow-sm rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        {locale === "vi" ? "Điểm thưởng DiNOMAD" : "DiNOMAD Loyalty Points"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "vi" 
                          ? `Bạn đang có ${new Intl.NumberFormat("vi-VN").format(userPoints)} điểm (tương đương ${formatVND(userPoints)})`
                          : `You currently have ${new Intl.NumberFormat("vi-VN").format(userPoints)} points (equals ${formatVND(userPoints)})`}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                {redeemPoints && (
                  <div className="rounded-xl bg-primary/5 p-3.5 border border-primary/10 flex items-center justify-between text-xs transition-all animate-in fade-in slide-in-from-top-1.5 duration-200">
                    <span className="font-semibold text-primary">
                      {locale === "vi" ? "Khấu trừ điểm thưởng:" : "Points Discount Applied:"}
                    </span>
                    <span className="font-bold text-primary">
                      -{formatVND(pointsDiscount)}
                    </span>
                  </div>
                )}
              </Card>
            )}

            {/* 3. Multi-option Payment Selector */}
            <PaymentMethodSelector 
              paymentMethod={state.paymentMethod}
              onPaymentMethodChange={(v) => dispatch({ type: "SET_PAYMENT_METHOD", method: v })}
              totalPrice={amountToPayNow} // Dynamically update selected payment cost
              room={room}
              selectedDate={state.selectedDate}
              startTime={timeRange.startTime}
              isPaying={isPaying}
              locale={locale}
            />
          </div>

          {/* 4. Side Booking Summary */}
          <div className="lg:sticky lg:top-20 lg:self-start flex flex-col gap-4">
            <BookingSummary 
              room={room}
              selectedDate={state.selectedDate}
              selectedSlots={state.selectedSlots}
              durationHours={durationHours}
              roomFee={fees.roomFee}
              platformFee={fees.platformFee}
              totalPrice={amountToPayNow} // Dynamic total pricing displayed
              softLockExpired={softLockExpired}
              softLockDurationSeconds={softLockDurationSeconds}
              countdownKey={countdownKey}
              onExpire={() => setSoftLockExpired(true)}
              isPaying={isPaying}
              canProceed={canProceed}
              onProceed={handleProceedPayment}
              locale={locale}
              pointsDiscount={pointsDiscount}
              pointsEarned={pointsEarned}
            />

            <Button
              variant="outline"
              className="w-full rounded-xl font-semibold border-border hover:bg-muted"
              onClick={handleCancel}
              disabled={isPaying}
            >
              {t("payment.cancelBooking")}
            </Button>
          </div>
      </div>

      {/* 5. High-Fidelity Payment Gateway Simulator Modal */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={(v) => !isPaying && setIsPaymentDialogOpen(v)}>
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              {locale === "vi" ? "Cổng Thanh toán Demo" : "Secure Payment Gateway (Demo)"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {locale === "vi" ? "Mô phỏng thanh toán trực tiếp qua ví & thẻ điện tử" : "Simulated direct checkout processing"}
            </DialogDescription>
          </DialogHeader>

          {simulatedStatus === "verifying" ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="space-y-1">
                <p className="font-bold text-foreground">{locale === "vi" ? "Đang xác thực giao dịch..." : "Verifying payment..."}</p>
                <p className="text-xs text-muted-foreground">{locale === "vi" ? "Hệ thống đang kiểm tra số dư và ghi nhận hóa đơn." : "Securing bank details & writing to store."}</p>
              </div>
            </div>
          ) : simulatedStatus === "success" ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center border border-success/40 scale-110 duration-500 animate-in zoom-in-50">
                <Check className="h-8 w-8 text-success font-black" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg text-success">{locale === "vi" ? "Thanh Toán Thành Công!" : "Payment Confirmed!"}</p>
                <p className="text-xs text-muted-foreground">{locale === "vi" ? "Vé check-in của bạn đang được phát hành." : "Issuing check-in ticket..."}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-4">
              {/* Payment Details Metadata */}
              <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{locale === "vi" ? "Gói thanh toán:" : "Payment Option:"}</span>
                  <span className="font-bold text-foreground">
                    {paymentMode === "deposit" ? (locale === "vi" ? "Đặt cọc trước 20%" : "20% Deposit") : (locale === "vi" ? "Thanh toán 100%" : "Full Payment")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{locale === "vi" ? "Mã giao dịch ảo:" : "Simulated ID:"}</span>
                  <span className="font-mono font-semibold text-foreground">DINOMAD-TEMP-{(state.selectedRoom?.id || "RM").toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm pt-1.5 border-t border-border/20">
                  <span className="font-semibold text-foreground">{locale === "vi" ? "Số tiền thanh toán:" : "Amount due now:"}</span>
                  <span className="font-black text-primary">{formatVND(amountToPayNow)}</span>
                </div>
              </div>

              {/* Dynamic Gate Content per selected paymentMethod */}
              {state.paymentMethod === "vietqr" && (
                <div className="flex flex-col items-center justify-center gap-3 border border-border/40 rounded-xl p-4 bg-muted/10">
                  <div className="flex items-center gap-2 justify-center text-xs font-bold text-muted-foreground tracking-wide uppercase">
                    <Clock className="h-4 w-4 text-primary animate-pulse" />
                    <span>{locale === "vi" ? "Hết hạn sau:" : "Expires in:"}</span>
                    <span className="text-primary font-black font-mono text-sm">{formatTimer(timeLeft)}</span>
                  </div>
                  <DinomadQrCode
                    data={`PAY-${room.id}-${state.selectedDate}-${timeRange.startTime}-${amountToPayNow}`}
                    size={160}
                    className="border border-border/30 rounded-xl p-2 bg-white"
                  />
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-foreground">{locale === "vi" ? "Quét mã QR Ngân hàng" : "Scan Bank VietQR Code"}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {locale === "vi" 
                        ? "Mở ứng dụng ngân hàng và quét mã để thanh toán demo nhanh." 
                        : "Use any banking application to scan the dynamic mock QR code."}
                    </p>
                  </div>
                </div>
              )}

              {(state.paymentMethod === "momo" || state.paymentMethod === "zalopay") && (
                <div className="flex flex-col items-center justify-center gap-3 border border-border/40 rounded-xl p-6 bg-muted/10">
                  <div className="flex items-center gap-2 justify-center text-xs font-bold text-muted-foreground tracking-wide uppercase mb-2">
                    <Clock className="h-4 w-4 text-primary animate-pulse" />
                    <span>{locale === "vi" ? "Thời gian chờ:" : "Waiting time:"}</span>
                    <span className="text-primary font-black font-mono text-sm">{formatTimer(timeLeft)}</span>
                  </div>
                  <div className="relative h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 scale-105">
                    <Smartphone className="h-8 w-8 text-primary animate-bounce" />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white animate-ping" />
                  </div>
                  <div className="text-center space-y-1 mt-2">
                    <p className="text-xs font-bold text-foreground">
                      {locale === "vi" 
                        ? `Chờ xác nhận liên kết ứng dụng ${state.paymentMethod.toUpperCase()}` 
                        : `Awaiting ${state.paymentMethod.toUpperCase()} connection`}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {locale === "vi" 
                        ? `Vui lòng chuẩn bị mở ứng dụng ${state.paymentMethod.toUpperCase()} trên điện thoại.` 
                        : `Please unlock your mobile phone and launch ${state.paymentMethod.toUpperCase()}.`}
                    </p>
                  </div>
                </div>
              )}

              {state.paymentMethod === "card" && (
                <div className="border border-border/40 rounded-xl p-4 bg-muted/10 space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {locale === "vi" ? "Nhập thông tin Thẻ tín dụng" : "Enter Credit Card Details"}
                  </p>
                  
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">{locale === "vi" ? "Số Thẻ" : "Card Number"}</Label>
                      <Input 
                        value={cardNumber} 
                        onChange={(e) => setCardNumber(e.target.value)} 
                        className="h-8 rounded-lg text-xs" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{locale === "vi" ? "Hết hạn" : "Expiry"}</Label>
                        <Input 
                          value={cardExpiry} 
                          onChange={(e) => setCardExpiry(e.target.value)} 
                          className="h-8 rounded-lg text-xs text-center" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">CVV</Label>
                        <Input 
                          value={cardCvv} 
                          onChange={(e) => setCardCvv(e.target.value)} 
                          className="h-8 rounded-lg text-xs text-center" 
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulation triggers */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                <Button 
                  onClick={handleSimulatePaymentSuccess}
                  className="w-full bg-success text-success-foreground hover:bg-success/90 font-bold rounded-xl h-11"
                >
                  {locale === "vi" ? "Xác nhận chuyển khoản / Giả lập thành công" : "Confirm payment / Simulate Success"}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="w-full rounded-xl text-xs h-9 border-border text-muted-foreground hover:bg-muted"
                >
                  {locale === "vi" ? "Hủy giao dịch" : "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
