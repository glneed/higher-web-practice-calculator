import { z } from 'zod';

export const startFormSchema = z.object({
  endDate: z.string().min(1, 'Выберите срок'),
  initialBalance: z.number().positive('Укажите баланс больше нуля'),
});

export const balanceFormSchema = z.object({
  endDate: z.string().min(1, 'Выберите срок'),
  remaining: z.number().nonnegative(),
  topUp: z.number().nonnegative(),
});

export type StartFormInput = z.infer<typeof startFormSchema>;
export type BalanceFormInput = z.infer<typeof balanceFormSchema>;

const collectErrors = (result: z.ZodSafeParseResult<unknown>): Record<string, string> => {
  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<Record<string, string>>((errors, issue) => {
    const key = String(issue.path[0] ?? '');
    if (key && errors[key] === undefined) {
      errors[key] = issue.message;
    }
    return errors;
  }, {});
};

export function validateStartForm(input: StartFormInput): Record<string, string> {
  return collectErrors(startFormSchema.safeParse(input));
}

export function validateBalanceForm(input: BalanceFormInput): Record<string, string> {
  return collectErrors(balanceFormSchema.safeParse(input));
}

export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Reflect.ownKeys(errors).length !== 0;
}

export function setFieldError(root: ParentNode, fieldId: string, message: string | null): void {
  const field = root.querySelector(`#${fieldId}`);
  const error = root.querySelector(`[data-error-for="${fieldId}"]`);
  const invalid = Boolean(message);

  if (field instanceof HTMLElement) {
    if (invalid) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  if (error instanceof HTMLElement) {
    error.textContent = message ?? '';
    error.classList.toggle('hidden', !invalid);
  }
}
