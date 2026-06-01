import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

@Injectable()
export class SupabaseService {
  readonly admin: SupabaseClient
  readonly anon: SupabaseClient

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>("supabase.url")
    const anonKey = this.config.getOrThrow<string>("supabase.anonKey")
    const serviceRoleKey = this.config.getOrThrow<string>("supabase.serviceRoleKey")

    this.anon = createClient(url, anonKey)
    this.admin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
}

