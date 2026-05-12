import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyFormat', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'USD', compact = false): string {
    if (value == null) return '—';

    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', PKR: '₨' };
    const sym = symbols[currency] ?? '$';

    if (compact) {
      if (Math.abs(value) >= 1e12) return `${sym}${(value / 1e12).toFixed(2)}T`;
      if (Math.abs(value) >= 1e9)  return `${sym}${(value / 1e9).toFixed(2)}B`;
      if (Math.abs(value) >= 1e6)  return `${sym}${(value / 1e6).toFixed(2)}M`;
      if (Math.abs(value) >= 1e3)  return `${sym}${(value / 1e3).toFixed(2)}K`;
    }

    if (Math.abs(value) < 1 && value !== 0) {
      return `${sym}${value.toFixed(6)}`;
    }

    return `${sym}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
