import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OcrQuotaGuard } from "../ocr/ocr-quota.guard";
import { SettlementsService } from "./settlements.service";

const evaluateSchema = z.object({
	debtId: z.string().uuid(),
	proposalCashAmount: z.number().nonnegative().optional(),
	proposalInstallments: z.number().int().min(1).max(60).optional(),
	proposalInstallmentAmount: z.number().nonnegative().optional(),
	proposalDeadline: z.string().date().optional(),
});

const evaluateFromImageSchema = z.object({
	debtId: z.string().uuid(),
	imageBase64: z.string().min(100),
});

@ApiTags("settlements")
@Controller("settlements")
@UseGuards(JwtAuthGuard)
export class SettlementsController {
	constructor(private readonly service: SettlementsService) {}

	@Post("evaluate")
	@Throttle({ default: { limit: 20, ttl: 60_000 } })
	async evaluate(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(evaluateSchema)) body: z.infer<typeof evaluateSchema>,
	) {
		return this.service.evaluate(userId, body);
	}

	@Post("validate-from-image")
	@UseGuards(OcrQuotaGuard)
	@Throttle({ default: { limit: 5, ttl: 60_000 } })
	async evaluateFromImage(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(evaluateFromImageSchema))
		body: z.infer<typeof evaluateFromImageSchema>,
	) {
		return this.service.evaluateFromImage(userId, body);
	}
}
