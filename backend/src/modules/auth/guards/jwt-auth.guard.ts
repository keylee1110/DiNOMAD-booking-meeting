import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import type { Request } from "express"
import type { AuthUser } from "../../../common/types/auth-user"
import { AuthService } from "../auth.service"

type RequestWithUser = Request & { user?: AuthUser }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    request.user = await this.authService.verifyBearerToken(request.headers.authorization)
    return true
  }
}

