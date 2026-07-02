"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import confetti from "canvas-confetti"
import { useBooking } from "@/lib/store/booking-store"
import { ConfirmationView } from "../_components/confirmation-view"
import { getPublicRoomById } from "@/lib/api/public-rooms"
import type { Room } from "@/lib/types"



export default function CheckoutSuccessPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ id?: string }>
}) {
  const { locale } = use(params)
  const { id } = use(searchParams)
  const { t } = useTranslation()
  const router = useRouter()
  const { state, dispatch, myBookings } = useBooking()

  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load from state or query parameter
  const confirmedBooking = id ? myBookings.find(b => b.id === id) : state.confirmedBooking

  useEffect(() => {
    async function loadRoom() {
      if (!confirmedBooking) {
        setIsLoading(false)
        return
      }



      // Try state selection if matches
      if (state.selectedRoom && state.selectedRoom.id === confirmedBooking.roomId) {
        setRoom(state.selectedRoom)
        setIsLoading(false)
        return
      }

      // Fallback: Fetch from database
      try {
        const dbRoom = await getPublicRoomById(confirmedBooking.roomId)
        setRoom(dbRoom)
      } catch (error) {
        console.error("Failed to load room from database:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRoom()
  }, [confirmedBooking, state.selectedRoom])

  useEffect(() => {
    if (isLoading) return

    // If no booking data is found in store, redirect to home.
    if (!confirmedBooking || !room) {
      router.push(`/${locale}`)
      return
    }

    if (!id) {
      // Trigger a confetti explosion only for new checkout bookings (where id param is not present)
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [confirmedBooking, room, isLoading, router, locale, id])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted-foreground">
          {locale === "vi" ? "Đang tải thông tin đơn đặt..." : "Loading booking details..."}
        </p>
      </div>
    )
  }

  if (!confirmedBooking || !room) {
    return null
  }

  const handleBackHome = () => {
    dispatch({ type: "RESET" })
    router.push(`/${locale}`)
  }

  // The check-in QR/access code must never be shown for a booking that isn't
  // actually confirmed — pending (unpaid) and cancelled bookings have no valid
  // access, regardless of how this page was reached (link, direct URL, etc).
  if (confirmedBooking.status === "pending" || confirmedBooking.status === "cancelled") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-base font-semibold text-foreground">
          {confirmedBooking.status === "cancelled"
            ? t("confirmation.notAvailableCancelled")
            : t("confirmation.notAvailablePending")}
        </p>
        <button
          onClick={handleBackHome}
          className="mt-6 text-sm font-medium text-primary hover:underline"
        >
          {t("confirmation.backHome")}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ConfirmationView
        booking={confirmedBooking}
        room={room}
        onBackHome={handleBackHome}
        locale={locale}
      />
    </div>
  )
}
