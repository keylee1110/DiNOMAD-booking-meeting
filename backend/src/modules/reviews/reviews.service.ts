import { Injectable, BadRequestException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { CreateReviewDto } from "./dto/create-review.dto"

type ReviewRow = {
  id: string
  room_id: string
  customer_id: string
  booking_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

@Injectable()
export class ReviewsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const insertData = {
      customer_id: userId,
      room_id: dto.roomId,
      booking_id: dto.bookingId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    }

    const { data, error } = await this.supabase.admin
      .from("reviews")
      .insert(insertData)
      .select("*")
      .single<ReviewRow>()

    if (error) {
      if (error.code === "23505") {
        throw new BadRequestException("You have already rated the room for this booking.")
      }
      throw new Error(error.message)
    }
    
    return this.toReviewResponse(data)
  }

  async findByRoomId(roomId: string) {
    const { data, error } = await this.supabase.admin
      .from("reviews")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .returns<ReviewRow[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data.map((review) => this.toReviewResponse(review))
  }

  async findByBookingId(bookingId: string) {
    const { data, error } = await this.supabase.admin
      .from("reviews")
      .select("*")
      .eq("booking_id", bookingId)
      .single<ReviewRow>()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(error.message)
    }

    return this.toReviewResponse(data)
  }

  private toReviewResponse(review: ReviewRow) {
    return {
      id: review.id,
      roomId: review.room_id,
      customerId: review.customer_id,
      bookingId: review.booking_id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    }
  }
}