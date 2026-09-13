import { formatRubles, parseAmount } from '../services/budget-calculator';

export interface InputOptions {
  action?: string;
  id: string;
  inputMode?: 'numeric' | 'text';
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
}

export function renderInput(options: InputOptions): string {
  const { id, name, label } = options;
  const value = options.value ?? '';
  const placeholder = options.placeholder ?? '';
  const inputMode = options.inputMode ?? 'text';
  const action = options.action ?? '';
  const className = action ? 'field pr-12' : 'field';

  return `
    <label class="flex flex-col gap-1" for="${id}">
      <span class="caption px-4">${label}</span>
      <div class="relative">
        <input
          id="${id}"
          name="${name}"
          class="${className}"
          type="text"
          inputmode="${inputMode}"
          value="${value}"
          placeholder="${placeholder}"
          autocomplete="off"
        />
        ${action}
      </div>
      <span class="caption px-4 text-error hidden" data-error-for="${id}"></span>
    </label>
  `;
}

export interface AmountFieldOptions {
  prefix?: string;
  onInput?: () => void;
}

export function initAmountField(input: HTMLInputElement, options: AmountFieldOptions = {}): void {
  const displayValue = (amount: number): string => {
    if (!amount) {
      return '';
    }
    const formatted = formatRubles(amount);
    return options.prefix ? `${options.prefix}${formatted}` : formatted;
  };

  const digitsBeforeCursor = (): number =>
    input.value.slice(0, input.selectionStart ?? 0).replace(/\D/g, '').length;
 
  const restoreCursor = (count: number): void => {
    const position = Math.min(count, input.value.length);
    input.setSelectionRange(position, position);
  };

  input.addEventListener('focus', () => {
    const count = digitsBeforeCursor();
    const amount = parseAmount(input.value);
    input.value = amount > 0 ? String(amount) : '';
    restoreCursor(count);
  });

  input.addEventListener('input', () => {
    const count = digitsBeforeCursor();
    input.value = input.value.replace(/\D/g, '');
    restoreCursor(count);
    options.onInput?.();
  });

  input.addEventListener('blur', () => {
    input.value = displayValue(parseAmount(input.value));
  });
}
