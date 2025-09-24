import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return `Expired ${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? '' : 's'} ago`;
  } else if (diffInDays === 0) {
    return 'Expires today';
  } else if (diffInDays === 1) {
    return 'Expires tomorrow';
  } else if (diffInDays <= 7) {
    return `Expires in ${diffInDays} days`;
  } else {
    return formatDate(date);
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    produce: 'bg-green-100 text-green-800',
    dairy: 'bg-blue-100 text-blue-800',
    meat: 'bg-red-100 text-red-800',
    grains: 'bg-yellow-100 text-yellow-800',
    spices: 'bg-purple-100 text-purple-800',
    condiments: 'bg-orange-100 text-orange-800',
    snacks: 'bg-pink-100 text-pink-800',
    beverages: 'bg-cyan-100 text-cyan-800',
  };
  
  return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
