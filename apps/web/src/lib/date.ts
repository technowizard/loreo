import dayjs from 'dayjs';

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format);
}

export function parseDate(dateString: string, format: string = 'YYYY-MM-DD HH:mm:ss'): Date {
  return dayjs(dateString, format).toDate();
}

export function isValidDate(date: Date | string): boolean {
  return dayjs(date).isValid();
}

export function addDays(date: Date | string, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

export function subtractDays(date: Date | string, days: number): Date {
  return dayjs(date).subtract(days, 'day').toDate();
}

export function differenceInDays(date1: Date | string, date2: Date | string): number {
  return dayjs(date1).diff(dayjs(date2), 'day');
}

export function startOfDay(date: Date | string): Date {
  return dayjs(date).startOf('day').toDate();
}

export function endOfDay(date: Date | string): Date {
  return dayjs(date).endOf('day').toDate();
}

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays <= 7) {
    return `${diffDays} days ago`;
  }

  if (diffDays <= 30) {
    return `${Math.ceil(diffDays / 7)} weeks ago`;
  }

  if (diffDays <= 365) {
    return `${Math.ceil(diffDays / 30)} months ago`;
  }

  return `${Math.ceil(diffDays / 365)} years ago`;
};
