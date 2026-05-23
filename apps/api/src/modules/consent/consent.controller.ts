import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { ConsentType } from "@prisma/client";
import type { Request } from "express";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ConsentService } from "./consent.service";

const ConsentTypeEnum = z.enum([
	"terms_of_use",
	"privacy_policy",
	"data_processing",
	"marketing_communications",
]);

const recordConsentSchema = z.object({
	consentType: ConsentTypeEnum,
	version: z.string().min(1).max(20),
	accepted: z.boolean().optional().default(true),
});
type RecordConsentBody = z.infer<typeof recordConsentSchema>;

@ApiTags("consent")
@Controller("consent")
@UseGuards(JwtAuthGuard)
export class ConsentController {
	constructor(private readonly svc: ConsentService) {}

	@Get("status")
	status(@CurrentUser("id") userId: string) {
		return this.svc.status(userId);
	}

	@Post()
	record(
		@CurrentUser("id") userId: string,
		@Req() req: Request,
		@Body(new ZodValidationPipe(recordConsentSchema)) body: RecordConsentBody,
	) {
		return this.svc.record({
			userId,
			consentType: body.consentType as ConsentType,
			version: body.version,
			accepted: body.accepted,
			ipAddress: req.ip,
			userAgent: req.headers["user-agent"]?.slice(0, 500),
		});
	}
}
