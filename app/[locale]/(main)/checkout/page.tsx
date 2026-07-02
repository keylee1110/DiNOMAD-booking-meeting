"use client"

import { use, useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { useBooking } from "@/lib/store/booking-store"
import type { Booking, TimeSlot } from "@/lib/types"
import { generateBookingId, formatVND } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Smartphone, Check, Loader2, ShieldCheck, Clock, Sparkles } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { cancelPendingBooking } from "@/lib/api/bookings"

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

function generateGuestBookingCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = "DN-"
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function toVietnamUTC(dateStr: string, timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number)
  const [year, month, day] = dateStr.split("-").map(Number)
  const utcDate = new Date(Date.UTC(year, month - 1, day, h - 7, m, 0, 0))
  return utcDate.toISOString()
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

  const bookingIdRef = useRef("")
  const isConfirmedRef = useRef(false)

  // null = guest checkout (no account) — booking is created with guest_name/guest_phone instead of customer_id.
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function getProfileData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAuthUser({ id: user.id })
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
      } else {
        // Guest checkout — no redirect. They fill GuestInfoForm and the hold is
        // created on "Proceed to Payment" instead of on page mount.
        setAuthUser(null)
      }
      setAuthChecked(true)
    }
    getProfileData()
  }, [supabase])

  // Booking Flow & Payment Options (Agoda/Booking style)
  const [paymentMode, setPaymentMode] = useState<"deposit" | "full">("deposit")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [simulatedStatus, setSimulatedStatus] = useState<"idle" | "verifying" | "success">("idle")

  const [bookingId, setBookingId] = useState<string>("")
  const [bookingCode, setBookingCode] = useState<string>("")
  const [isSavingBooking, setIsSavingBooking] = useState(false)

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

  // Supabase Realtime Subscription for Payment updates
  useEffect(() => {
    if (!isPaymentDialogOpen || !bookingId || !room) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePaymentSuccess = async (updated: any) => {
      setSimulatedStatus("success")
      setIsPaying(true)
      isConfirmedRef.current = true
      
      const finalBooking: Booking = {
        id: updated.id,
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
        totalPrice: updated.total_amount,
        roomFee: fees.roomFee,
        platformFee: fees.platformFee,
        status: "confirmed",
        paymentMethod: state.paymentMethod,
        checkInQr: `DINOMAD-${updated.id}`,
        wifiPassword: `${room.id}-wifi-${updated.id.slice(-3)}`,
        createdAt: updated.created_at,
        paidAmount: updated.payment_status === "deposited" ? amountToPayNow : finalPayableTotal,
        paymentStatus: updated.payment_status,
        bookingCode: updated.booking_code,
        pointsRedeemed: updated.points_redeemed,
        pointsEarned: updated.points_earned,
      }

      addBooking(finalBooking)
      dispatch({ type: "SET_CONFIRMED_BOOKING", booking: finalBooking })
      
      await new Promise((r) => setTimeout(r, 1500))
      setIsPaying(false)
      setIsPaymentDialogOpen(false)
      router.push(`/${locale}/checkout/success?id=${updated.id}`)
    }

    // 1. Realtime listener
    const channel = supabase
      .channel(`booking-payment-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          console.info("[Realtime] Booking updated:", payload.new)
          const updated = payload.new
          
          if (
            updated.status === "confirmed" &&
            (updated.payment_status === "deposited" || updated.payment_status === "fully_paid")
          ) {
            await handlePaymentSuccess(updated)
          }
        }
      )
      .subscribe()

    // 2. Fallback Polling every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const { data: updated, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle()
        
        if (!error && updated) {
          if (
            updated.status === "confirmed" &&
            (updated.payment_status === "deposited" || updated.payment_status === "fully_paid")
          ) {
            console.info("[Polling] Booking payment detected successfully:", updated)
            clearInterval(pollInterval)
            await handlePaymentSuccess(updated)
          }
        }
      } catch (e) {
        console.error("[Polling] Error fetching booking status:", e)
      }
    }, 5000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [
    isPaymentDialogOpen,
    bookingId,
    room,
    state.selectedDate,
    timeRange,
    durationHours,
    fullName,
    phone,
    email,
    fees,
    amountToPayNow,
    finalPayableTotal,
    pointsDiscount,
    pointsEarned,
    addBooking,
    dispatch,
    locale,
    router,
    supabase,
    state.paymentMethod
  ])
  
  // Visa Card Input Mocks
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444")
  const [cardExpiry, setCardExpiry] = useState("12/28")
  const [cardCvv, setCardCvv] = useState("123")

  // Payment Countdown Timer
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const softLockDurationSeconds = 5 * 60
  const [countdownKey, setCountdownKey] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.guestName) setFullName(state.guestName)
      if (state.guestPhone) setPhone(state.guestPhone)
      if (state.guestEmail) setEmail(state.guestEmail)
    }, 0)
    return () => clearTimeout(timer)
  }, [state.guestName, state.guestPhone, state.guestEmail])

  // Track latest bookingId for cleanup
  useEffect(() => {
    bookingIdRef.current = bookingId
  }, [bookingId])

  // Proactive cancel on page unmount if not confirmed
  useEffect(() => {
    return () => {
      const bid = bookingIdRef.current
      const isConfirmed = isConfirmedRef.current
      if (bid && !isConfirmed) {
        console.info("[Booking] Page unmounted, releasing/cancelling hold in background:", bid)
        cancelPendingBooking(bid).catch(err => {
          console.warn("Proactive cancel on unmount failed:", err)
        })
        sessionStorage.removeItem("dinomad_active_hold")
      }
    }
  }, [])

  // Cancels a pending booking via API (with Supabase fallback)
  const handleCancelBookingInDb = useCallback(async (id: string) => {
    if (!id) return
    try {
      console.info("[Booking] Cancelling booking in DB via API due to timeout/cancel:", id)
      await cancelPendingBooking(id)
    } catch (e) {
      console.error("Failed to cancel booking via API:", e)
      try {
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", id)
      } catch (err) {
        console.error("Supabase fallback cancel failed:", err)
      }
    }
  }, [supabase])

  // Create pending booking on page load/mount.
  // Guests (no account) skip this — their hold is created in handleProceedPayment
  // once they've filled in name/phone, since we have no identity to attach until then.
  useEffect(() => {
    let active = true

    async function createPendingBooking() {
      if (!authChecked || !room || state.selectedSlots.length === 0 || bookingId) return

      const cachedHoldStr = sessionStorage.getItem("dinomad_active_hold")
      if (cachedHoldStr) {
        try {
          const cachedHold = JSON.parse(cachedHoldStr)
          const isSameRoom = cachedHold.roomId === room.id
          const isSameDate = cachedHold.date === state.selectedDate
          const isSameSlots = JSON.stringify(cachedHold.slots) === JSON.stringify(state.selectedSlots)
          const elapsed = Date.now() - new Date(cachedHold.createdAt).getTime()
          const isStillValid = elapsed < 5 * 60 * 1000

          if (isSameRoom && isSameDate && isSameSlots && isStillValid) {
            console.info("[Booking] Reusing existing valid hold from session:", cachedHold.bookingId)
            if (active) {
              setBookingId(cachedHold.bookingId)
              setBookingCode(cachedHold.bookingCode)
              const remainingSeconds = Math.max(0, Math.floor((5 * 60 * 1000 - elapsed) / 1000))
              setTimeLeft(remainingSeconds)
              setCountdownKey(prev => prev + 1)
              setSoftLockExpired(false)
              dispatch({ type: "SET_BOOKING_ID", id: cachedHold.bookingId })
            }
            return
          } else {
            console.info("[Booking] Stale or mismatched hold found. Cancelling/removing:", cachedHold.bookingId)
            handleCancelBookingInDb(cachedHold.bookingId)
            sessionStorage.removeItem("dinomad_active_hold")
          }
        } catch (err) {
          console.error("Failed to parse cached hold:", err)
        }
      }

      // Guests have no identity to attach yet — they create their hold in
      // handleProceedPayment once name/phone are filled in and validated.
      if (!authUser) return

      setIsSavingBooking(true)
      const newId = generateBookingId()
      const newCode = generateGuestBookingCode()

      const startISO = toVietnamUTC(state.selectedDate, timeRange.startTime)
      const endISO = toVietnamUTC(state.selectedDate, timeRange.endTime)

      const insertPayload = {
        id: newId,
        room_id: room.id,
        customer_id: authUser.id,
        booking_date: state.selectedDate,
        start_time: startISO,
        end_time: endISO,
        status: "pending" as const,
        price_per_hour: room.pricePerHour,
        subtotal: fees.roomFee,
        platform_fee: fees.platformFee,
        total_amount: finalPayableTotal,
        points_redeemed: pointsDiscount,
        points_earned: pointsEarned,
        booking_code: newCode,
        payment_status: "pending",
      }

      console.info("[Booking] Creating soft-lock pending booking in DB:", newId, newCode)
      const { data, error } = await supabase
        .from("bookings")
        .insert(insertPayload)
        .select("created_at")
        .single()

      if (error) {
        console.error("[Booking] Soft-lock creation error:", error.message)
        toast.error(
          locale === "vi"
            ? "Mục giờ này đã được đặt hoặc đang được giữ bởi người khác. Vui lòng chọn giờ khác!"
            : "This time slot is already booked or held by another user. Please choose another time!"
        )
        if (active) {
          setSoftLockExpired(true)
          setIsSavingBooking(false)
        }
        return
      }

      const createdAtStr = data?.created_at || new Date().toISOString()
      sessionStorage.setItem(
        "dinomad_active_hold",
        JSON.stringify({
          bookingId: newId,
          bookingCode: newCode,
          roomId: room.id,
          date: state.selectedDate,
          slots: state.selectedSlots,
          createdAt: createdAtStr,
        })
      )

      if (active) {
        setBookingId(newId)
        setBookingCode(newCode)
        setTimeLeft(300)
        setCountdownKey(prev => prev + 1)
        setSoftLockExpired(false)
        dispatch({ type: "SET_BOOKING_ID", id: newId })
        setIsSavingBooking(false)
      }
    }

    createPendingBooking()

    return () => {
      active = false
    }
  }, [
    authChecked,
    authUser,
    room,
    state.selectedDate,
    state.selectedSlots,
    timeRange.startTime,
    timeRange.endTime,
    fees.roomFee,
    fees.platformFee,
    finalPayableTotal,
    pointsDiscount,
    pointsEarned,
    bookingId,
    dispatch,
    supabase,
    locale,
    handleCancelBookingInDb
  ])

  // Payment countdown timer effect (runs continuously once booking is created)
  useEffect(() => {
    if (!bookingId || softLockExpired) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setSoftLockExpired(true)
          setIsPaymentDialogOpen(false)
          handleCancelBookingInDb(bookingId)
          sessionStorage.removeItem("dinomad_active_hold")
          setBookingId("")
          setBookingCode("")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [bookingId, softLockExpired, handleCancelBookingInDb])

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
    authChecked &&
    !!room &&
    state.selectedSlots.length > 0 &&
    fullName.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 9 &&
    !softLockExpired &&
    !isPaying &&
    !isSavingBooking

  const handleCancel = () => {
    if (bookingId) {
      handleCancelBookingInDb(bookingId)
      sessionStorage.removeItem("dinomad_active_hold")
    }
    router.push(`/${locale}/checkout/cancel${room ? `?roomId=${room.id}` : ""}`)
  }

  const handleProceedPayment = async () => {
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
    if (authUser && !bookingId) return // logged-in hold still being created on mount

    setIsSavingBooking(true)
    dispatch({ type: "SET_GUEST_INFO", name: fullName.trim(), phone: phone.trim(), email: email.trim() })

    try {
      // Guest checkout: no hold exists yet (it's only auto-created for logged-in users
      // on mount) — create it now with the finalized, validated contact info.
      if (!authUser && !bookingId) {
        const newId = generateBookingId()
        const newCode = generateGuestBookingCode()
        const startISO = toVietnamUTC(state.selectedDate, timeRange.startTime)
        const endISO = toVietnamUTC(state.selectedDate, timeRange.endTime)

        const { error: insertError } = await supabase
          .from("bookings")
          .insert({
            id: newId,
            room_id: room.id,
            customer_id: null,
            guest_name: fullName.trim(),
            guest_phone: phone.trim(),
            guest_email: email.trim() || null,
            booking_date: state.selectedDate,
            start_time: startISO,
            end_time: endISO,
            status: "pending" as const,
            price_per_hour: room.pricePerHour,
            subtotal: fees.roomFee,
            platform_fee: fees.platformFee,
            total_amount: finalPayableTotal,
            points_redeemed: pointsDiscount,
            points_earned: pointsEarned,
            booking_code: newCode,
            payment_status: "pending",
          })

        if (insertError) {
          console.error("[Booking] Guest soft-lock creation error:", insertError.message)
          toast.error(
            locale === "vi"
              ? "Mục giờ này đã được đặt hoặc đang được giữ bởi người khác. Vui lòng chọn giờ khác!"
              : "This time slot is already booked or held by another user. Please choose another time!"
          )
          setSoftLockExpired(true)
          setIsSavingBooking(false)
          return
        }

        sessionStorage.setItem(
          "dinomad_active_hold",
          JSON.stringify({
            bookingId: newId,
            bookingCode: newCode,
            roomId: room.id,
            date: state.selectedDate,
            slots: state.selectedSlots,
            createdAt: new Date().toISOString(),
          })
        )

        setBookingId(newId)
        setBookingCode(newCode)
        setTimeLeft(300)
        setCountdownKey(prev => prev + 1)
        setSoftLockExpired(false)
        dispatch({ type: "SET_BOOKING_ID", id: newId })
        setIsPaymentDialogOpen(true)
        setSimulatedStatus("idle")
        setIsSavingBooking(false)
        return
      }

      const updatePayload = {
        total_amount: finalPayableTotal,
        points_redeemed: pointsDiscount,
        points_earned: pointsEarned,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("bookings")
        .update(updatePayload)
        .eq("id", bookingId)

      if (error) {
        console.error("[Booking] Supabase update error:", error.message)
        toast.error(
          locale === "vi"
            ? `Không thể cập nhật đơn đặt: ${error.message}`
            : `Failed to update booking: ${error.message}`
        )
        setIsSavingBooking(false)
        return
      }

      console.info("[Booking] Updated booking details and opening payment dialog:", bookingId)
      setIsPaymentDialogOpen(true)
      setSimulatedStatus("idle")
    } catch (e: any) {
      console.error("[Booking] Update exception:", e)
      toast.error(locale === "vi" ? `Lỗi hệ thống khi cập nhật đơn đặt: ${e.message || e}` : `System error updating booking: ${e.message || e}`)
      setIsSavingBooking(false)
      return
    }

    setIsSavingBooking(false)
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
              isPaying={isPaying}
              locale={locale}
              bookingCode={bookingCode}
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
              softLockDurationSeconds={timeLeft}
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
      <Dialog open={isPaymentDialogOpen} onOpenChange={(v) => {
        if (!isPaying) {
          setIsPaymentDialogOpen(v)
        }
      }}>
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
              {locale === "vi" ? "Thanh toán Đơn đặt chỗ" : "Booking Checkout Payment"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {locale === "vi" 
                ? "Vui lòng quét mã VietQR để hoàn tất giao dịch đặt phòng" 
                : "Please scan the VietQR code to complete your booking transaction"}
            </DialogDescription>
          </DialogHeader>

          {simulatedStatus === "verifying" ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="space-y-1">
                <p className="font-bold text-foreground">{locale === "vi" ? "Đang xác thực giao dịch chuyển khoản..." : "Verifying bank transfer..."}</p>
                <p className="text-xs text-muted-foreground">{locale === "vi" ? "Hệ thống đang ghi nhận thông tin và tạo hoá đơn chính thức." : "Recording transaction & generating official invoice."}</p>
              </div>
            </div>
          ) : simulatedStatus === "success" ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center border border-success/40 scale-110 duration-500 animate-in zoom-in-50">
                <Check className="h-8 w-8 text-success font-black" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg text-success">{locale === "vi" ? "Thanh Toán Thành Công!" : "Payment Confirmed!"}</p>
                <p className="text-xs text-muted-foreground">{locale === "vi" ? "Vé check-in của bạn đã được ghi nhận. Đang chuyển hướng..." : "Your check-in ticket has been issued. Redirecting..."}</p>
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
                  <span className="text-muted-foreground">{locale === "vi" ? "Mã hoá đơn:" : "Invoice ID:"}</span>
                  <span className="font-mono font-semibold text-foreground">{(bookingId || "RM").toUpperCase().slice(0, 18)}</span>
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
                  
                  {bookingCode ? (
                    <img
                      src={`https://qr.sepay.vn/img?acc=${process.env.NEXT_PUBLIC_SEPAY_BANK_ACC || "96247AVTD7"}&bank=${process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || "BIDV"}&amount=${amountToPayNow}&des=${bookingCode.replace("-", "")}&template=compact`}
                      alt="VietQR BIDV Payment QR"
                      className="rounded-xl overflow-hidden w-[180px] h-[180px] object-contain border border-border/20 bg-white p-1.5 shadow-sm"
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] bg-muted animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground text-center p-3">
                      {locale === "vi" ? "Đang tạo mã QR..." : "Generating QR..."}
                    </div>
                  )}

                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      {locale === "vi" ? "Quét mã chuyển nhanh qua VietQR" : "Scan to Pay Fast via VietQR"}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {locale === "vi" 
                        ? `Vui lòng chuyển đúng số tiền ${formatVND(amountToPayNow)} với nội dung là "${bookingCode.replace("-", "")}".` 
                        : `Please transfer exactly ${formatVND(amountToPayNow)} with the description "${bookingCode.replace("-", "")}".`}
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
                        ? `Chờ xác nhận giao dịch qua ví ${state.paymentMethod.toUpperCase()}` 
                        : `Awaiting ${state.paymentMethod.toUpperCase()} connection`}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {locale === "vi" 
                        ? `Vui lòng quét QR hoặc thanh toán trên app di động của bạn.` 
                        : `Please scan the payment QR or pay via the mobile app.`}
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

              {/* Payment status banner & action buttons */}
              <div className="flex flex-col gap-3 pt-2 border-t border-border/30">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-primary animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span className="font-bold text-center">
                    {locale === "vi" 
                      ? "Đang chờ SePay tự động xác nhận chuyển khoản..." 
                      : "Awaiting automatic bank transfer confirmation..."}
                  </span>
                </div>
                <p className="text-[10px] text-center text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {locale === "vi"
                    ? "Hệ thống sẽ tự động chuyển hướng khi nhận được tiền. Vui lòng chuyển chính xác số tiền và nội dung."
                    : "The system will automatically redirect when payment is received. Ensure exact amount and description."}
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsPaymentDialogOpen(false)
                    if (bookingId) {
                      handleCancelBookingInDb(bookingId)
                      sessionStorage.removeItem("dinomad_active_hold")
                      setBookingId("")
                      setBookingCode("")
                    }
                    router.push(`/${locale}/checkout/cancel${room ? `?roomId=${room.id}` : ""}`)
                  }}
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
