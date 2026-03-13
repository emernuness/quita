import { z } from 'zod';
import { FinancialType, IncomeSource } from '../enums/index.js';

export const createIncomeSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum([
    FinancialType.FIXED,
    FinancialType.ONE_TIME,
    FinancialType.RECURRING,
  ]),
  dueDate: z.string().date().optional(),
  installments: z.number().int().positive().optional(),
  installmentAmount: z.number().positive().optional(),
  sourceCategory: z
    .enum([
      IncomeSource.SALARY,
      IncomeSource.EXTRA,
      IncomeSource.HELP,
      IncomeSource.OTHER,
    ])
    .optional(),
});
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

export const updateIncomeSchema = createIncomeSchema.partial();
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
