import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_REMOVE_DELAY = 5000;

let count = 0;
const listeners = new Set<(toasts: ToasterToast[]) => void>();
let memoryToasts: ToasterToast[] = [];

const emit = () => {
  listeners.forEach((listener) => listener(memoryToasts));
};

const dismissToast = (id?: string) => {
  if (id) {
    memoryToasts = memoryToasts.filter((toast) => toast.id !== id);
  } else {
    memoryToasts = [];
  }
  emit();
};

const addToast = ({ ...props }: Omit<ToasterToast, "id">) => {
  const id = `${++count}`;
  const toast: ToasterToast = { id, open: true, ...props };

  memoryToasts = [toast, ...memoryToasts].slice(0, 5);
  emit();

  window.setTimeout(() => dismissToast(id), TOAST_REMOVE_DELAY);

  return {
    id,
    dismiss: () => dismissToast(id),
    update: (next: Partial<ToasterToast>) => {
      memoryToasts = memoryToasts.map((item) => (item.id === id ? { ...item, ...next } : item));
      emit();
    },
  };
};

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(memoryToasts);

  React.useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return {
    toasts,
    toast: addToast,
    dismiss: dismissToast,
  };
}

export const toast = addToast;
