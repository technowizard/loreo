import { clsx, type ClassValue } from 'clsx';
import { toast as sonnerToast } from 'sonner';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getUrlName(url: string) {
  const urlObject = new URL(url);
  return urlObject.hostname.replace('www.', '');
}

const safeDataImagePattern = /^data:image\/(?:avif|gif|jpeg|png|webp);base64,/i;

export function sanitizeUrl(url: string, options: { allowDataImage?: boolean } = {}): string {
  try {
    if (url.startsWith('data:')) {
      return options.allowDataImage && safeDataImagePattern.test(url) ? url : '';
    }

    const parsedUrl = new URL(url, window.location.origin);

    if (!['http:', 'https:'].includes(parsedUrl.protocol) && !url.startsWith('/')) {
      return '';
    }

    return parsedUrl.toString();
  } catch {
    return '';
  }
}

export const formatReadingTime = (readingTime: number): string => {
  if (readingTime < 1) {
    return '<1 min';
  }

  if (readingTime === 1) {
    return '1 min';
  }

  return `${readingTime} mins`;
};

export const formatFileSize = (bytes: number | null): string => {
  if (bytes === null || bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const kibibyte = 1024;
  const magnitude = Math.floor(Math.log(bytes) / Math.log(kibibyte));

  if (magnitude >= units.length) {
    return `${(bytes / Math.pow(kibibyte, units.length - 1)).toFixed(1)} ${units.at(-1)}`;
  }

  const value = bytes / Math.pow(kibibyte, magnitude);

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[magnitude]}`;
};

export const greetUser = (name: string) => {
  const now = new Date();
  const hour = now.getHours();

  let greeting = '';

  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 18) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  return `${greeting}, ${name}`;
};

export const openOriginalLink = (url: string) => {
  window.open(url, '_blank');
};

export const toast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  sonnerToast[type](message, {
    position: 'top-right',
    richColors: true
  });
};
