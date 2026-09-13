import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

import arrowIcon from '../../assets/arrow.svg';
import { formatDaysLabel } from '../services/budget-calculator';

import { initDateInput, renderDateInput } from './date-input';

export interface PeriodOption {
  id: string;
  title: string;
  hint: string;
  days: number;
  endDate: string;
  label: string;
}

export interface PeriodSelectOptions {
  id: string;
  label: string;
  placeholder: string;
  items: PeriodOption[];
  selected?: PeriodOption;
}

function formatUntil(date: Date): string {
  return `до ${format(date, 'd MMMM', { locale: ru })}`;
}

export function getCustomPeriodOption(fromDate: Date, endDateIso: string): PeriodOption {
  const endDate = parseISO(endDateIso);
  const days = differenceInCalendarDays(endDate, fromDate) + 1;

  return {
    id: 'custom',
    title: 'Своя дата',
    hint: formatUntil(endDate),
    days,
    endDate: endDateIso,
    label: `${formatDaysLabel(days)} (${formatUntil(endDate)})`,
  };
}

function createPreset(id: string, title: string, fromDate: Date, endDate: Date): PeriodOption {
  const hint = formatUntil(endDate);

  return {
    id,
    title,
    hint,
    days: differenceInCalendarDays(endDate, fromDate) + 1,
    endDate: format(endDate, 'yyyy-MM-dd'),
    label: `${title} (${hint})`,
  };
}

export function getPeriodOptions(fromDate = new Date()): PeriodOption[] {
  return [
    createPreset('day', 'День', fromDate, fromDate),
    createPreset('week', 'Неделя', fromDate, addDays(fromDate, 6)),
    createPreset('twoWeeks', '2 недели', fromDate, addDays(fromDate, 13)),
    createPreset('month', 'Месяц', fromDate, addDays(fromDate, 30)),
    createPreset('monthEnd', 'До конца месяца', fromDate, endOfMonth(fromDate)),
    {
      id: 'custom',
      title: 'Своя дата',
      hint: '',
      days: 0,
      endDate: '',
      label: 'Своя дата',
    },
  ];
}

export function renderPeriodSelect(options: PeriodSelectOptions): string {
  const selectedLabel = options.selected?.label ?? options.placeholder;
  const selectedClass = options.selected ? 'text-text' : 'text-text-secondary';
  const items = options.items
    .map(
      item => `
        <li class="border-b border-border last:border-b-0">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-xs px-2 py-2 text-left text-text-secondary hover:bg-primary/10 hover:text-primary"
            data-option-id="${item.id}"
            data-title="${item.title}"
            data-hint="${item.hint}"
            data-label="${item.label}"
            data-days="${item.days}"
            data-end-date="${item.endDate}"
          >
            <span>${item.title}</span>
            ${item.hint ? `<span>${item.hint}</span>` : ''}
          </button>
        </li>
      `
    )
    .join('');

  return `
    <div class="flex flex-col gap-1" data-period-select="${options.id}">
      <span class="caption px-4">${options.label}</span>
      <div class="relative">
        <button
          type="button"
          id="${options.id}"
          class="field flex items-center justify-between gap-3 text-left"
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <span data-period-label class="${selectedClass}">${selectedLabel}</span>
          <img
            src="${arrowIcon}"
            width="16"
            height="16"
            alt=""
            class="h-4 w-4 shrink-0 rotate-90 object-contain"
          />
        </button>
        <ul
          id="${options.id}-list"
          class="absolute top-full z-10 mt-1 hidden w-full rounded-sm border border-primary bg-surface px-4 shadow-e2"
          role="listbox"
        >
          ${items}
        </ul>
        ${renderDateInput(options.id)}
      </div>
      <span class="caption px-4 text-error hidden" data-error-for="${options.id}"></span>
    </div>
  `;
}

export function initPeriodSelect(
  root: ParentNode,
  id: string,
  onChange: (option: PeriodOption) => void,
  fromDate = new Date()
): void {
  const wrap = root.querySelector(`[data-period-select="${id}"]`);
  const button = root.querySelector(`#${id}`);
  const list = root.querySelector(`#${id}-list`);
  const label = wrap?.querySelector('[data-period-label]');

  if (!(wrap instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) {
    return;
  }

  if (!(list instanceof HTMLElement) || !(label instanceof HTMLElement)) {
    return;
  }

  const calendar = initDateInput(root, id, {
    minDate: fromDate,
    onSelect: iso => {
      const option = getCustomPeriodOption(fromDate, iso);
      label.textContent = option.label;
      label.classList.remove('text-text-secondary');
      label.classList.add('text-text');
      button.setAttribute('aria-expanded', 'false');
      onChange(option);
    },
  });

  const closeList = (): void => {
    list.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
  };

  const closeAll = (): void => {
    closeList();
    calendar.close();
  };

  const toggleList = (): void => {
    calendar.close();
    const isOpen = list.classList.toggle('hidden') === false;
    button.setAttribute('aria-expanded', String(isOpen));
  };

  button.addEventListener('click', event => {
    event.stopPropagation();
    toggleList();
  });

  list.addEventListener('click', event => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const optionButton = target.closest('button[data-option-id]');

    if (!(optionButton instanceof HTMLButtonElement)) {
      return;
    }

    const option: PeriodOption = {
      id: optionButton.dataset.optionId ?? '',
      title: optionButton.dataset.title ?? '',
      hint: optionButton.dataset.hint ?? '',
      days: Number(optionButton.dataset.days),
      endDate: optionButton.dataset.endDate ?? '',
      label: optionButton.dataset.label ?? optionButton.dataset.title ?? '',
    };

    label.textContent = option.label;
    label.classList.remove('text-text-secondary');
    label.classList.add('text-text');
    closeList();

    if (option.id === 'custom') {
      calendar.open();
      button.setAttribute('aria-expanded', 'true');
    }

    onChange(option);
  });

  wrap.addEventListener('click', event => {
    event.stopPropagation();
  });

  const page = wrap.closest('[data-page]');

  if (page instanceof HTMLElement) {
    page.addEventListener('click', closeAll);
  }
}