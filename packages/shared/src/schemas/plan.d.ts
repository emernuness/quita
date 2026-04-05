import { z } from "zod";
export declare const updateStrategySchema: z.ZodObject<{
    strategy: z.ZodEnum<["smallest_first", "highest_interest", "custom"]>;
}, "strip", z.ZodTypeAny, {
    strategy: "smallest_first" | "highest_interest" | "custom";
}, {
    strategy: "smallest_first" | "highest_interest" | "custom";
}>;
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>;
//# sourceMappingURL=plan.d.ts.map