import { z } from 'zod';

export const budgetSchema = z
  .object({
    createdAt: z.iso.date(),
    endDate: z.iso.date(),
    id: z.string().min(1),
    initialBalance: z.number().nonnegative(),
    startDate: z.iso.date(),
  })
  .refine(budget => budget.endDate >= budget.startDate, {
    message: 'Дата окончания не может быть раньше начала',
    path: ['endDate'],
  });

export const transactionSchema = z.object({
  amount: z.number().positive(),
  date: z.iso.date(),
  id: z.number().int().positive(),
  type: z.enum(['expense', 'income']),
});

export const transactionDraftSchema = transactionSchema.omit({ id: true });

export const startFormDataSchema = z.object({
  endDate: z.iso.date(),
  initialBalance: z.number().positive(),
  startDate: z.iso.date(),
});

export type Budget = z.infer<typeof budgetSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionDraft = z.infer<typeof transactionDraftSchema>;
export type StartFormData = z.infer<typeof startFormDataSchema>;