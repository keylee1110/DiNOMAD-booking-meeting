export type AppRole = "customer" | "supplier" | "admin"

export interface AuthUser {
  id: string
  email: string | null
  role?: AppRole
}

