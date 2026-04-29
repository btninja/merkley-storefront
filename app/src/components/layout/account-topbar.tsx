"use client";

/**
 * Topbar for authenticated portal pages — sits below the global <Header />
 * and hosts the <CompanySelector />. The selector's "Solicitar otra empresa"
 * action opens the same RequestAccessDialog used by /cuenta/empresas.
 */

import { useState } from "react";
import { Container } from "./container";
import { CompanySelector } from "./company-selector";
import { RequestAccessDialog } from "@/components/account/request-access-dialog";

export function AccountTopBar() {
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="border-b border-border bg-surface">
      <Container>
        <div className="flex h-12 items-center justify-end">
          <CompanySelector onRequestCompany={() => setRequestOpen(true)} />
        </div>
      </Container>
      <RequestAccessDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
