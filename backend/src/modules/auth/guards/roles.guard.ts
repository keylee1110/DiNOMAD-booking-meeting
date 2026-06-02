import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Request } from "express"
import { ROLES_KEY } from "../../../common/decorators/roles.decorator"
import type { AppRole, AuthUser } from "../../../common/types/auth-user"

type RequestWithUser = Request & { user?: AuthUser }

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles?.length) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const role = request.user?.role

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException("Insufficient permissions")
    }

    return true
  }
}

