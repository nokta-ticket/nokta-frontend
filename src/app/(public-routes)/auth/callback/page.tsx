import { Suspense } from "react";
import { AuthCallbackContent, AuthCallbackPending } from "./_components/auth-callback-content";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackPending />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
