import { registerAs } from "@nestjs/config"

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? "api",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
}))

