"use client";

import { Toaster as Sonner } from "sonner";
import { Icon } from "@/components/ui/icon";

/**
 * Fonte da verdade dos toasts. Visual em `globals.css` (`.app-toast*`) —
 * não criar outros <Toaster> nos layouts.
 */
export function AppToaster() {
  return (
    <Sonner
      position="top-center"
      duration={3200}
      gap={10}
      visibleToasts={3}
      offset={{ top: "max(16px, env(safe-area-inset-top))" }}
      mobileOffset={{ top: "max(12px, env(safe-area-inset-top))", left: 12, right: 12 }}
      closeButton
      icons={{
        success: <Icon name="check" size={16} />,
        error: <Icon name="close" size={16} />,
        warning: <Icon name="warning" size={15} />,
        info: <Icon name="info" size={16} />,
        loading: <Icon name="loader" size={16} className="animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "app-toast",
          title: "app-toast__title",
          description: "app-toast__description",
          icon: "app-toast__icon",
          closeButton: "app-toast__close",
        },
      }}
    />
  );
}

/** Compat: o RootLayout antigo importava `Toaster`. */
export const Toaster = AppToaster;
