"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
  roomId: string
  initialFavorited?: boolean
  accessToken?: string
}

export function WishlistButton({ roomId, initialFavorited = false, accessToken }: WishlistButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Tránh click ăn vào link card phòng
    if (!accessToken) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này!")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:4000/api/wishlists/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ roomId }),
      })

      if (res.ok) {
        const data = await res.json()
        setIsFavorited(data.favorited)
      }
    } catch (error) {
      console.error("Lỗi khi toggle wishlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-all duration-200"
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-colors duration-200",
          isFavorited ? "fill-red-500 stroke-red-500" : "stroke-gray-600"
        )}
      />
    </button>
  )
}