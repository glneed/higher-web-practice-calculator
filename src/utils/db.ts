import { openDB, type IDBPDatabase } from 'idb';

import {
  budgetSchema,
  transactionDraftSchema,
  transactionSchema,
  type Budget,
  type StartFormData,
  type Transaction,
  type TransactionDraft,
} from '../models/schemas';

const DB_NAME = 'daily-budget-manager';
const DB_VERSION = 1;
const BUDGET_STORE = 'budget';
const TRANSACTION_STORE = 'transactions';
const CURRENT_BUDGET_ID = 'current';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(BUDGET_STORE)) {
        db.createObjectStore(BUDGET_STORE, { keyPath: 'id' });
      }
 
      if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
        const store = db.createObjectStore(TRANSACTION_STORE, {
          autoIncrement: true,
          keyPath: 'id',
        });
        store.createIndex('date', 'date');
      }
    },
  });

  return dbPromise;
}

export async function loadBudget(): Promise<Budget | null> {
  const db = await getDb();
  const value = await db.get(BUDGET_STORE, CURRENT_BUDGET_ID);
  const parsed = budgetSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}

export async function saveBudget(budget: Budget): Promise<void> {
  const parsed = budgetSchema.parse(budget);
  const db = await getDb();
  await db.put(BUDGET_STORE, parsed);
}

export async function loadTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  const items = await db.getAllFromIndex(TRANSACTION_STORE, 'date');

  return items.flatMap(item => {
    const parsed = transactionSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function addTransaction(entry: TransactionDraft): Promise<Transaction> {
  const parsed = transactionDraftSchema.parse(entry);
  const db = await getDb();
  const id = await db.add(TRANSACTION_STORE, parsed);

  return transactionSchema.parse({
    ...parsed,
    id: Number(id),
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(TRANSACTION_STORE, id);
}

export async function clearTransactions(): Promise<void> {
  const db = await getDb();
  await db.clear(TRANSACTION_STORE);
}

export function toBudget(data: StartFormData): Budget {
  return budgetSchema.parse({
    createdAt: data.startDate,
    endDate: data.endDate,
    id: CURRENT_BUDGET_ID,
    initialBalance: data.initialBalance,
    startDate: data.startDate,
  });
}