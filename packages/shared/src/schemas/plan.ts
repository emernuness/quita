import { z } from "zod";
import { PlanStrategy } from "../enums/index.js";

export const updateStrategySchema = z.object({
	strategy: z.enum([
		PlanStrategy.SNOWBALL,
		PlanStrategy.AVALANCHE,
		PlanStrategy.HYBRID,
		PlanStrategy.CRISIS,
	]),
});
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>;
