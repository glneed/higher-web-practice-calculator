import deleteIcon from '../../assets/delete.svg';
import { formatDateRu, formatRubles, getAverageDailySpending } from '../services/budget-calculator';

import type { Budget, Transaction } from '../models/schemas';

export function renderHistoryPage(budget: Budget, transactions: Transaction[]): string {
  const average = getAverageDailySpending(transactions, budget.startDate);
  const rows = transactions
    .map(
      item => `
        <li class="flex items-center gap-3 border-b border-border py-4">
          <span class="font-bold">${item.type === 'income' ? '+' : ''}${formatRubles(item.amount)}</span>
          <span class="caption ml-auto">${formatDateRu(item.date)}</span>
          <button
            type="button"
            class="shrink-0 p-1"
            data-delete-id="${item.id}"
            aria-label="Удалить"
          >
            <img src="${deleteIcon}" width="12" height="12" alt="" class="h-3 w-3 object-contain" />
          </button>
        </li>
      `
    )
    .join('');

  return `
    <div class="page" data-page="history">
      <div class="page-shell">
        <div class="panel panel-fill flex flex-col">
          <h1 class="heading-1">История расходов</h1>
          <p class="mt-2 text-primary">Средние траты в день: ${formatRubles(average)}</p>
          <ul class="mt-8">${rows}</ul>
          <button type="button" class="btn-outline mt-auto w-full lg:mt-8" data-action="back">
            Вернуться
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initHistoryPage(
  root: ParentNode,
  handlers: { onBack: () => void; onDelete: (id: number) => void }
): void {
  const backButton = root.querySelector('[data-action="back"]');

  if (backButton instanceof HTMLButtonElement) {
    backButton.addEventListener('click', () => {
      handlers.onBack();
    });
  }

  root.querySelectorAll('[data-delete-id]').forEach(button => {
    button.addEventListener('click', () => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      handlers.onDelete(Number(button.dataset.deleteId));
    });
  });
}