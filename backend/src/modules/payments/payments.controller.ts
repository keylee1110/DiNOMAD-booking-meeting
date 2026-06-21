import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  Logger,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PaymentsService, SePayWebhookPayload } from "./payments.service"

@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name)

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService
  ) {}

  @Post("sepay-webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("authorization") authHeader: string | undefined,
    @Body() payload: SePayWebhookPayload
  ) {
    const expectedApiKey = this.configService.get<string>("SEPAY_WEBHOOK_API_KEY")

    this.logger.log(`Handling webhook. Auth header present: ${!!authHeader}`)

    // 1. Verify Authorization Token if configured
    if (expectedApiKey) {
      if (!authHeader) {
        this.logger.warn("Webhook rejected: Missing Authorization header")
        throw new UnauthorizedException("Missing Authorization header")
      }

      // Check multiple authentication formats (Apikey token, Bearer token, or raw token)
      const isAuthorized =
        authHeader === expectedApiKey ||
        authHeader === `Apikey ${expectedApiKey}` ||
        authHeader === `Bearer ${expectedApiKey}` ||
        authHeader.toLowerCase() === `apikey ${expectedApiKey.toLowerCase()}` ||
        authHeader.toLowerCase() === `bearer ${expectedApiKey.toLowerCase()}`

      if (!isAuthorized) {
        this.logger.warn(`Webhook rejected: Invalid API Key authorization. Header received: "${authHeader}"`)
        throw new UnauthorizedException("Unauthorized: Invalid API Key")
      }
    } else {
      this.logger.warn("SEPAY_WEBHOOK_API_KEY is not set in environment. Skipping signature check.")
    }

    // 2. Process payload
    const result = await this.paymentsService.processWebhook(payload)
    return result
  }
}
