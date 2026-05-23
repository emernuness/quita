import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import type { PrismaService } from "../../prisma/prisma.service";

const OCR_CONSENT_VERSION = "ocr-v1";

interface AuthedRequest extends Request {
	user?: { id: string };
}

/**
 * Spec Bridge OCR Premium NM-2 — guarda de consentimento OCR.
 *
 * Bloqueia endpoints OCR se o user nao registrou ConsentLog com
 * consentType=data_processing version=OCR_CONSENT_VERSION + accepted=true.
 *
 * Frontend (E1.1) cria o consent antes de redirecionar para capture/E1.2.
 * Mudanca de versao (ex: OCR_CONSENT_VERSION="ocr-v2") forca novo aceite.
 */
@Injectable()
export class OcrConsentGuard implements CanActivate {
	constructor(private readonly prisma: PrismaService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<AuthedRequest>();
		const userId = req.user?.id;
		if (!userId) throw new ForbiddenException("Não autenticado.");

		const latest = await this.prisma.consentLog.findFirst({
			where: {
				userId,
				consentType: "data_processing",
				version: OCR_CONSENT_VERSION,
				accepted: true,
			},
			orderBy: { acceptedAt: "desc" },
		});

		if (!latest) {
			throw new ForbiddenException(
				"Consentimento OCR pendente. Aceite os termos em /app/ocr/consent antes de usar.",
			);
		}

		return true;
	}
}
