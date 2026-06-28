import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { ResponseInterceptor } from "./common/interceptors/response.interceptor"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const apiPrefix = config.getOrThrow<string>("app.apiPrefix")

  app.setGlobalPrefix(apiPrefix)
  app.enableCors({
    origin: config.getOrThrow<string>("app.corsOrigin").split(",").map(o => o.trim()),
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

  const swaggerDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("DiNOMAD API")
      .setDescription("Booking marketplace backend — see CLAUDE.md for frontend integration conventions")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  )
  SwaggerModule.setup(`${apiPrefix}/docs`, app, swaggerDoc)

  await app.listen(config.getOrThrow<number>("app.port"))
}

void bootstrap()

