import { parseISO } from 'date-fns';

import { initAmountField, renderInput } from '../components/input';
import {
  getCustomPeriodOption,
  getPeriodOptions,
  initPeriodSelect,
  renderPeriodSelect,
  type PeriodOption,
} from '../components/period-select';
import {
  formatRubles,
  getDailyBudget,
  getDailyLimit,
  getDaysInPeriod,
  getExpenseTotal,
  getNextInitialBalance,
  getTotalBalance,
  parseAmount,
} from '../services/budget-calculator';
import { hasValidationErrors, setFieldError, validateBalanceForm } from '../utils/validation';

import type { Budget, Transaction } from '../models/schemas';

function getSelectedPeriod(budget: Budget): PeriodOption {
  const items = getPeriodOptions(parseISO(budget.startDate));
  const matched = items.find(item => item.id !== 'custom' && item.endDate === budget.endDate);

  if (matched) {
    return matched;
  }

  return getCustomPeriodOption(parseISO(budget.startDate), budget.endDate);
}

export function renderBalancePage(budget: Budget, transactions: Transaction[]): string {
  const days = getDaysInPeriod(budget.startDate, budget.endDate);
  const dailyBudget = getDailyLimit(budget.initialBalance, days, transactions);
  const selectedPeriod = getSelectedPeriod(budget);
  const periodItems = getPeriodOptions(parseISO(budget.startDate));
  const remaining = getTotalBalance(budget.initialBalance, transactions);

  return `
    <div class="page" data-page="balance">
      <div class="page-shell">
        <div class="panel panel-fill flex flex-col">
          <div class="flex items-start justify-between gap-4">
            <h1 class="heading-1">Общий баланс</h1>
            <p class="body-accent whitespace-nowrap text-primary" data-daily-rate>
              ${formatRubles(dailyBudget)} в день
            </p>
          </div>
 
          <form class="mt-8 flex flex-1 flex-col gap-4" data-balance-form>
            ${renderInput({
              id: 'current-balance',
              name: 'currentBalance',
              label: 'Ваш баланс',
              value: formatRubles(remaining),
              inputMode: 'numeric',
            })}
            ${renderInput({
              id: 'top-up',
              name: 'topUp',
              label: 'Пополнить',
              placeholder: '+0 ₽',
              inputMode: 'numeric',
            })}
            ${renderPeriodSelect({
              id: 'period',
              label: 'На срок',
              placeholder: 'Выберите срок',
              items: periodItems,
              selected: selectedPeriod,
            })}
            <div class="mt-auto flex flex-col gap-3 lg:mt-8">
              <button type="button" class="btn-outline w-full" data-action="cancel">
                Вернуться без сохранения
              </button>
              <button type="submit" class="btn-primary">Сохранить</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function initBalancePage(
  root: ParentNode,
  budget: Budget,
  transactions: Transaction[],
  handlers: {
    onCancel: () => void;
    onSave: (remaining: number, topUp: number, endDate: string) => void;
  }
): void {
  const form = root.querySelector('[data-balance-form]');
  const balanceInput = root.querySelector('#current-balance');
  const topUpInput = root.querySelector('#top-up');
  const dailyRate = root.querySelector('[data-daily-rate]');

  const cancelButton = root.querySelector('[data-action="cancel"]');

  if (!(form instanceof HTMLFormElement) || !(balanceInput instanceof HTMLInputElement)) {
    return;
  }
 
  if (!(topUpInput instanceof HTMLInputElement) || !(dailyRate instanceof HTMLElement)) {
    return;
  }

  let selectedPeriod = getSelectedPeriod(budget);

  const updateDailyRate = (): void => {
    const remaining = parseAmount(balanceInput.value);
    const topUp = parseAmount(topUpInput.value);
    const funds = remaining + topUp + getExpenseTotal(transactions);
    const dailyBudget = getDailyBudget(funds, selectedPeriod.days);
    dailyRate.textContent = `${formatRubles(dailyBudget)} в день`;
  };

  initAmountField(balanceInput, {
    onInput: () => {
      setFieldError(root, 'current-balance', null);
      updateDailyRate();
    },
  });

  initAmountField(topUpInput, {
    prefix: '+',
    onInput: updateDailyRate,
  });

  initPeriodSelect(
    root,
    'period',
    option => {
      selectedPeriod = option;
      setFieldError(root, 'period', null);
      updateDailyRate();
    },
    parseISO(budget.startDate)
  );

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener('click', () => {
      handlers.onCancel();
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const remaining = parseAmount(balanceInput.value);
    const topUp = parseAmount(topUpInput.value);
    const errors = validateBalanceForm({
      endDate: selectedPeriod.endDate,
      remaining,
      topUp,
    });

    if (
      errors.remaining === undefined &&
      getNextInitialBalance(budget.initialBalance, remaining, transactions) < 0
    ) {
      errors.remaining = 'Нельзя поставить остаток меньше учтённых пополнений';
    }

    setFieldError(root, 'current-balance', errors.remaining ?? null);
    setFieldError(root, 'period', errors.endDate ?? null);

    if (hasValidationErrors(errors)) {
      return;
    }

    handlers.onSave(remaining, topUp, selectedPeriod.endDate);
  });
}