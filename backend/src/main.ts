import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { ResponseInterceptor } from "./common/interceptors/response.interceptor"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.setGlobalPrefix(config.getOrThrow<string>("app.apiPrefix"))
  app.enableCors({
    origin: config.getOrThrow<string>("app.corsOrigin").split(","),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  await app.listen(config.getOrThrow<number>("app.port"))
}

void bootstrap()

