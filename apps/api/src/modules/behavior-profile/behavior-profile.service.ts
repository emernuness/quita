import { Injectable } from "@nestjs/common";
import type { MainConcern, PreferredStrategy } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export interface UpsertBehaviorInput {
	preferredStrategy?: PreferredStrategy;
	mainConcern?: MainConcern;
	motivationLevel?: number;
	disciplineLevel?: number;
}

@Injectable()
export class BehaviorProfileService {
	constructor(private readonly prisma: PrismaService) {}

	get(userId: string) {
		return this.prisma.behaviorProfile.findUnique({ where: { userId } });
	}

	upsert(userId: string, data: UpsertBehaviorInput) {
		return this.prisma.behaviorProfile.upsert({
			where: { userId },
			create: {
				userId,
				preferredStrategy: data.preferredStrategy ?? "undecided",
				mainConcern: data.mainConcern ?? null,
				motivationLevel: data.motivationLevel ?? null,
				disciplineLevel: data.disciplineLevel ?? null,
			},
			update: {
				...(data.preferredStrategy && { preferredStrategy: data.preferredStrategy }),
				...(data.mainConcern && { mainConcern: data.mainConcern }),
				...(data.motivationLevel !== undefined && { motivationLevel: data.motivationLevel }),
				...(data.disciplineLevel !== undefined && { disciplineLevel: data.disciplineLevel }),
			},
		});
	}
}
