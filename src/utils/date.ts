import { addDays, isWeekend } from 'date-fns';

export function calculateBusinessDays(totalHours: number, availableHoursPerDay: number): number {
  const totalDays = Math.ceil(totalHours / availableHoursPerDay);
  let businessDays = 0;
  let currentDate = new Date();

  while (businessDays < totalDays) {
    if (!isWeekend(currentDate)) {
      businessDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return businessDays;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
} 