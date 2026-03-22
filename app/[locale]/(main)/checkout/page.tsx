"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { useBooking } from "@/lib/store/booking-store"
import type { Booking, PaymentMethod, TimeSlot } from "@/lib/types"
import { generateBookingId } from "@/lib/format"
import { Button } from "@/components/ui/button"

import { BookingSummary } from "./_components/booking-summary"
import { GuestInfoForm } from "./_components/guest-info-form"
import { PaymentMethodSelector } from "./_components/payment-method-selector"
import { ConfirmationView } from "./_components/confirmation-view"
import { EmptyCheckout } from "./_components/empty-checkout"

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

  const fees = useMemo(() => {
    const roomFee = room ? room.pricePerHour * durationHours : 0
    const platformFee = Math.round(roomFee * 0.1)
    return { roomFee, platformFee, totalPrice: roomFee + platformFee }
  }, [room, durationHours])

  const checkoutTotal = state.totalPrice > 0 ? state.totalPrice : fees.totalPrice

  useEffect(() => {
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

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (!room || state.selectedSlots.length === 0 || softLockExpired) return

    dispatch({ type: "SET_GUEST_INFO", name: fullName.trim(), phone: phone.trim(), email: email.trim() })
    setIsPaying(true)

    const newBookingId = generateBookingId()
    dispatch({ type: "SET_BOOKING_ID", id: newBookingId })

    const newBooking: Booking = {
      id: newBookingId,
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
      totalPrice: checkoutTotal,
      roomFee: fees.roomFee,
      platformFee: fees.platformFee,
      status: "confirmed",
      paymentMethod: state.paymentMethod,
      checkInQr: `DINOMAD-${newBookingId}`,
      wifiPassword: `${room.id}-wifi-${newBookingId.slice(-3)}`,
      createdAt: new Date().toISOString(),
    }

    await new Promise((r) => setTimeout(r, 1400))
    setIsPaying(false)
    setBookingConfirmed(newBooking)
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

      {bookingConfirmed ? (
        <ConfirmationView 
          booking={bookingConfirmed}
          room={room}
          onBackHome={() => {
            dispatch({ type: "RESET" })
            router.push(`/${locale}`)
          }}
          locale={locale}
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
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

            <PaymentMethodSelector 
              paymentMethod={state.paymentMethod}
              onPaymentMethodChange={(v) => dispatch({ type: "SET_PAYMENT_METHOD", method: v })}
              totalPrice={checkoutTotal}
              room={room}
              selectedDate={state.selectedDate}
              startTime={timeRange.startTime}
              isPaying={isPaying}
              locale={locale}
            />
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start flex flex-col gap-4">
            <BookingSummary 
              room={room}
              selectedDate={state.selectedDate}
              selectedSlots={state.selectedSlots}
              durationHours={durationHours}
              roomFee={fees.roomFee}
              platformFee={fees.platformFee}
              totalPrice={checkoutTotal}
              softLockExpired={softLockExpired}
              softLockDurationSeconds={softLockDurationSeconds}
              countdownKey={countdownKeyRef.current}
              onExpire={() => setSoftLockExpired(true)}
              isPaying={isPaying}
              canProceed={canProceed}
              onProceed={handleProceedPayment}
              locale={locale}
            />

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
