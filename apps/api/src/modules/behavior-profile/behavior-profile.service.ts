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

	async upsert(userId: string, data: UpsertBehaviorInput) {
		const result = await this.prisma.behaviorProfile.upsert({
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

		// Promove diagnosisLevel para 'basic' quando user preenche perfil
		// comportamental (Fase 1 §7.1 — refinamento progressivo).
		if (data.preferredStrategy && data.preferredStrategy !== "undecided") {
			await this.prisma.user
				.updateMany({
					where: { id: userId, diagnosisLevel: "minimal" },
					data: { diagnosisLevel: "basic" },
				})
				.catch(() => undefined);
		}

		return result;
	}
}
