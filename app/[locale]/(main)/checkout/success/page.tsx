"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import confetti from "canvas-confetti"
import { useBooking } from "@/lib/store/booking-store"
import { ConfirmationView } from "../_components/confirmation-view"

import { rooms } from "@/lib/data/rooms"

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

  // Load from state or query parameter
  const confirmedBooking = id ? myBookings.find(b => b.id === id) : state.confirmedBooking
  const selectedRoom = confirmedBooking ? rooms.find(r => r.id === confirmedBooking.roomId) : state.selectedRoom

  useEffect(() => {
    // If no booking data is found in store, redirect to home.
    if (!confirmedBooking || !selectedRoom) {
      router.push(`/${locale}`)
    } else if (!id) {
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
  }, [confirmedBooking, selectedRoom, router, locale])

  if (!confirmedBooking || !selectedRoom) {
    return null
  }

  const handleBackHome = () => {
    dispatch({ type: "RESET" })
    router.push(`/${locale}`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ConfirmationView 
        booking={confirmedBooking}
        room={selectedRoom}
        onBackHome={handleBackHome}
        locale={locale}
      />
    </div>
  )
}
