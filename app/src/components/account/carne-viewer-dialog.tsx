"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: string;
  customerName: string;
};

export function CarneViewerDialog({ open, onOpenChange, customer, customerName }: Props) {
  // Streams via the storefront proxy endpoint. The encoded-customer query
  // param is needed because Customer names can contain spaces and special
  // chars (e.g., "Portal Test Co").
  const fileUrl = `/api/method/merkley_web.api.storefront_session.get_carne_file?customer=${encodeURIComponent(customer)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Carné de exención — {customerName}</DialogTitle>
          <Button variant="outline" size="sm" asChild>
            <a href={fileUrl} download>
              <Download className="mr-1 h-3.5 w-3.5" />
              Descargar
            </a>
          </Button>
        </DialogHeader>
        <div className="h-[70vh] w-full overflow-hidden rounded-lg border bg-muted">
          <iframe
            src={fileUrl}
            className="h-full w-full"
            title={`Carné de ${customerName}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
