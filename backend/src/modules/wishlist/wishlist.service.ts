import { Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { ToggleWishlistDto } from "./dto/toggle-wishlist.dto"

type WishlistRow = {
  user_id: string
  room_id: string
  created_at: string
}

@Injectable()
export class WishlistService {
  constructor(private readonly supabase: SupabaseService) {}

  async toggle(userId: string, dto: ToggleWishlistDto) {
    // 1. Kiểm tra xem phòng này đã có trong wishlist của user chưa
    const { data: existing } = await this.supabase.admin
      .from("wishlists")
      .select("*")
      .eq("user_id", userId)
      .eq("room_id", dto.roomId)
      .maybeSingle<WishlistRow>()

    if (existing) {
      // 2. Nếu đã tồn tại -> Xóa khỏi wishlist (Unlike)
      const { error } = await this.supabase.admin
        .from("wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("room_id", dto.roomId)

      if (error) throw new Error(error.message)
      return { favorited: false, message: "Removed from wishlist" }
    } else {
      // 3. Nếu chưa tồn tại -> Thêm vào wishlist (Like)
      const { error } = await this.supabase.admin
        .from("wishlists")
        .insert({
          user_id: userId,
          room_id: dto.roomId,
        })

      if (error) throw new Error(error.message)
      return { favorited: true, message: "Added to wishlist" }
    }
  }

  async findAll(userId: string) {
    // Lấy danh sách wishlist kèm theo thông tin chi tiết của Room liên kết
    const { data, error } = await this.supabase.admin
      .from("wishlists")
      .select(`
        created_at,
        rooms (
          id,
          name,
          price_per_hour,
          capacity,
          category,
          status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data
  }
}