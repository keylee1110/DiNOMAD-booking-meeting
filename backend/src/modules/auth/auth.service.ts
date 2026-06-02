import { Injectable, UnauthorizedException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import type { AuthUser } from "../../common/types/auth-user"

type ProfileRow = {
  id: string
  email: string
  role: AuthUser["role"]
}

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async verifyBearerToken(authorization?: string): Promise<AuthUser> {
    const token = this.extractBearerToken(authorization)

    const { data, error } = await this.supabase.admin.auth.getUser(token)

    if (error || !data.user) {
      throw new UnauthorizedException("Invalid or expired access token")
    }

    const { data: profile } = await this.supabase.admin
      .from("profiles")
      .select("id,email,role")
      .eq("id", data.user.id)
      .maybeSingle<ProfileRow>()

    return {
      id: data.user.id,
      email: data.user.email ?? profile?.email ?? null,
      role: profile?.role,
    }
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException("Authorization header is required")
    }

    const [scheme, token] = authorization.split(" ")

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Authorization header must use Bearer token")
    }

    return token
  }
}

