"use client";

import { Suspense } from "react";
import { CheckoutClient } from "./_components/checkout-client";
import { CheckoutSkeleton } from "./_components/checkout-skeleton";

/** `useSearchParams` exige o limite de Suspense; o conteúdo vive em `_components/checkout-client.tsx`. */
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutClient />
    </Suspense>
  );
}
