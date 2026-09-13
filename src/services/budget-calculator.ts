import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import type { Transaction } from '../models/schemas';

export function getDaysInPeriod(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInCalendarDays(end, start) + 1;
}

export function getDailyBudget(initialBalance: number, days: number): number {
  return days > 0 ? Math.floor(initialBalance / days) : 0;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function formatRubles(value: number): string {
  return [formatNumber(value), '₽'].join(' ');
}

export function parseAmount(value: string): number {
  const numericPart = value.replace(/\D/g, '');
  return numericPart.length === 0 ? 0 : Number(numericPart);
}

export function formatDateRu(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMMM', { locale: ru });
}

export function getTodayExpenses(transactions: Transaction[], today: string): number {
  return transactions
    .filter(({ type, date }) => type === 'expense' && date === today)
    .reduce((total, { amount }) => total + amount, 0);
}

const totalByType = (items: Transaction[], wantedType: Transaction['type']): number =>
  items.filter(item => item.type === wantedType).reduce((total, item) => total + item.amount, 0);

function getIncomeTotal(transactions: Transaction[]): number {
  return totalByType(transactions, 'income');
}

export function getExpenseTotal(transactions: Transaction[]): number {
  return totalByType(transactions, 'expense');
}

export function getTotalBalance(initialBalance: number, transactions: Transaction[]): number {
  return initialBalance + getIncomeTotal(transactions) - getExpenseTotal(transactions);
}

export function getNextInitialBalance(
  initialBalance: number,
  remaining: number,
  transactions: Transaction[]
): number {
  const currentTotal = getTotalBalance(initialBalance, transactions);
  return initialBalance + remaining - currentTotal;
}

export function getDailyLimit(
  initialBalance: number,
  days: number,
  transactions: Transaction[]
): number {
  const available = initialBalance + getIncomeTotal(transactions);
  return getDailyBudget(available, days);
}

export function getAverageDailySpending(transactions: Transaction[], startDate: string): number {
  const spent = getExpenseTotal(transactions);
  const elapsed = differenceInCalendarDays(new Date(), parseISO(startDate)) + 1;
  return Math.round(spent / Math.max(1, elapsed));
}

export function formatDaysLabel(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${count} день`;
  }
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${count} дня`;
  }
  return `${count} дней`;
}