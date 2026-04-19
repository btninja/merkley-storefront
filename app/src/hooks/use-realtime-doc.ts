"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useSWRConfig } from "swr";
import { useAuth } from "@/context/auth-context";

/** Backend-defined event name — matches merkley_web.realtime.broadcast_doc_update. */
const DOC_UPDATE_EVENT = "mw_doc_update";

/** The Frappe "site" that authenticate.js uses as its socket namespace.
 *  Hardcoded because the storefront only ever talks to the production ERP;
 *  if/when dev/staging diverges we can source this from the build env. */
const SITE_NAME = "erp.merkleydetails.com";

/** Module-level singleton so all page hooks share one socket. The key is
 *  the api_key so log-out + re-login (new token) spawns a fresh connection. */
let sharedSocket: Socket | null = null;
let sharedSocketKey = "";

function ensureSocket(apiKey: string, apiSecret: string): Socket {
  if (sharedSocket && sharedSocketKey === apiKey) {
    return sharedSocket;
  }
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
  // Connect to the storefront origin — nginx proxies /socket.io/ to the
  // Frappe socket server with Host + Origin rewritten to satisfy
  // authenticate.js's same-host check. We authenticate via Authorization
  // header (api_key:api_secret) so the sid cookie (cross-domain, HttpOnly,
  // unreadable by JS) isn't needed.
  sharedSocket = io(`/${SITE_NAME}`, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    extraHeaders: {
      Authorization: `token ${apiKey}:${apiSecret}`,
      "X-Frappe-Site-Name": SITE_NAME,
    },
    auth: {
      token: `${apiKey}:${apiSecret}`,
    },
  });
  sharedSocketKey = apiKey;
  return sharedSocket;
}

/** Subscribe to push updates for a given doc. When the backend fires
 *  ``mw_doc_update`` for this doctype+name, the SWR cache entry at
 *  `cacheKey` is invalidated so consumers refetch. Returns silently
 *  while the auth context is still loading or the user has no socket
 *  credentials — callers can always call this hook unconditionally and
 *  the polling fallback keeps working.
 *
 *  The backend scopes every event with ``user=<email>`` so a customer
 *  only ever receives events for docs belonging to their own customer.
 */
export function useRealtimeDoc(
  doctype: "Quotation" | "Sales Invoice",
  name: string | null | undefined,
  cacheKey: string | null,
): void {
  const { socketAuth, isAuthenticated } = useAuth();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!isAuthenticated || !socketAuth || !name || !cacheKey) return;
    const socket = ensureSocket(socketAuth.api_key, socketAuth.api_secret);

    const handler = (payload: { doctype?: string; name?: string }) => {
      if (payload?.doctype === doctype && payload?.name === name) {
        void mutate(cacheKey);
      }
    };
    socket.on(DOC_UPDATE_EVENT, handler);
    return () => {
      socket.off(DOC_UPDATE_EVENT, handler);
    };
  }, [doctype, name, cacheKey, isAuthenticated, socketAuth, mutate]);
}
