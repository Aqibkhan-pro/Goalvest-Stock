import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentChange', standalone: true })
export class PercentChangePipe implements PipeTransform {
  transform(value: number | null | undefined, showSign = true): string {
    if (value == null) return '—';
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }
}
