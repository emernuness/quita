import { z } from "zod";
import { PlanStrategy } from "../enums/index.js";

export const updateStrategySchema = z.object({
	strategy: z.enum([
		PlanStrategy.SMALLEST_FIRST,
		PlanStrategy.HIGHEST_INTEREST,
		PlanStrategy.CUSTOM,
	]),
});
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>;
