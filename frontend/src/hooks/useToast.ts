'use client';

import { toast as sonnerToast } from 'react-hot-toast';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const message = description ? `${title}: ${description}` : title;
    
    switch (variant) {
      case 'destructive':
        sonnerToast.error(message);
        break;
      case 'success':
        sonnerToast.success(message);
        break;
      default:
        sonnerToast(message);
    }
  };

  return { toast };
}

export default useToast;
