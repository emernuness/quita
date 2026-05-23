/**
 * Spec: Fase 3 §12 — goal-tracker-service.
 *
 * Funcao pura: avalia se uma meta esta atingida e calcula progresso.
 */

export interface GoalInput {
	id: string;
	targetAmount: number | null;
	targetDate: Date | null;
	currentAmount?: number; // soma de depositos ou progresso declarado
	achievedAt: Date | null;
}

export interface GoalProgress {
	id: string;
	progressPercent: number; // 0-100
	isAchieved: boolean;
	achievedAt: Date | null;
	daysToTarget: number | null;
}

export interface EvaluateGoalInput {
	goal: GoalInput;
	now: Date;
}

export function evaluateGoal({ goal, now }: EvaluateGoalInput): GoalProgress {
	// Meta sem valor alvo nao tem progresso quantificavel.
	if (!goal.targetAmount || goal.targetAmount <= 0) {
		return {
			id: goal.id,
			progressPercent: goal.achievedAt ? 100 : 0,
			isAchieved: goal.achievedAt !== null,
			achievedAt: goal.achievedAt,
			daysToTarget: goal.targetDate ? daysBetween(now, goal.targetDate) : null,
		};
	}

	const current = goal.currentAmount ?? 0;
	const ratio = current / goal.targetAmount;
	const progressPercent = Math.min(100, Math.max(0, ratio * 100));
	const isAchieved = ratio >= 1;
	const achievedAt = isAchieved ? (goal.achievedAt ?? now) : null;

	return {
		id: goal.id,
		progressPercent,
		isAchieved,
		achievedAt,
		daysToTarget: goal.targetDate ? daysBetween(now, goal.targetDate) : null,
	};
}

function daysBetween(from: Date, to: Date): number {
	const ms = to.getTime() - from.getTime();
	return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
