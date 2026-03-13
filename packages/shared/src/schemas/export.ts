import { z } from 'zod';
import { ExportFormat } from '../enums/index.js';

export const createExportSchema = z.object({
  format: z.enum([ExportFormat.PDF, ExportFormat.CSV]),
});
export type CreateExportInput = z.infer<typeof createExportSchema>;
