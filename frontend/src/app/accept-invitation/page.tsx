"use client";

import { Suspense } from "react";
import AcceptInvitationPageInner from "./accept-invitation-inner";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AcceptInvitationPageInner />
    </Suspense>
  );
}
