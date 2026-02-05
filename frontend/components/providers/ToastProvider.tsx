'use client';

import { Toaster, toast } from 'sonner';
import { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: { 
            background: '#18181b', 
            color: '#fff',
            border: '1px solid #374151'
          },
          className: 'border border-gray-800',
        }}
        expand={false}
        richColors
        closeButton
      />
    </>
  );
}

// Export toast utilities for consistent usage
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
  loading: (message: string) => toast.loading(message),
};
