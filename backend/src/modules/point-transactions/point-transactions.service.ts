import { Injectable, BadRequestException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { CreatePointTransactionDto } from "./dto/create-point-transaction.dto"

type PointTransactionRow = {
  id: string
  profile_id: string
  booking_id: string | null
  amount: number
  type: "earn" | "redeem" | "refund"
  description: string | null
  created_at: string
}

@Injectable()
export class PointTransactionsService {
  constructor(private readonly supabase: SupabaseService) {}

  // Lấy tổng điểm khả dụng trực tiếp từ bảng profiles (nguồn chân lý được cập nhật bởi trigger)
  async getBalance(userId: string) {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single()

    if (error || !data) throw new Error(error?.message ?? "Profile not found")
    return { balance: data.points || 0 }
  }

  // Hàm xử lý riêng cho việc Đổi điểm (Redeem) lúc thanh toán
  async redeemPoints(
    userId: string,
    bookingId: string,
    pointsToRedeem: number,
    bookingTotal: number
  ) {
    // 1. Kiểm tra tối thiểu 5 điểm
    const { balance } = await this.getBalance(userId)
    if (balance < 5) {
      throw new BadRequestException("Bạn cần có ít nhất 5 điểm khả dụng để sử dụng tính năng này.")
    }

    // 2. Kiểm tra xem ví có đủ điểm để trừ không
    if (pointsToRedeem > balance) {
      throw new BadRequestException("Số điểm trong ví không đủ.")
    }

    // 3. Kiểm tra luật: Giảm tối đa 50% đơn hàng (1 điểm = 10,000đ)
    const maxDiscountAllowed = bookingTotal * 0.5
    const discountValue = pointsToRedeem * 10000

    if (discountValue > maxDiscountAllowed) {
      throw new BadRequestException(
        `Bạn chỉ được dùng điểm để giảm tối đa 50% giá trị đơn hàng (${maxDiscountAllowed.toLocaleString("vi-VN")}đ).`
      )
    }

    // 4. Hợp lệ -> Thực hiện trừ điểm
    // Lưu ý: Trường amount cho loại giao dịch 'redeem' trong DB trigger được lưu dưới dạng số âm
    const { data, error } = await this.supabase.admin
      .from("point_transactions")
      .insert({
        profile_id: userId,
        booking_id: bookingId,
        amount: -pointsToRedeem,
        type: "redeem",
        description: `Dùng ${pointsToRedeem} điểm giảm giá cho đơn hàng ${bookingId}`,
      })
      .select("*")
      .single<PointTransactionRow>()

    if (error) throw new Error(error.message)
    return data
  }

  // Hàm tạo điểm thông thường (Earn từ đặt phòng thành công, Refund từ hủy phòng)
  async create(userId: string, dto: CreatePointTransactionDto) {
    const { data, error } = await this.supabase.admin
      .from("point_transactions")
      .insert({
        profile_id: userId,
        booking_id: dto.bookingId ?? null,
        amount: dto.amount,
        type: dto.type,
        description: dto.description ?? null,
      })
      .select("*")
      .single<PointTransactionRow>()

    if (error) throw new Error(error.message)
    return data
  }

  // Lấy lịch sử giao dịch
  async findAll(userId: string) {
    const { data, error } = await this.supabase.admin
      .from("point_transactions")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data
  }
}