import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { ConfidenceLevel, FinancialState } from "@prisma/client";
import { type SettlementProposalInput, evaluateSettlement } from "@quita/motor";
import type { PrismaService } from "../../prisma/prisma.service";
import type { MotorTriggerService } from "../../queues/motor-trigger.service";
import type { OcrExtractedSettlement, OcrService } from "../ocr/ocr.service";
import type { R2StorageService } from "../storage/r2-storage.service";

export interface EvaluateSettlementInput {
	debtId: string;
	proposalCashAmount?: number;
	proposalInstallments?: number;
	proposalInstallmentAmount?: number;
	proposalDeadline?: string;
}

export interface EvaluateFromImageInput {
	debtId: string;
	imageBase64: string;
}

@Injectable()
export class SettlementsService {
	private readonly logger = new Logger(SettlementsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly ocr: OcrService,
		private readonly storage: R2StorageService,
		private readonly motorTrigger: MotorTriggerService,
	) {}

	async evaluate(userId: string, input: EvaluateSettlementInput) {
		return this.runEvaluation(userId, input);
	}

	/**
	 * Bridge OCR Premium §7.3: avalia acordo a partir de imagem.
	 * 1. Verifica plano Premium (futuro: OcrQuotaGuard).
	 * 2. OCR extrai cashAmount/installments/deadline.
	 * 3. Persiste SettlementEvaluation com metadados OCR.
	 */
	async evaluateFromImage(userId: string, input: EvaluateFromImageInput) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { planType: true },
		});
		if (!user) throw new NotFoundException("User not found");
		if (user.planType !== "premium") {
			throw new ForbiddenException("Recurso disponível apenas para o plano Premium.");
		}

		// Upload da imagem para R2 antes de chamar OCR (audit + retencao Bridge §3).
		let ocrImageUrl: string | undefined;
		if (this.storage.isConfigured) {
			const imageBuffer = Buffer.from(input.imageBase64.replace(/^data:.+;base64,/, ""), "base64");
			const uploaded = await this.storage.upload({
				keyPrefix: `ocr/${userId}`,
				contentType: "image/png",
				body: imageBuffer,
			});
			if (uploaded) {
				ocrImageUrl = uploaded.publicUrl ?? uploaded.key;
			}
		}

		const extracted = (await this.ocr.extract({
			imageBase64: input.imageBase64,
			type: "settlement_proposal",
		})) as OcrExtractedSettlement;

		const evalInput: EvaluateSettlementInput = {
			debtId: input.debtId,
			proposalCashAmount: extracted.cashAmount ?? undefined,
			proposalInstallments: extracted.installments ?? undefined,
			proposalInstallmentAmount: extracted.installmentAmount ?? undefined,
			proposalDeadline: extracted.deadline ?? undefined,
		};

		return this.runEvaluation(userId, evalInput, {
			usedOcr: true,
			ocrImageUrl,
			ocrExtractedData: extracted as unknown as Record<string, unknown>,
			ocrConfidence: extracted.confidence,
		});
	}

	private async runEvaluation(
		userId: string,
		input: EvaluateSettlementInput,
		ocrMeta?: {
			usedOcr: boolean;
			ocrImageUrl?: string;
			ocrExtractedData?: Record<string, unknown>;
			ocrConfidence?: ConfidenceLevel | string;
		},
	) {
		const debt = await this.prisma.debt.findUnique({
			where: { id: input.debtId },
			include: { user: { select: { lastFinancialState: true } } },
		});
		if (!debt) throw new NotFoundException("Debt not found");
		if (debt.userId !== userId) throw new ForbiddenException("Not your resource");

		const latestPlan = await this.prisma.monthlyActionPlan.findFirst({
			where: { userId, isActive: true },
			orderBy: { generatedAt: "desc" },
		});

		const safeCapacity = latestPlan ? Number(latestPlan.safeCapacity) : 0;
		const financialState = (latestPlan?.financialState ??
			debt.user.lastFinancialState ??
			"tight_budget") as FinancialState;

		const remaining = Math.max(0, Number(debt.totalAmount) - Number(debt.amountPaid));
		const proposalInput: SettlementProposalInput = {
			debtId: debt.id,
			debtRemaining: remaining,
			proposalCashAmount: input.proposalCashAmount ?? null,
			proposalInstallments: input.proposalInstallments ?? null,
			proposalInstallmentAmount: input.proposalInstallmentAmount ?? null,
			proposalDeadline: input.proposalDeadline ? new Date(input.proposalDeadline) : null,
			safeCapacity,
			financialState: financialState as SettlementProposalInput["financialState"],
			now: new Date(),
		};

		const result = evaluateSettlement(proposalInput);

		const stored = await this.prisma.settlementEvaluation.create({
			data: {
				userId,
				debtId: debt.id,
				proposalCashAmount: input.proposalCashAmount ?? null,
				proposalInstallments: input.proposalInstallments ?? null,
				proposalInstallmentAmount: input.proposalInstallmentAmount ?? null,
				proposalDeadline: input.proposalDeadline ? new Date(input.proposalDeadline) : null,
				recommendation: result.recommendation,
				maxSafeInstallment: result.maxSafeInstallment ?? null,
				discountPercent: result.discountPercent ?? null,
				wouldCauseNegativeCashflow: result.wouldCauseNegativeCashflow,
				reasoning: result.reasoning,
				capacityAtEvaluation: safeCapacity,
				usedOcr: ocrMeta?.usedOcr ?? false,
				ocrImageUrl: ocrMeta?.ocrImageUrl ?? null,
				ocrExtractedData: (ocrMeta?.ocrExtractedData ?? undefined) as object | undefined,
				ocrConfidence: ocrMeta?.ocrConfidence ? (ocrMeta.ocrConfidence as ConfidenceLevel) : null,
			},
		});

		this.logger.log({
			msg: "settlement.evaluated",
			userId,
			debtId: debt.id,
			recommendation: result.recommendation,
			id: stored.id,
		});

		await this.motorTrigger.enqueue(userId, "settlement_evaluated");
		return {
			id: stored.id,
			recommendation: result.recommendation,
			maxSafeInstallment: result.maxSafeInstallment,
			discountPercent: result.discountPercent,
			wouldCauseNegativeCashflow: result.wouldCauseNegativeCashflow,
			reasoning: result.reasoning,
			capacityAtEvaluation: safeCapacity,
			usedOcr: ocrMeta?.usedOcr ?? false,
			ocrExtractedData: ocrMeta?.ocrExtractedData ?? null,
		};
	}
}
