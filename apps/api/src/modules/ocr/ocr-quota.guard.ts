import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";

const MONTHLY_QUOTA = 50;

interface AuthedRequest extends Request {
	user?: { id: string };
}

/**
 * Bridge OCR Premium §4.3 — guarda de cota de OCR.
 *
 * Bloqueia se:
 * - Usuario nao for Premium.
 * - Conta de SettlementEvaluation.usedOcr=true do usuario no mes atual
 *   excede MONTHLY_QUOTA (default 50).
 */
@Injectable()
export class OcrQuotaGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<AuthedRequest>();
		const userId = req.user?.id;
		if (!userId) {
			throw new ForbiddenException("Não autenticado.");
		}

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { planType: true },
		});
		if (!user || user.planType !== "premium") {
			throw new ForbiddenException("OCR disponível apenas para o plano Premium.");
		}

		const monthStart = new Date();
		monthStart.setUTCDate(1);
		monthStart.setUTCHours(0, 0, 0, 0);

		const usedThisMonth = await this.prisma.settlementEvaluation.count({
			where: { userId, usedOcr: true, evaluatedAt: { gte: monthStart } },
		});

		if (usedThisMonth >= MONTHLY_QUOTA) {
			throw new ForbiddenException(
				`Cota mensal de OCR esgotada (${MONTHLY_QUOTA} usos). Volta no próximo mês.`,
			);
		}

		return true;
	}
}
