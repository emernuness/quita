import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

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
