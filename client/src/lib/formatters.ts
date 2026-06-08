import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date.slice(0, 10)) : date;
  return format(d, 'dd/MM/yyyy', { locale: es });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
}

export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.split('T')[0] ?? '';
}

export function formatPeso(kg: number | null | undefined): string {
  if (kg == null) return '—';
  return `${kg.toFixed(1)} kg`;
}
