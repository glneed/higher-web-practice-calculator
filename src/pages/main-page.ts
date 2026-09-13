import { format } from 'date-fns';

import { initAmountField, renderInput } from '../components/input';
import {
  formatDateRu,
  formatDaysLabel,
  formatNumber,
  formatRubles,
  getAverageDailySpending,
  getDailyLimit,
  getDaysInPeriod,
  getTodayExpenses,
  getTotalBalance,
  parseAmount,
} from '../services/budget-calculator';

import type { Budget, Transaction } from '../models/schemas';

export function renderMainPage(budget: Budget, transactions: Transaction[]): string {
  const days = getDaysInPeriod(budget.startDate, budget.endDate);
  const dailyBudget = getDailyLimit(budget.initialBalance, days, transactions);
  const totalBalance = getTotalBalance(budget.initialBalance, transactions);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayRemaining = dailyBudget - getTodayExpenses(transactions, today);
  const remainingClass = todayRemaining >= 0 ? 'text-success' : 'text-error';
  const statusText =
    todayRemaining >= 0
      ? '🎉 Отлично справились — сегодня вы в пределах лимита!'
      : 'Сегодня лимит превышен';

  const preview = [...transactions].slice(-3).reverse();
  const average = getAverageDailySpending(transactions, budget.startDate);
  const previewRows = preview
    .map(
      item => `
        <li class="flex items-center justify-between border-b border-border py-3">
          <span class="font-bold">${item.type === 'income' ? '+' : ''}${formatRubles(item.amount)}</span>
          <span class="caption">${formatDateRu(item.date)}</span>
        </li>
      `
    )
    .join('');

  return `
    <div class="page" data-page="main">
      <div class="page-shell">
        <section class="panel flex flex-col">
          <div class="flex items-start justify-between gap-4">
            <p class="caption">Общий баланс</p>
            <p class="body-accent whitespace-nowrap text-primary">${formatRubles(dailyBudget)} в день</p>
          </div>
          <p class="mt-2">
            <span class="heading-2">${formatRubles(totalBalance)}</span>
            <span class="ml-2 text-text-secondary">на ${formatDaysLabel(days)}</span>
          </p>
          <div class="mt-6 flex gap-3">
            <button type="button" class="btn-outline flex-1" data-action="edit">Изменить</button>
            <button type="button" class="btn-outline flex-1 lg:hidden" data-action="history">
              История расходов
            </button>
          </div>
        </section>

        <section class="panel mt-10 flex flex-col lg:mt-0">
          <p class="caption">На сегодня доступно</p>
          <p class="mt-2">
            <span class="text-[32px] font-bold leading-[120%] ${remainingClass}">${formatRubles(todayRemaining)}</span>
            <span class="text-lg text-text-secondary"> / ${formatNumber(dailyBudget)}</span>
          </p>
          <p class="caption mt-3">${statusText}</p>
          <div class="mt-8">
            ${renderInput({
              id: 'expense',
              name: 'expense',
              label: 'Введите трату',
              placeholder: '0 ₽',
              inputMode: 'numeric',
            })}
          </div>
        </section>

        <section class="panel hidden flex-col lg:flex">
          <p class="caption">История расходов</p>
          <p class="mt-2 text-primary">Средние траты в день: ${formatRubles(average)}</p>
          <ul class="mt-6">${previewRows}</ul>
          <button type="button" class="btn-outline mt-6 w-full" data-action="history">
            Смотреть всю историю
          </button>
        </section>
      </div>
    </div>
  `;
}

export function initMainPage(
  root: ParentNode,
  handlers: { onEdit: () => void; onHistory: () => void; onAddExpense: (amount: number) => void }
): void {
  const editButton = root.querySelector('[data-action="edit"]');
  const historyButtons = root.querySelectorAll('[data-action="history"]');
  const expenseInput = root.querySelector('#expense');

  if (editButton instanceof HTMLButtonElement) {
    editButton.addEventListener('click', () => {
      handlers.onEdit();
    });
  }

  historyButtons.forEach(button => {
    button.addEventListener('click', () => {
      handlers.onHistory();
    });
  });

  if (!(expenseInput instanceof HTMLInputElement)) {
    return;
  }

  const submitExpense = (): void => {
    const amount = parseAmount(expenseInput.value);

    if (amount <= 0) {
      return;
    }

    handlers.onAddExpense(amount);
  };

  initAmountField(expenseInput);

  expenseInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    submitExpense();
  });
}