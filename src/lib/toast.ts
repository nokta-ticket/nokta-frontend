export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];

function emit() {
  listeners.forEach((fn) => fn([...items]));
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  fn([...items]);
  return () => listeners.delete(fn);
}

export function dismiss(id: string) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function add(type: ToastType, message: string, duration = 4000) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  items = [...items, { id, type, message, duration }];
  emit();
  return id;
}

export const toast = {
  success: (message: string, opts?: { duration?: number }) =>
    add("success", message, opts?.duration),
  error: (message: string, opts?: { duration?: number }) =>
    add("error", message, opts?.duration),
  info: (message: string, opts?: { duration?: number }) =>
    add("info", message, opts?.duration),
  warning: (message: string, opts?: { duration?: number }) =>
    add("warning", message, opts?.duration),
  /** Alias for warning (react-toastify compat) */
  warn: (message: string, opts?: { duration?: number }) =>
    add("warning", message, opts?.duration),
};
