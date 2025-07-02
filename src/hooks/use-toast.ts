import { useState, useCallback } from 'react';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastState {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

let toastId = 0;

const toastListeners: Array<(toasts: ToastState[]) => void> = [];
let toastQueue: ToastState[] = [];

export function toast(props: ToastProps) {
  const id = (++toastId).toString();
  const toastWithId = { ...props, id };
  
  toastQueue = [...toastQueue, toastWithId];
  toastListeners.forEach(listener => listener(toastQueue));

  // Auto-remove toast after duration
  const duration = props.duration || 5000;
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(toastQueue));
  }, duration);

  return {
    id,
    dismiss: () => {
      toastQueue = toastQueue.filter(t => t.id !== id);
      toastListeners.forEach(listener => listener(toastQueue));
    }
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const subscribe = useCallback((listener: (toasts: ToastState[]) => void) => {
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toast,
    toasts,
    subscribe
  };
}
