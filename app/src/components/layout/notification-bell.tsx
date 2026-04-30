"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { Bell, BellRing } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { getCustomerNotifications, markNotificationRead } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useActiveCustomerFilter } from "@/lib/active-customer-filter";
import type { NotificationItem } from "@/types/notifications";

function relativeTime(iso: string): string {
  // Frappe returns "YYYY-MM-DD HH:MM:SS" (space). Safari/iOS need "T" to parse reliably.
  const safe = iso.replace(" ", "T");
  const seconds = Math.floor((Date.now() - new Date(safe).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return `hace ${Math.floor(seconds / 86400)} d`;
}

export function NotificationBell() {
  const router = useRouter();
  const auth = useAuth();
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const { customer: activeCustomer } = useActiveCustomerFilter();

  // activeCustomer is undefined when CompanySelector is "Todas" — leave it
  // unset and let the backend return notifications across ALL the user's
  // accessible Customers. Only filter when the user has explicitly picked
  // one.
  const cacheKey = auth.isAuthenticated
    ? ["customer-notifications", activeCustomer ?? "__all__"]
    : null;

  const { data } = useSWR(
    cacheKey,
    () => getCustomerNotifications(activeCustomer ? { customer: activeCustomer } : {}),
    { refreshInterval: 60_000, dedupingInterval: 30_000 },
  );

  if (auth.isLoading) return null;
  if (!auth.isAuthenticated) return null;

  const unread = data?.unread_count ?? 0;
  const items: NotificationItem[] = data?.items ?? [];

  const doMarkRead = async (args: { name?: string; mark_all?: boolean }) => {
    try {
      await markNotificationRead({
        ...args,
        ...(activeCustomer ? { customer: activeCustomer } : {}),
      });
      mutate(cacheKey);
    } catch {
      toast({ title: "Error", description: "No se pudo marcar como leída", variant: "destructive" });
    }
  };

  const onItemClick = (item: NotificationItem) => {
    setOpen(false);
    if (!item.is_read) void doMarkRead({ name: item.name });
    if (item.link_url) router.push(item.link_url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-hover active:bg-surface-muted transition-colors"
      >
        {unread > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4 text-muted-foreground" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notificaciones</h3>
              {unread > 0 && (
                <button
                  onClick={() => void doMarkRead({ mark_all: true })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin notificaciones</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onItemClick(item)}
                    className="flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-surface-hover"
                  >
                    <p className={`text-sm ${item.is_read ? "text-foreground" : "font-semibold"}`}>{item.title}</p>
                    {item.body && <p className="text-xs text-muted-foreground">{item.body}</p>}
                    <p className="text-[10px] text-muted-foreground">{relativeTime(item.created_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
