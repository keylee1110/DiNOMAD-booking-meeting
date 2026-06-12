"use client"

import { useState, useEffect } from "react"
import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface RedeemPointsProps {
  bookingTotal: number // Tổng tiền đơn hàng chưa giảm
  accessToken: string
  // Hàm callback để đẩy số tiền được giảm ngược ra component cha (trang Checkout)
  onApplyDiscount: (pointsUsed: number, discountAmount: number) => void 
}

export function RedeemPoints({ bookingTotal, accessToken, onApplyDiscount }: RedeemPointsProps) {
  const [balance, setBalance] = useState<number>(0)
  const [isApplied, setIsApplied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/point-transactions/balance", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          setBalance(data.balance)
        }
      } catch (error) {
        console.error("Lỗi khi lấy điểm thưởng:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (accessToken) {
      fetchBalance()
    }
  }, [accessToken])

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-xl w-full"></div>
  }

  // LUẬT 1: Phải có ít nhất 5 điểm mới hiện khung dùng điểm
  if (balance < 5) return null

  // LUẬT 2: Giảm tối đa 50% đơn hàng, quy đổi 1 điểm = 10.000đ
  const maxDiscountValue = bookingTotal * 0.5
  const maxPointsAllowed = Math.floor(maxDiscountValue / 10000)
  
  // Lấy số điểm có thể dùng thực tế (không được vượt quá số điểm đang có và số điểm tối đa cho phép)
  const pointsToUse = Math.min(balance, maxPointsAllowed)
  const discountAmount = pointsToUse * 10000

  // Nếu đơn hàng quá nhỏ (ví dụ phòng giá 10k -> max giảm 5k -> không đủ quy đổi 1 điểm) thì ẩn đi
  if (pointsToUse < 1) return null

  const handleToggle = () => {
    if (isApplied) {
      setIsApplied(false)
      onApplyDiscount(0, 0) // Hủy dùng điểm, reset tiền giảm về 0
    } else {
      setIsApplied(true)
      onApplyDiscount(pointsToUse, discountAmount) // Bật áp dụng điểm
    }
  }

  return (
    <div className={cn(
      "p-4 border rounded-xl flex items-center justify-between transition-all",
      isApplied ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full", 
          isApplied ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-500"
        )}>
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            Dùng {pointsToUse} điểm thưởng
          </p>
          <p className="text-sm text-gray-500">
            Giảm <span className="font-semibold text-green-600">
              -{discountAmount.toLocaleString("vi-VN")}đ
            </span> 
            <span className="ml-1 text-xs">(Ví đang có {balance} điểm)</span>
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
          isApplied 
            ? "bg-red-100 text-red-600 hover:bg-red-200" 
            : "bg-gray-900 text-white hover:bg-gray-800"
        )}
      >
        {isApplied ? "Hủy bỏ" : "Áp dụng"}
      </button>
    </div>
  )
}