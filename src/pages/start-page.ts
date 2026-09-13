import { format } from 'date-fns';

import { initAmountField, renderInput } from '../components/input';
import {
  getPeriodOptions,
  initPeriodSelect,
  renderPeriodSelect,
  type PeriodOption,
} from '../components/period-select';
import { parseAmount } from '../services/budget-calculator';
import { hasValidationErrors, setFieldError, validateStartForm } from '../utils/validation';

import type { StartFormData } from '../models/schemas';

export function renderStartPage(): string {
  const periodOptions = getPeriodOptions();

  return `
    <div class="page xl:justify-center" data-page="start">
      <div class="page-shell">
        <div class="panel panel-fill flex flex-col">
          <h1 class="heading-1">Начнём!</h1>
          <form class="mt-8 flex flex-1 flex-col gap-4" data-start-form>
            ${renderInput({
              id: 'balance',
              name: 'balance',
              label: 'Укажите баланс',
              placeholder: '0 ₽',
              inputMode: 'numeric',
            })}
            ${renderPeriodSelect({
              id: 'period',
              label: 'На срок',
              placeholder: 'Выберите срок',
              items: periodOptions,
            })}
            <button type="submit" class="btn-primary mt-auto lg:mt-8" data-submit>
              Рассчитать
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function initStartPage(
  root: ParentNode,
  handlers: { onCalculate: (data: StartFormData) => void }
): void {
  const form = root.querySelector('[data-start-form]');
  const balanceInput = root.querySelector('#balance');

  if (!(form instanceof HTMLFormElement) || !(balanceInput instanceof HTMLInputElement)) {
    return;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  let selectedPeriod: PeriodOption | null = null;

  initAmountField(balanceInput, {
    onInput: () => {
      setFieldError(root, 'balance', null);
    },
  });

  initPeriodSelect(root, 'period', option => {
    selectedPeriod = option;
    setFieldError(root, 'period', null);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();

    const initialBalance = parseAmount(balanceInput.value);
    const errors = validateStartForm({
      initialBalance,
      endDate: selectedPeriod?.endDate ?? '',
    });

    setFieldError(root, 'balance', errors.initialBalance ?? null);
    setFieldError(root, 'period', errors.endDate ?? null);

    if (hasValidationErrors(errors) || selectedPeriod === null) {
      return;
    }

    handlers.onCalculate({
      initialBalance,
      startDate: today,
      endDate: selectedPeriod.endDate,
    });
  });
}
