import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { validateEnv } from "./config/env.validation"
import appConfig from "./config/app.config"
import supabaseConfig from "./config/supabase.config"
import { DatabaseModule } from "./database/database.module"
import { AuthModule } from "./modules/auth/auth.module"
import { HealthModule } from "./modules/health/health.module"
import { SuppliersModule } from "./modules/suppliers/suppliers.module"
import { UsersModule } from "./modules/users/users.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, supabaseConfig],
      validate: validateEnv,
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    UsersModule,
    SuppliersModule,
  ],
})
export class AppModule {}

