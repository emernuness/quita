import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { PREMIUM_KEY } from "../decorators/premium-only.decorator";

@Injectable()
export class PremiumGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const isPremiumOnly = this.reflector.getAllAndOverride<boolean>(PREMIUM_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (!isPremiumOnly) return true;

		const { user } = context.switchToHttp().getRequest();
		if (user?.planType !== "premium") {
			throw new ForbiddenException("Esta funcionalidade requer o plano Premium");
		}
		return true;
	}
}
