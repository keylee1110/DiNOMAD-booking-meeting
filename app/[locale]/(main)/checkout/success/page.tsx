"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { useBooking } from "@/lib/store/booking-store"
import { ConfirmationView } from "../_components/confirmation-view"

export default function CheckoutSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const router = useRouter()
  const { state, dispatch } = useBooking()

  const { confirmedBooking, selectedRoom } = state

  useEffect(() => {
    // If no booking data is found in store, redirect to home.
    if (!confirmedBooking || !selectedRoom) {
      router.push(`/${locale}`)
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
