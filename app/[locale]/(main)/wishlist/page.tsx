"use client"

import { use, useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { useBooking } from "@/lib/store/booking-store"
import { getPublicRooms } from "@/lib/api/public-rooms"
import { RoomCard } from "@/components/room-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Search } from "lucide-react"
import Link from "next/link"
import type { Room } from "@/lib/types"

export default function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const { wishlist } = useBooking()
  
  const [favoriteRooms, setFavoriteRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getPublicRooms()
      .then((publicRooms) => {
        setFavoriteRooms(publicRooms.filter((r) => wishlist.includes(r.id)))
      })
      .catch((error) => console.warn("Could not load wishlist rooms:", error))
      .finally(() => setIsLoading(false))
  }, [wishlist])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {locale === "vi" ? "Phòng họp yêu thích" : "Favorite Workspaces"}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {locale === "vi"
            ? "Xem danh sách các phòng họp và không gian làm việc bạn đã lưu."
            : "Review your saved workspaces and meeting rooms."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : favoriteRooms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed rounded-3xl border-border/80 bg-card shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
            <Heart className="h-7 w-7 fill-red-500/10" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {locale === "vi" ? "Danh sách yêu thích trống" : "Your wishlist is empty"}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">
            {locale === "vi"
              ? "Hãy bấm nút trái tim ở các phòng họp để thêm vào danh sách yêu thích và truy cập nhanh tại đây!"
              : "Tap the heart icon on any workspace to save it to your wishlist for quick booking!"}
          </p>
          <Link href={`/${locale}/search`} className="mt-6">
            <Button className="rounded-xl font-bold px-6">
              <Search className="h-4 w-4 mr-2" />
              {locale === "vi" ? "Khám phá phòng họp" : "Search Spaces"}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  )
}
