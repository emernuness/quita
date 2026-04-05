import { z } from "zod";
export declare const createExportSchema: z.ZodObject<{
    format: z.ZodEnum<["pdf", "csv"]>;
}, "strip", z.ZodTypeAny, {
    format: "pdf" | "csv";
}, {
    format: "pdf" | "csv";
}>;
export type CreateExportInput = z.infer<typeof createExportSchema>;
//# sourceMappingURL=export.d.ts.map