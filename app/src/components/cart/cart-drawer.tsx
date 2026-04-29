"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { CartItemRow } from "./cart-item-row";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, itemCount, updateQty, removeItem } = useCart();
  const { isAuthenticated, customer, availableCustomers } = useAuth();
  const router = useRouter();

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);

  // An authenticated user with zero linked Customers can't actually submit
  // a quotation downstream. Block the proceed button here so they don't
  // navigate into /cotizaciones/nueva only to find the submit silently
  // gated.
  const noLinkedCompany = isAuthenticated && availableCustomers.length === 0;

  const handleProceed = () => {
    onOpenChange(false);
    if (isAuthenticated) {
      router.push("/cotizaciones/nueva");
    } else {
      router.push(`/auth/login?next=${encodeURIComponent("/cotizaciones/nueva")}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-[400px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4" />
            Mi Carrito ({itemCount})
          </SheetTitle>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-sm">Tu carrito está vacío</p>
              <p className="text-xs text-muted-foreground mt-1">
                Explora nuestro catálogo y agrega productos.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild onClick={() => onOpenChange(false)}>
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable item list */}
            <div className="flex-1 overflow-y-auto px-4 divide-y">
              {items.map((item) => (
                <CartItemRow
                  key={item.item_code}
                  item={item}
                  onUpdateQty={(qty) => updateQty(item.item_code, qty)}
                  onRemove={() => removeItem(item.item_code)}
                />
              ))}
            </div>

            {/* Sticky footer */}
            <div className="border-t px-5 py-4 space-y-3 bg-background">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-base font-bold tabular-nums">
                  RD${subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                ITBIS y envío se calculan al crear la cotización.
              </p>
              {isAuthenticated && customer?.company_name && !noLinkedCompany && (
                <p className="text-xs text-muted-foreground">
                  Vas a cotizar como{" "}
                  <span className="font-medium text-foreground">
                    {customer.company_name}
                  </span>
                  . ¿Otra empresa?{" "}
                  <Link
                    href="/cuenta/empresas"
                    onClick={() => onOpenChange(false)}
                    className="text-primary hover:underline"
                  >
                    Solicita acceso →
                  </Link>
                </p>
              )}
              {noLinkedCompany && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    Tu cuenta no tiene una empresa vinculada.{" "}
                    <Link
                      href="/cuenta/empresas"
                      onClick={() => onOpenChange(false)}
                      className="font-medium underline"
                    >
                      Solicita acceso
                    </Link>{" "}
                    antes de cotizar.
                  </p>
                </div>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={handleProceed}
                disabled={noLinkedCompany}
              >
                {isAuthenticated ? "Continuar a cotización" : "Iniciar sesión para cotizar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                className="w-full cursor-pointer text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => onOpenChange(false)}
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
