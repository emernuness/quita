import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BehaviorProfileService } from "./behavior-profile.service";

const upsertSchema = z.object({
	preferredStrategy: z.enum(["snowball", "avalanche", "hybrid", "undecided"]).optional(),
	mainConcern: z
		.enum(["collection_pressure", "service_cut_risk", "disorganization", "shame", "where_to_start"])
		.optional(),
	motivationLevel: z.number().int().min(1).max(5).optional(),
	disciplineLevel: z.number().int().min(1).max(5).optional(),
});

@ApiTags("behavior-profile")
@Controller("behavior-profile")
@UseGuards(JwtAuthGuard)
export class BehaviorProfileController {
	constructor(private readonly service: BehaviorProfileService) {}

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
