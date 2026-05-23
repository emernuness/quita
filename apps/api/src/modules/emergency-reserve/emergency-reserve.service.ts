import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface UpsertReserveInput {
	currentAmount?: number;
	targetAmount?: number | null;
	monthlyTarget?: number | null;
	isActive?: boolean;
}

@Injectable()
export class EmergencyReserveService {
	constructor(private readonly prisma: PrismaService) {}

	get(userId: string) {
		return this.prisma.emergencyReserve.findUnique({ where: { userId } });
	}

	async upsert(userId: string, data: UpsertReserveInput) {
		return this.prisma.emergencyReserve.upsert({
			where: { userId },
			create: {
				userId,
				currentAmount: data.currentAmount ?? 0,
				targetAmount: data.targetAmount ?? null,
				monthlyTarget: data.monthlyTarget ?? null,
				isActive: data.isActive ?? false,
				startedAt: data.isActive ? new Date() : null,
			},
			update: {
				...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
				...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
				...(data.monthlyTarget !== undefined && { monthlyTarget: data.monthlyTarget }),
				...(data.isActive !== undefined && {
					isActive: data.isActive,
					startedAt: data.isActive ? new Date() : null,
				}),
			},
		});
	}
}
