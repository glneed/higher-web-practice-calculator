import { format } from 'date-fns';

import { budgetSchema, startFormDataSchema, transactionDraftSchema } from './models/schemas';
import { initBalancePage, renderBalancePage } from './pages/balance-page';
import { initHistoryPage, renderHistoryPage } from './pages/history-page';
import { initMainPage, renderMainPage } from './pages/main-page';
import { initStartPage, renderStartPage } from './pages/start-page';
import { getNextInitialBalance } from './services/budget-calculator';
import {
  addTransaction,
  clearTransactions,
  deleteTransaction,
  loadBudget,
  loadTransactions,
  saveBudget,
  toBudget,
} from './utils/db';
import { createStore } from './utils/state';

import type { Budget, Transaction } from './models/schemas';

type AppView = 'start' | 'main' | 'history' | 'balance';

interface AppState {
  budget: Budget | null;
  transactions: Transaction[];
  view: AppView;
}

export function initApp(): void {
  const root = document.querySelector('#app');
  if (!root) {
    return;
  }

  const store = createStore<AppState>({
    budget: null,
    transactions: [],
    view: 'start',
  });

  const currentDate = (): string => format(new Date(), 'yyyy-MM-dd');

  const refresh = async (view?: AppView): Promise<void> => {
    const [budget, transactions] = await Promise.all([loadBudget(), loadTransactions()]);
    const requestedView = view ?? store.getState().view;
    const nextView = budget ? (requestedView === 'start' ? 'main' : requestedView) : 'start';
 
    store.setState({ budget, transactions, view: nextView });
  };

  const addExpense = (amount: number): void => {
    void (async () => {
      const transaction = transactionDraftSchema.parse({
        amount,
        date: currentDate(),
        type: 'expense',
      });
      await addTransaction(transaction);
      await refresh();
    })();
  };

  const saveBalance = (
    budget: Budget,
    transactions: Transaction[],
    remaining: number,
    topUp: number,
    endDate: string
  ): void => {
    void (async () => {
      const nextBudget = budgetSchema.parse({
        ...budget,
        endDate,
        initialBalance: getNextInitialBalance(budget.initialBalance, remaining, transactions),
      });

      await saveBudget(nextBudget);

      if (topUp > 0) {
        await addTransaction(
          transactionDraftSchema.parse({ amount: topUp, date: currentDate(), type: 'income' })
        );
      }

      await refresh('main');
    })();
  };

  const render = (state: AppState): void => {
    const { budget, transactions } = state;

    switch (state.view) {
      case 'main':
        if (!budget) {
          break;
        }
        root.innerHTML = renderMainPage(budget, transactions);
        initMainPage(root, {
          onEdit: () => store.setState({ view: 'balance' }),
          onHistory: () => store.setState({ view: 'history' }),
          onAddExpense: addExpense,
        });
        return;

      case 'balance':
        if (!budget) {
          break;
        }
        root.innerHTML = renderBalancePage(budget, transactions);
        initBalancePage(root, budget, transactions, {
          onCancel: () => store.setState({ view: 'main' }),
          onSave: (remaining, topUp, endDate) =>
            saveBalance(budget, transactions, remaining, topUp, endDate),
        });
        return;

      case 'history':
        if (!budget) {
          break;
        }
        root.innerHTML = renderHistoryPage(budget, transactions);
        initHistoryPage(root, {
          onBack: () => store.setState({ view: 'main' }),
          onDelete: id => {
            void (async () => {
              await deleteTransaction(id);
              await refresh();
            })();
          },
        });
        return;
 
      case 'start':
      default:
        break;
    }

    root.innerHTML = renderStartPage();
    initStartPage(root, {
      onCalculate: data => {
        void (async () => {
          const nextBudget = toBudget(startFormDataSchema.parse(data));
          await saveBudget(nextBudget);
          await clearTransactions();
          await refresh('main');
        })();
      },
    });
  };

  store.subscribe(render);

  void refresh().catch(() => {
    store.setState({ budget: null, transactions: [], view: 'start' });
  });
}