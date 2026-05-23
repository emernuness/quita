import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { GoalsService } from "./goals.service";

const GOAL_TYPES = [
	"debt_freedom",
	"house",
	"education",
	"family",
	"travel",
	"peace",
	"security",
	"retirement",
	"other",
] as const;

const createSchema = z.object({
	goalType: z.enum(GOAL_TYPES),
	description: z.string().min(1).max(500),
	targetAmount: z.number().nonnegative().nullable().optional(),
	targetDate: z.string().date().nullable().optional(),
	priorityOrder: z.number().int().optional(),
});

const updateSchema = createSchema.partial().extend({
	achievedAt: z.string().date().nullable().optional(),
});

@ApiTags("goals")
@Controller("goals")
@UseGuards(JwtAuthGuard)
export class GoalsController {
	constructor(private readonly service: GoalsService) {}

	@Get()
	list(@CurrentUser("id") userId: string) {
		return this.service.list(userId);
	}

	@Post()
	create(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>,
	) {
		return this.service.create(userId, body);
	}

	@Patch(":id")
	update(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>,
	) {
		return this.service.update(userId, id, body);
	}

	@Delete(":id")
	remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
		return this.service.remove(userId, id);
	}
}
