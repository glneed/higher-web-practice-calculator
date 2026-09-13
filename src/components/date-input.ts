import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';

import arrowIcon from '../../assets/arrow.svg';

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const DAY_SLOT =
  'aspect-[30/32] flex min-h-8 w-full min-w-0 items-center justify-center rounded-xs text-sm';

export function renderDateInput(id: string): string {
  return `<div id="${id}-calendar" class="absolute top-full z-20 mt-1 hidden min-h-[249px] w-full rounded-lg bg-surface px-4 py-3 shadow-e2"></div>`;
}

function monthTitle(viewDate: Date): string {
  const name = format(viewDate, 'LLLL', { locale: ru });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function leadingEmptyCount(viewDate: Date): number {
  const weekday = getDay(startOfMonth(viewDate));
  return weekday === 0 ? 6 : weekday - 1;
}

function isDayDisabled(day: Date, minDate: Date): boolean {
  return isBefore(startOfDay(day), startOfDay(minDate));
}

function dayClass(day: Date, minDate: Date, selectedIso: string): string {
  if (isDayDisabled(day, minDate)) {
    return `${DAY_SLOT} cursor-not-allowed bg-transparent text-border`;
  }

  if (selectedIso && isSameDay(day, parseISO(selectedIso))) {
    return `${DAY_SLOT} bg-primary text-white`;
  }

  return `${DAY_SLOT} bg-background text-text hover:bg-primary/10 hover:text-primary`;
}

function renderCalendarBody(viewDate: Date, selectedIso: string, minDate: Date): string {
  const blanks = Array.from(
    { length: leadingEmptyCount(viewDate) },
    () => '<span class="aspect-[30/32] min-h-8 w-full min-w-0"></span>'
  );
  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate),
  }).map(day => {
    const iso = format(day, 'yyyy-MM-dd');
    const className = dayClass(day, minDate, selectedIso);
    const disabled = isDayDisabled(day, minDate) ? 'disabled' : '';
 
    return `
      <button type="button" class="${className}" data-cal-day="${iso}" ${disabled}>
        ${format(day, 'd')}
      </button>
    `;
  });

  const weekdays = WEEKDAYS.map(
    name =>
      `<span class="flex h-4 w-full items-center justify-center text-xs text-text-secondary">${name}</span>`
  ).join('');

  const navClass =
    'flex w-[29px] shrink-0 items-center justify-center self-stretch overflow-visible p-0 text-text-secondary';

  return `
    <div class="flex w-full items-center">
      <button type="button" class="${navClass}" data-cal-prev aria-label="Предыдущий месяц">
        <img src="${arrowIcon}" width="16" height="16" alt="" class="h-4 w-4 rotate-180 object-contain" />
      </button>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between">
          <p class="font-semibold">${monthTitle(viewDate)}</p>
          <p class="font-semibold">${format(viewDate, 'yyyy')}</p>
        </div>
        <div class="mt-2 grid grid-cols-7 gap-x-1 gap-y-0.5">
          ${weekdays}
          ${blanks.join('')}
          ${days.join('')}
        </div>
      </div>
      <button type="button" class="${navClass}" data-cal-next aria-label="Следующий месяц">
        <img src="${arrowIcon}" width="16" height="16" alt="" class="h-4 w-4 object-contain" />
      </button>
    </div>
  `;
}

export function initDateInput(
  root: ParentNode,
  id: string,
  handlers: {
    minDate?: Date;
    selectedDate?: string;
    onSelect: (iso: string) => void;
  }
): { open: () => void; close: () => void } {
  const calendar = root.querySelector(`#${id}-calendar`);

  if (!(calendar instanceof HTMLElement)) {
    return {
      open: () => undefined,
      close: () => undefined,
    };
  }

  const minDate = startOfDay(handlers.minDate ?? new Date());
  let viewDate = handlers.selectedDate ? parseISO(handlers.selectedDate) : minDate;
  let selectedIso = handlers.selectedDate ?? '';

  const paint = (): void => {
    calendar.innerHTML = renderCalendarBody(viewDate, selectedIso, minDate);

    const prev = calendar.querySelector('[data-cal-prev]');
    const next = calendar.querySelector('[data-cal-next]');

    if (prev instanceof HTMLButtonElement) {
      prev.addEventListener('click', event => {
        event.stopPropagation();
        viewDate = subMonths(viewDate, 1);
        paint();
      });
    }

    if (next instanceof HTMLButtonElement) {
      next.addEventListener('click', event => {
        event.stopPropagation();
        viewDate = addMonths(viewDate, 1);
        paint();
      });
    }

    calendar.querySelectorAll('[data-cal-day]').forEach(dayButton => {
      dayButton.addEventListener('click', event => {
        event.stopPropagation();

        if (!(dayButton instanceof HTMLButtonElement) || dayButton.disabled) {
          return;
        }

        selectedIso = dayButton.dataset.calDay ?? '';
        calendar.classList.add('hidden');
        handlers.onSelect(selectedIso);
      });
    });
  };

  paint();

  return {
    open: () => {
      paint();
      calendar.classList.remove('hidden');
    },
    close: () => {
      calendar.classList.add('hidden');
    },
  };
}
