import { Body, Controller, ForbiddenException, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import type { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { R2StorageService } from "../storage/r2-storage.service";
import { OcrConsentGuard } from "./ocr-consent.guard";
import type { OcrService } from "./ocr.service";

const MONTHLY_QUOTA = 50;

const signedUploadSchema = z.object({
	contentType: z.enum(["image/png", "image/jpeg", "image/jpg", "image/webp"]),
});

const extractByKeySchema = z.object({
	key: z.string().min(1).max(500),
	type: z.enum(["boleto", "settlement_proposal", "contract"]),
});

@ApiTags("ocr")
@Controller("ocr")
@UseGuards(JwtAuthGuard)
export class OcrController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly storage: R2StorageService,
		private readonly ocr: OcrService,
	) {}

	/**
	 * Spec Bridge OCR Premium E1.4 — quota mensal Premium.
	 */
	@Get("quota")
	async quota(@CurrentUser("id") userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { planType: true },
		});
		const planType = user?.planType ?? "free";

		const monthStart = new Date();
		monthStart.setUTCDate(1);
		monthStart.setUTCHours(0, 0, 0, 0);
		const monthEnd = new Date(monthStart);
		monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

		const used = await this.prisma.settlementEvaluation.count({
			where: { userId, usedOcr: true, evaluatedAt: { gte: monthStart } },
		});

		return {
			used,
			limit: planType === "premium" ? MONTHLY_QUOTA : 0,
			planType,
			resetsAt: monthEnd.toISOString(),
		};
	}

	/**
	 * Spec Bridge OCR Premium E1.2 — gera URL pre-assinada para upload
	 * direto do browser em R2 (sem trafegar base64).
	 *
	 * Requer consentimento OCR (NM-2) + plano Premium.
	 */
	@Post("signed-upload-url")
	@UseGuards(OcrConsentGuard)
	async signedUpload(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(signedUploadSchema)) body: { contentType: string },
	) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { planType: true },
		});
		if (user?.planType !== "premium") {
			throw new ForbiddenException("OCR disponível apenas para o plano Premium.");
		}

		const result = await this.storage.getSignedUploadUrl({
			keyPrefix: `ocr/${userId}`,
			contentType: body.contentType,
			ttlSeconds: 15 * 60,
		});

		if (!result) {
			throw new ForbiddenException("Storage não configurado no servidor.");
		}
		return result;
	}

	/**
	 * Spec Bridge OCR Premium E1.3 — extrai OCR de imagem ja uploaded em R2.
	 *
	 * Substitui o legacy `/settlements/evaluate-from-image` (que recebia
	 * base64). Agora client envia apenas a key R2; servidor le, extrai e
	 * retorna campos para confirmacao manual do user.
	 */
	@Post("extract-by-key")
	@UseGuards(OcrConsentGuard)
	async extractByKey(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(extractByKeySchema))
		body: { key: string; type: "boleto" | "settlement_proposal" | "contract" },
	) {
		// Garante que key pertence ao user (prefix-based isolation)
		if (!body.key.startsWith(`ocr/${userId}/`)) {
			throw new ForbiddenException("Key não pertence a este usuário.");
		}

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { planType: true },
		});
		if (user?.planType !== "premium") {
			throw new ForbiddenException("OCR disponível apenas para o plano Premium.");
		}

		const buffer = await this.storage.getObjectBuffer(body.key);
		if (!buffer) {
			throw new ForbiddenException("Imagem não encontrada no storage.");
		}

		const extracted = await this.ocr.extract({
			imageBase64: buffer.toString("base64"),
			type: body.type,
		});

		return { extracted, key: body.key };
	}
}
