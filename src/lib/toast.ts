import { toast as sonner, type ExternalToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

type Opts = { duration?: number; description?: string };

function opts(o?: Opts): ExternalToast | undefined {
  if (!o) return undefined;
  return { duration: o.duration, description: o.description };
}

/**
 * API única de toast do app (envelopa o Sonner). Mantém a assinatura antiga
 * (`toast.success(msg, { duration })`) pra todo o código existente continuar
 * funcionando; o visual vem de `<AppToaster />` (components/ui/toaster.tsx).
 */
export const toast = {
  success: (message: string, o?: Opts) => sonner.success(message, opts(o)),
  error: (message: string, o?: Opts) => sonner.error(message, opts(o)),
  info: (message: string, o?: Opts) => sonner.info(message, opts(o)),
  warning: (message: string, o?: Opts) => sonner.warning(message, opts(o)),
  /** Alias for warning (react-toastify compat) */
  warn: (message: string, o?: Opts) => sonner.warning(message, opts(o)),
  loading: (message: string, o?: Opts) => sonner.loading(message, opts(o)),
  promise: sonner.promise,
  dismiss: (id?: string | number) => sonner.dismiss(id),
};
