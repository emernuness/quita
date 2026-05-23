import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("support")
@Controller("support")
@UseGuards(JwtAuthGuard)
export class SupportController {
	constructor(private readonly prisma: PrismaService) {}

	@Get("channels")
	async listChannels(@Query("stateCode") stateCode?: string) {
		const channels = await this.prisma.supportChannel.findMany({
			where: {
				isActive: true,
				OR: stateCode ? [{ scope: "federal" }, { stateCode }] : undefined,
			},
			orderBy: { displayOrder: "asc" },
		});
		return channels;
	}
}
