import { Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { UpdateMeDto } from "./dto/update-me.dto"

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: "customer" | "supplier" | "admin"
  status: "active" | "blocked" | "deleted"
  created_at: string
  updated_at: string
}

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findMe(userId: string) {
    const profile = await this.findProfileById(userId)
    return this.toProfileResponse(profile)
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .update({
        full_name: dto.fullName,
        phone: dto.phone,
        avatar_url: dto.avatarUrl,
      })
      .eq("id", userId)
      .select("*")
      .single<ProfileRow>()

    if (error || !data) {
      throw new NotFoundException("Profile not found")
    }

    return this.toProfileResponse(data)
  }

  async findAll() {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ProfileRow[]>()

    if (error) {
      throw new Error(error.message)
    }

    return data.map((profile) => this.toProfileResponse(profile))
  }

  private async findProfileById(userId: string) {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<ProfileRow>()

    if (error || !data) {
      throw new NotFoundException("Profile not found")
    }

    return data
  }

  private toProfileResponse(profile: ProfileRow) {
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }
  }
}

