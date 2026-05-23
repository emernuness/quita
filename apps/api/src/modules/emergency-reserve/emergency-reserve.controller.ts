import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { EmergencyReserveService } from "./emergency-reserve.service";

const upsertSchema = z.object({
	currentAmount: z.number().nonnegative().optional(),
	targetAmount: z.number().nonnegative().nullable().optional(),
	monthlyTarget: z.number().nonnegative().nullable().optional(),
	isActive: z.boolean().optional(),
});

@ApiTags("emergency-reserve")
@Controller("emergency-reserve")
@UseGuards(JwtAuthGuard)
export class EmergencyReserveController {
	constructor(private readonly service: EmergencyReserveService) {}

	@Get()
	get(@CurrentUser("id") userId: string) {
		return this.service.get(userId);
	}

	@Put()
	upsert(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(upsertSchema)) body: z.infer<typeof upsertSchema>,
	) {
		return this.service.upsert(userId, body);
	}
}
