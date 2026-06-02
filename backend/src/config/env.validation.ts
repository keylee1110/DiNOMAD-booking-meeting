import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default("api"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().optional(),
})

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config)

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`)
  }

  return parsed.data
}

