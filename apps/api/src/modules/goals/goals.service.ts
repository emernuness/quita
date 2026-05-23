import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { GoalType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface CreateGoalInput {
	goalType: GoalType;
	description: string;
	targetAmount?: number | null;
	targetDate?: string | null;
	priorityOrder?: number;
}

export interface UpdateGoalInput extends Partial<CreateGoalInput> {
	achievedAt?: string | null;
}

@Injectable()
export class GoalsService {
	constructor(private readonly prisma: PrismaService) {}

	list(userId: string) {
		return this.prisma.userGoal.findMany({
			where: { userId, isActive: true },
			orderBy: [{ priorityOrder: "asc" }, { createdAt: "desc" }],
		});
	}

	async create(userId: string, data: CreateGoalInput) {
		return this.prisma.userGoal.create({
			data: {
				userId,
				goalType: data.goalType,
				description: data.description,
				targetAmount: data.targetAmount ?? null,
				targetDate: data.targetDate ? new Date(data.targetDate) : null,
				priorityOrder: data.priorityOrder ?? 100,
			},
		});
	}

	async update(userId: string, id: string, data: UpdateGoalInput) {
		const goal = await this.prisma.userGoal.findUnique({ where: { id } });
		if (!goal) throw new NotFoundException("Goal not found");
		if (goal.userId !== userId) throw new ForbiddenException("Not your resource");
		return this.prisma.userGoal.update({
			where: { id },
			data: {
				...(data.goalType && { goalType: data.goalType }),
				...(data.description && { description: data.description }),
				...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
				...(data.targetDate !== undefined && {
					targetDate: data.targetDate ? new Date(data.targetDate) : null,
				}),
				...(data.priorityOrder !== undefined && { priorityOrder: data.priorityOrder }),
				...(data.achievedAt !== undefined && {
					achievedAt: data.achievedAt ? new Date(data.achievedAt) : null,
				}),
			},
		});
	}

	async remove(userId: string, id: string) {
		const goal = await this.prisma.userGoal.findUnique({ where: { id } });
		if (!goal) throw new NotFoundException("Goal not found");
		if (goal.userId !== userId) throw new ForbiddenException("Not your resource");
		await this.prisma.userGoal.update({ where: { id }, data: { isActive: false } });
		return { deleted: true };
	}
}
