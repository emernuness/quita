import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

interface DimensionScore {
	score: number; // 0..1
	lastUpdated: string | null; // ISO
	suggestions: string[];
}

export interface DataFreshnessResponse {
	dimensions: {
		income: DimensionScore;
		essentials: DimensionScore;
		behavior: DimensionScore;
		location: DimensionScore;
	};
	overallScore: number;
	nextReviewDate: string;
}

/**
 * Spec Fase 5 §6.12 C1 — score de freshness por dimensao.
 *
 * Cada dimensao tem 4 fatores binarios (0.25 cada):
 *   income: paymentDay + stabilityType!=stable + guaranteedAmount + updatedAt<30d
 *   essentials: ao menos 3 expenses + isEssential marcado + canReduce marcado + updatedAt<30d
 *   behavior: preferredStrategy!=undecided + motivationLevel + disciplineLevel + updatedAt<60d
 *   location: stateCode set + dependentsCount set + updatedAt<180d (location muda pouco)
 *
 * overallScore = media aritmetica das 4 dimensoes.
 */
@Injectable()
export class DataFreshnessService {
	constructor(private readonly prisma: PrismaService) {}

	async forUser(userId: string): Promise<DataFreshnessResponse> {
		const [user, incomes, expenses, behavior] = await Promise.all([
			this.prisma.user.findUnique({
				where: { id: userId },
				select: {
					stateCode: true,
					dependentsCount: true,
					updatedAt: true,
				},
			}),
			this.prisma.income.findMany({
				where: { userId, isActive: true },
				select: {
					paymentDay: true,
					stabilityType: true,
					guaranteedAmount: true,
					sourceCategory: true,
					updatedAt: true,
				},
			}),
			this.prisma.expense.findMany({
				where: { userId, isActive: true },
				select: {
					isEssential: true,
					canReduce: true,
					updatedAt: true,
				},
			}),
			this.prisma.behaviorProfile.findUnique({
				where: { userId },
				select: {
					preferredStrategy: true,
					motivationLevel: true,
					disciplineLevel: true,
					updatedAt: true,
				},
			}),
		]);

		const now = new Date();
		const isFresh = (d: Date | null | undefined, days: number) =>
			!!d && (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < days;

		// Income dimension — usa salary (sourceCategory='salary') principal
		const salary = incomes.find((i) => i.sourceCategory === "salary");
		const incomeScore: DimensionScore = {
			score:
				(salary?.paymentDay ? 0.25 : 0) +
				(salary?.stabilityType && salary.stabilityType !== "stable" ? 0.25 : 0) +
				(salary?.guaranteedAmount ? 0.25 : 0) +
				(isFresh(salary?.updatedAt ?? null, 30) ? 0.25 : 0),
			lastUpdated: salary?.updatedAt?.toISOString() ?? null,
			suggestions: [
				!salary?.paymentDay && "Informe o dia de recebimento",
				!salary?.stabilityType || salary.stabilityType === "stable"
					? "Indique se a renda varia (variavel/sazonal)"
					: null,
				!salary?.guaranteedAmount && "Informe quanto tem certeza de receber",
				salary && !isFresh(salary.updatedAt, 30) && "Renda nao atualizada ha mais de 30 dias",
			].filter((s): s is string => Boolean(s)),
		};

		const essentialMarked = expenses.filter((e) => e.isEssential).length;
		const reducibleMarked = expenses.filter((e) => e.canReduce !== null).length;
		const essentialsScore: DimensionScore = {
			score:
				(expenses.length >= 3 ? 0.25 : 0) +
				(essentialMarked > 0 ? 0.25 : 0) +
				(reducibleMarked > 0 ? 0.25 : 0) +
				(expenses.some((e) => isFresh(e.updatedAt, 30)) ? 0.25 : 0),
			lastUpdated:
				expenses
					.map((e) => e.updatedAt)
					.sort((a, b) => b.getTime() - a.getTime())[0]
					?.toISOString() ?? null,
			suggestions: [
				expenses.length < 3 && "Cadastre ao menos 3 despesas essenciais",
				essentialMarked === 0 && "Marque quais despesas sao essenciais (nao corta)",
				reducibleMarked === 0 && "Indique quais despesas podem ser reduzidas",
			].filter((s): s is string => Boolean(s)),
		};

		const behaviorScore: DimensionScore = {
			score:
				(behavior?.preferredStrategy && behavior.preferredStrategy !== "undecided" ? 0.25 : 0) +
				(behavior?.motivationLevel ? 0.25 : 0) +
				(behavior?.disciplineLevel ? 0.25 : 0) +
				(isFresh(behavior?.updatedAt ?? null, 60) ? 0.25 : 0),
			lastUpdated: behavior?.updatedAt?.toISOString() ?? null,
			suggestions: [
				!behavior?.preferredStrategy || behavior.preferredStrategy === "undecided"
					? "Escolha sua estrategia (avalanche, bola de neve, equilibrio)"
					: null,
				!behavior?.motivationLevel && "Indique nivel de motivacao atual",
				!behavior?.disciplineLevel && "Indique nivel de disciplina atual",
			].filter((s): s is string => Boolean(s)),
		};

		const locationScore: DimensionScore = {
			score:
				(user?.stateCode ? 0.4 : 0) +
				(user?.dependentsCount !== null && user?.dependentsCount !== undefined ? 0.3 : 0) +
				(isFresh(user?.updatedAt ?? null, 180) ? 0.3 : 0),
			lastUpdated: user?.updatedAt?.toISOString() ?? null,
			suggestions: [
				!user?.stateCode && "Informe seu estado (UF) — afeta calculo do minimo vital regional",
				(user?.dependentsCount === null || user?.dependentsCount === undefined) &&
					"Informe quantos dependentes vivem com voce",
			].filter((s): s is string => Boolean(s)),
		};

		const overallScore =
			(incomeScore.score + essentialsScore.score + behaviorScore.score + locationScore.score) / 4;

		const nextReview = new Date();
		nextReview.setDate(nextReview.getDate() + 30);

		return {
			dimensions: {
				income: incomeScore,
				essentials: essentialsScore,
				behavior: behaviorScore,
				location: locationScore,
			},
			overallScore,
			nextReviewDate: nextReview.toISOString(),
		};
	}
}
