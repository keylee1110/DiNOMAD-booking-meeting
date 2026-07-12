"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useBooking } from "@/lib/store/booking-store"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, Home } from "lucide-react"

export default function CheckoutCancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ roomId?: string }>
}) {
  const { locale } = use(params)
  const { roomId } = use(searchParams)
  const router = useRouter()
  const { state, dispatch } = useBooking()

  // Prefer the roomId passed via query (survives a page reload, unlike in-memory
  // booking state) so "try again" reliably lands on the room's detail page
  // instead of falling back to the homepage.
  const targetRoomId = roomId || state.selectedRoom?.id

  const handleTryAgain = () => {
    if (targetRoomId) {
      router.push(`/${locale}/rooms/${targetRoomId}`)
    } else {
      router.push(`/${locale}`)
    }
  }

  const handleGoHome = () => {
    dispatch({ type: "RESET" })
    router.push(`/${locale}`)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mb-6 flex justify-center">
        <XCircle className="h-24 w-24 text-destructive" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        {locale === "vi" ? "Thanh toán thất bại" : "Payment Cancelled"}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {locale === "vi"
          ? "Rất tiếc, giao dịch của bạn không thể hoàn tất hoặc đã bị hủy. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
          : "Sorry, your transaction could not be completed or was cancelled. Please try again or select a different payment method."}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={handleTryAgain} size="lg" className="gap-2">
          {targetRoomId ? <ArrowLeft className="h-4 w-4" /> : <Home className="h-4 w-4" />}
          {targetRoomId
            ? (locale === "vi" ? "Quay lại trang phòng" : "Back to Room")
            : (locale === "vi" ? "Về trang chủ" : "Back to Home")}
        </Button>
        <Button onClick={handleGoHome} variant="outline" size="lg" className="gap-2">
          <Home className="h-4 w-4" />
          {locale === "vi" ? "Về trang chủ" : "Back to Home"}
        </Button>
      </div>
    </div>
  )
}
