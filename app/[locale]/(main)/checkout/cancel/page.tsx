"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useBooking } from "@/lib/store/booking-store"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, Home } from "lucide-react"

export default function CheckoutCancelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const { state, dispatch } = useBooking()

  const handleTryAgain = () => {
    if (state.selectedRoom) {
      router.push(`/${locale}/checkout`)
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
          {state.selectedRoom ? <ArrowLeft className="h-4 w-4" /> : <Home className="h-4 w-4" />}
          {state.selectedRoom
            ? (locale === "vi" ? "Thử thanh toán lại" : "Try Payment Again")
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
