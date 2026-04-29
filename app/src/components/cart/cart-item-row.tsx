"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/context/cart-context";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onUpdateQty, onRemove }: CartItemRowProps) {
  const minQty = item.minimum_order_qty || 1;
  const lineTotal = item.qty * item.rate;
  const canDecrement = item.qty > minQty;

  return (
    <div className="flex items-start gap-3 py-3 px-1">
      {/* Thumbnail */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.item_name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {item.item_name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          RD${item.rate.toLocaleString("es-DO", { minimumFractionDigits: 2 })} c/u
        </p>
      </div>

      {/* Qty stepper + line total + remove */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!canDecrement}
            onClick={() => onUpdateQty(item.qty - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <input
            type="number"
            inputMode="numeric"
            className="w-12 text-center text-sm font-medium tabular-nums border rounded-md h-7 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            value={item.qty}
            min={minQty}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= minQty) onUpdateQty(val);
            }}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (isNaN(val) || val < minQty) onUpdateQty(minQty);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQty(item.qty + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs font-semibold tabular-nums">
          RD${lineTotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer text-muted-foreground/60 hover:text-destructive transition-colors"
          aria-label={`Eliminar ${item.item_name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
