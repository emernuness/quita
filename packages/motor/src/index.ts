export * from "./types";
export { calculateCapacity } from "./capacity-calculator";
export { classifyState } from "./state-classifier";
export { selectMode } from "./mode-selector";
export {
	calculatePriority,
	calculatePriorityBatch,
	DEFAULT_WEIGHTS,
	type ClassifiedDebt,
	type FactorContribution,
	type PriorityScoreOutput,
	type ScoringContext,
	type ScoringWeights,
} from "./priority-engine";
export {
	getAllowedActions,
	isActionAllowed,
	OPERATION_MODE_RULES,
	type PlanStrategy,
	type PreferredStrategy,
	selectStrategy,
	type StrategySelectorInput,
} from "./strategy-selector";
export {
	type ClassifiedExpense,
	type ClassifyExpenseOptions,
	type ConsequenceType,
	type ExpenseCategory,
	type ExpenseDefaults,
	EXPENSE_CATEGORY_DEFAULTS,
	classifyExpense,
	type RawExpense,
} from "./expense-classifier";
export {
	type ClassifiedDebtMeta,
	type DebtCategoryDefaults,
	type InterestClass,
	type InterestRateReference,
	type RateSource,
	type RawDebt,
	classifyDebt,
} from "./debt-classifier";
export {
	type ExpenseFrequency,
	type SeasonalExpenseInput,
	type SeasonalProvisionResult,
	calculateMonthlyProvision,
} from "./seasonal-expense";
export {
	type EvaluateGoalInput,
	type GoalInput,
	type GoalProgress,
	evaluateGoal,
} from "./goal-tracker";
export {
	type SettlementEvaluationResult,
	type SettlementProposalInput,
	type SettlementRecommendation,
	evaluateSettlement,
} from "./settlement-validator";
export {
	type SimulationInput,
	type SimulationResult,
	type SimulationScenario,
	type SimulationStrategy,
	type SimulatorDebt,
	runSimulation,
} from "./simulator";
export {
	type MonthlyPlanDraft,
	type MonthlyPlanGeneratorInput,
	type RecommendedActionDraft,
	generateMonthlyPlan,
} from "./monthly-plan-generator";
export {
	type AggregateIncomeInput,
	type AggregateIncomeOptions,
	type IncomeContribution,
	type IncomeFrequency,
	type IncomeStability,
	aggregateMonthlyIncome,
} from "./income-aggregator";
export {
	type SmoothingInput,
	type SmoothingResult,
	applySmoothingRule,
	stateRank,
} from "./smoothing-rule";
export {
	type LongTermPlanInput,
	type LongTermPlanResult,
	type QuarterlyCheckpoint,
	projectLongTermPlan,
} from "./long-term-plan";
