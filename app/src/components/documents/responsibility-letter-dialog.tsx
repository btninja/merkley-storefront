"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown } from "lucide-react";
import { downloadCartaResponsabilidadFilled } from "@/lib/api";

interface ResponsibilityLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationName: string;
}

export function ResponsibilityLetterDialog({
  open,
  onOpenChange,
  quotationName,
}: ResponsibilityLetterDialogProps) {
  const { toast } = useToast();
  const [repNombre, setRepNombre] = useState("");
  const [repCedula, setRepCedula] = useState("");
  const [repCargo, setRepCargo] = useState("");
  const [firmaFecha, setFirmaFecha] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [firmaCiudad, setFirmaCiudad] = useState("Santo Domingo");
  const [submitting, setSubmitting] = useState(false);

  const allFilled =
    repNombre.trim() &&
    repCedula.trim() &&
    repCargo.trim() &&
    firmaFecha.trim() &&
    firmaCiudad.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled || submitting) return;
    setSubmitting(true);
    try {
      // Convert YYYY-MM-DD to DD/MM/YYYY format
      const [y, m, d] = firmaFecha.split("-");
      const firmaFechaFormatted = `${d}/${m}/${y}`;

      const blob = await downloadCartaResponsabilidadFilled(quotationName, {
        rep_nombre: repNombre.trim(),
        rep_cedula: repCedula.trim(),
        rep_cargo: repCargo.trim(),
        firma_fecha: firmaFechaFormatted,
        firma_ciudad: firmaCiudad.trim(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carta-responsabilidad-${quotationName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast({
        title: "Carta generada",
        description: "Imprime, firma, sella y sube el documento.",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo generar la carta.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Completa los datos para la carta</DialogTitle>
          <DialogDescription>
            La carta se generará con esta información lista para firmar y sellar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rep_nombre">Nombre del representante</Label>
            <Input
              id="rep_nombre"
              value={repNombre}
              onChange={(e) => setRepNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep_cedula">Cédula / Pasaporte</Label>
            <Input
              id="rep_cedula"
              value={repCedula}
              onChange={(e) => setRepCedula(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rep_cargo">Cargo</Label>
            <Input
              id="rep_cargo"
              value={repCargo}
              onChange={(e) => setRepCargo(e.target.value)}
              placeholder="Gerente General, Contador..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firma_fecha">Fecha</Label>
              <Input
                id="firma_fecha"
                type="date"
                value={firmaFecha}
                onChange={(e) => setFirmaFecha(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firma_ciudad">Ciudad</Label>
              <Input
                id="firma_ciudad"
                value={firmaCiudad}
                onChange={(e) => setFirmaCiudad(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!allFilled || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="mr-1.5 h-4 w-4" />
                  Generar y descargar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
