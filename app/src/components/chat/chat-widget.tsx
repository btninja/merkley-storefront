"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Config ──────────────────────────────────────────────────────────

const ERP_BASE =
  process.env.NEXT_PUBLIC_ERP_URL ||
  process.env.FRAPPE_BASE_URL ||
  "https://erp.merkleydetails.com";

const API_PREFIX = `${ERP_BASE}/api/method/merkley_web.api.chat_widget`;

const POLL_INTERVAL = 3000; // 3 seconds

// ── CSRF Token Cache ────────────────────────────────────────────────

let _chatCsrfToken: string | null = null;

async function getChatCsrfToken(): Promise<string> {
  if (_chatCsrfToken) return _chatCsrfToken;
  try {
    const res = await fetch(
      `${ERP_BASE}/api/method/merkley_web.api.auth.get_csrf_token`,
      { method: "GET", credentials: "include", headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      _chatCsrfToken = data.message?.csrf_token || null;
    }
  } catch (err) {
    console.error("[ChatWidget] Failed to fetch CSRF token:", err);
  }
  return _chatCsrfToken || "";
}

// ── Types ───────────────────────────────────────────────────────────

interface WidgetConfig {
  enabled: boolean;
  greeting: string;
  offline_message: string;
  whatsapp_enabled: boolean;
  whatsapp_url: string;
  business_hours: {
    timezone: string;
    hours: { day: string; start: string; end: string }[];
  };
  auto_reply_delay_ms: number;
}

interface ChatMessage {
  name: string;
  content: string;
  sender: string;
  timestamp: string;
  direction: "inbound" | "outbound";
  channel: string;
}

type Screen = "bubble" | "prechat" | "chat" | "whatsapp";

// ── API helpers ─────────────────────────────────────────────────────

async function chatApi<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  method: "GET" | "POST" = "POST"
): Promise<T> {
  const url = new URL(`${API_PREFIX}.${endpoint}`);

  // Fetch CSRF token for POST requests
  const csrfToken = method === "POST" ? await getChatCsrfToken() : "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(csrfToken ? { "X-Frappe-CSRF-Token": csrfToken } : {}),
  };

  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (method === "GET" && params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  } else if (method === "POST" && params) {
    init.body = JSON.stringify(params);
  }

  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error(`[ChatWidget] API error ${res.status} on ${endpoint}:`, errorText);
    throw new Error(`Chat API error: ${res.status}`);
  }
  const data = await res.json();
  return data.message as T;
}

// ── Umami tracking helper ───────────────────────────────────────────

function trackEvent(event: string, data?: Record<string, unknown>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const umami = (window as any).umami;
    if (umami?.track) umami.track(event, data);
  } catch {
    // silently fail
  }
}

// ── Icons (inline SVG to avoid dependencies) ────────────────────────

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

// ── Main Widget Component ───────────────────────────────────────────

export function ChatWidget() {
  const [screen, setScreen] = useState<Screen>("bubble");
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [starting, setStarting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestamp = useRef<string | null>(null);

  // ── LocalStorage helpers for visitor identity persistence ──
  const saveVisitorInfo = useCallback((n: string, e: string, p: string) => {
    try {
      localStorage.setItem("mw_chat_visitor", JSON.stringify({
        name: n, email: e, phone: p, savedAt: Date.now(),
      }));
    } catch { /* ignore */ }
  }, []);

  const loadVisitorInfo = useCallback(() => {
    try {
      const raw = localStorage.getItem("mw_chat_visitor");
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Expire after 90 days
      if (Date.now() - (data.savedAt || 0) > 90 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem("mw_chat_visitor");
        return null;
      }
      return data as { name: string; email: string; phone: string };
    } catch { return null; }
  }, []);

  // Helper to clear session state (keeps visitor identity in localStorage)
  const resetSession = useCallback(() => {
    setScreen("bubble");
    setSessionId(null);
    setMessages([]);
    lastTimestamp.current = null;
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    try { sessionStorage.removeItem("mw_chat_session"); } catch { /* ignore */ }
  }, []);

  // Restore visitor info from localStorage + session from sessionStorage
  useEffect(() => {
    // Always restore visitor identity (name/email/phone) from localStorage
    const visitor = loadVisitorInfo();
    if (visitor) {
      if (visitor.name) setName(visitor.name);
      if (visitor.email) setEmail(visitor.email);
      if (visitor.phone) setPhone(visitor.phone);
    }

    // Try to restore active session from sessionStorage
    (async () => {
      try {
        const saved = sessionStorage.getItem("mw_chat_session");
        if (!saved) return;
        const data = JSON.parse(saved);
        if (!data.sessionId) return;

        // Verify session is still valid with a test poll
        const testUrl = new URL(`${API_PREFIX}.poll_messages`);
        testUrl.searchParams.set("session_id", data.sessionId);
        const res = await fetch(testUrl.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (res.ok) {
          // Session is valid — restore it
          setSessionId(data.sessionId);
          if (data.name) setName(data.name);
          setScreen("chat");
          const pollData = await res.json();
          const msgs = pollData.message || [];
          if (msgs.length > 0) {
            setMessages(msgs);
            lastTimestamp.current = msgs[msgs.length - 1].timestamp;
          } else {
            setMessages([{
              name: "greeting",
              content: "Bienvenido de vuelta. ¿En qué podemos ayudarte?",
              sender: "Merkley",
              timestamp: new Date().toISOString(),
              direction: "outbound",
              channel: "system",
            }]);
          }
        } else {
          // Session expired — clean up
          sessionStorage.removeItem("mw_chat_session");
        }
      } catch {
        try { sessionStorage.removeItem("mw_chat_session"); } catch { /* ignore */ }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load widget config on mount
  useEffect(() => {
    chatApi<WidgetConfig>("widget_config", undefined, "GET")
      .then(setConfig)
      .catch(() => {});
  }, []);

  // Poll for new messages when in chat screen
  const pollErrorCount = useRef(0);

  const pollMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const msgs = await chatApi<ChatMessage[]>("poll_messages", {
        session_id: sessionId,
        after: lastTimestamp.current,
      }, "GET");

      pollErrorCount.current = 0; // Reset on success

      if (msgs && msgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.name));
          const newMsgs = msgs.filter((m) => !existingIds.has(m.name));
          return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
        });
        lastTimestamp.current = msgs[msgs.length - 1].timestamp;
      }
    } catch {
      pollErrorCount.current += 1;
      console.warn(`[ChatWidget] Poll error #${pollErrorCount.current}`);
      // Stop polling and reset after 3 consecutive errors (session expired)
      if (pollErrorCount.current >= 3) {
        console.warn("[ChatWidget] Too many poll errors — resetting session");
        resetSession();
      }
    }
  }, [sessionId, resetSession]);

  useEffect(() => {
    if (screen === "chat" && sessionId) {
      pollRef.current = setInterval(pollMessages, POLL_INTERVAL);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [screen, sessionId, pollMessages]);

  // ── Handlers ──

  async function handleStartSession() {
    if (!name.trim()) return;
    setStarting(true);
    try {
      const result = await chatApi<{
        session_id: string;
        conversation: string;
        lead: string | null;
      }>("start_session", {
        visitor_name: name.trim(),
        visitor_email: email.trim() || undefined,
        visitor_phone: phone.trim() || undefined,
        page_url: window.location.href,
        utm_source: new URLSearchParams(window.location.search).get("utm_source") || undefined,
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || undefined,
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || undefined,
      });

      setSessionId(result.session_id);
      setScreen("chat");
      trackEvent("chat_widget_start", { has_email: !!email, has_phone: !!phone });

      // Persist visitor identity across sessions (localStorage)
      saveVisitorInfo(name.trim(), email.trim(), phone.trim());

      // Persist active session for page refresh recovery (sessionStorage)
      try {
        sessionStorage.setItem("mw_chat_session", JSON.stringify({
          sessionId: result.session_id,
          name: name.trim(),
        }));
      } catch { /* ignore */ }

      // Add greeting as a system message
      if (config?.greeting) {
        setMessages([
          {
            name: "greeting",
            content: config.greeting,
            sender: "Merkley",
            timestamp: new Date().toISOString(),
            direction: "outbound",
            channel: "system",
          },
        ]);
      }

      // Send initial message if provided
      if (initialMessage.trim()) {
        setTimeout(async () => {
          try {
            const msgResult = await chatApi<{
              message_id: string;
              timestamp: string;
            }>("send_message", {
              session_id: result.session_id,
              content: initialMessage.trim(),
            });
            setMessages((prev) => [
              ...prev,
              {
                name: msgResult.message_id,
                content: initialMessage.trim(),
                sender: name.trim(),
                timestamp: msgResult.timestamp,
                direction: "inbound",
                channel: "Web Chat",
              },
            ]);
            lastTimestamp.current = msgResult.timestamp;
            setInitialMessage("");
          } catch (err) {
            console.error("[ChatWidget] Failed to send initial message:", err);
          }
        }, 500);
      }
    } catch (err) {
      console.error("[ChatWidget] Failed to start session:", err);
    } finally {
      setStarting(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !sessionId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      name: tempId,
      content: text,
      sender: name || "Visitante",
      timestamp: new Date().toISOString(),
      direction: "inbound",
      channel: "Web Chat",
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const result = await chatApi<{
        message_id: string;
        timestamp: string;
      }>("send_message", {
        session_id: sessionId,
        content: text,
      });

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.name === tempId
            ? { ...m, name: result.message_id, timestamp: result.timestamp }
            : m
        )
      );
      lastTimestamp.current = result.timestamp;
    } catch (err) {
      console.error("[ChatWidget] Failed to send message:", err);
      // Mark as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.name === tempId ? { ...m, content: `${text} (error al enviar)` } : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  async function handleEndSession() {
    if (sessionId) {
      try {
        await chatApi("end_session", { session_id: sessionId });
        trackEvent("chat_widget_end", { message_count: messages.length });
      } catch (err) {
        console.error("[ChatWidget] Failed to end session:", err);
      }
    }
    resetSession();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Don't render if config says disabled
  if (config && !config.enabled) return null;

  // ── Render ──

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-3">
      {/* ── Chat bubble ── */}
      {screen === "bubble" && (
        <button
          onClick={() => {
            // If we have a returning visitor with name, skip prechat
            const visitor = loadVisitorInfo();
            if (visitor?.name) {
              setName(visitor.name);
              if (visitor.email) setEmail(visitor.email);
              if (visitor.phone) setPhone(visitor.phone);
              setScreen("prechat");
            } else {
              setScreen("prechat");
            }
          }}
          className={cn(
            "group flex h-14 w-14 items-center justify-center rounded-full",
            "bg-[#c4808c] text-white shadow-lg",
            "transition-all duration-200 hover:scale-105 hover:shadow-xl",
            "focus:outline-none focus:ring-2 focus:ring-[#c4808c]/50 focus:ring-offset-2"
          )}
          aria-label="Abrir chat"
        >
          <ChatBubbleIcon className="h-6 w-6" />
        </button>
      )}

      {/* ── Pre-chat form ── */}
      {screen === "prechat" && (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
          {/* Header */}
          <div className="bg-[#c4808c] px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Merkley Details</h3>
                <p className="text-sm text-white/80 mt-0.5">
                  {config?.greeting || "¿En qué podemos ayudarte?"}
                </p>
              </div>
              <button
                onClick={() => setScreen("bubble")}
                className="rounded-full p-1 hover:bg-white/20 transition-colors"
                aria-label="Cerrar"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-5 space-y-3">
            {/* Returning visitor greeting */}
            {loadVisitorInfo()?.name && (
              <p className="text-xs text-gray-500 text-center -mt-1 mb-1">
                Bienvenid@ de vuelta, <span className="font-medium text-gray-700">{name}</span>
              </p>
            )}
            <div>
              <input
                type="text"
                placeholder="Tu nombre *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#ffa8b7] focus:outline-none focus:ring-1 focus:ring-[#c4808c]/30"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#ffa8b7] focus:outline-none focus:ring-1 focus:ring-[#c4808c]/30"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Teléfono / WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#ffa8b7] focus:outline-none focus:ring-1 focus:ring-[#c4808c]/30"
              />
            </div>
            <div>
              <textarea
                placeholder="¿En qué te podemos ayudar?"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#ffa8b7] focus:outline-none focus:ring-1 focus:ring-[#c4808c]/30 resize-none"
              />
            </div>

            <button
              onClick={handleStartSession}
              disabled={!name.trim() || starting}
              className={cn(
                "w-full rounded-lg py-2.5 text-sm font-medium text-white transition-colors",
                name.trim() && !starting
                  ? "bg-[#c4808c] hover:bg-[#a66d77]"
                  : "bg-gray-300 cursor-not-allowed"
              )}
            >
              {starting ? "Conectando..." : "Iniciar chat"}
            </button>

            {/* WhatsApp option */}
            {config?.whatsapp_enabled && config.whatsapp_url && (
              <>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex-1 border-t" />
                  <span>o escríbenos por</span>
                  <div className="flex-1 border-t" />
                </div>
                <a
                  href={config.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("chat_widget_whatsapp_click")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2.5 text-sm font-medium text-white hover:bg-[#20bd5a] transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Chat window ── */}
      {screen === "chat" && (
        <div className="flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100" style={{ height: "min(500px, calc(100vh - 6rem))" }}>
          {/* Header */}
          <div className="bg-[#c4808c] px-4 py-3 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                M
              </div>
              <div>
                <p className="text-sm font-semibold">Merkley Details</p>
                <p className="text-[11px] text-white/70">En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {config?.whatsapp_enabled && config.whatsapp_url && (
                <a
                  href={config.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("chat_widget_switch_whatsapp")}
                  className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                  title="Continuar por WhatsApp"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => setScreen("bubble")}
                className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                title="Minimizar"
              >
                <MinimizeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleEndSession}
                className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                title="Cerrar chat"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.name}
                className={cn(
                  "flex",
                  msg.direction === "inbound" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    msg.direction === "inbound"
                      ? "bg-[#c4808c] text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      msg.direction === "inbound"
                        ? "text-white/60"
                        : "text-gray-400"
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("es-DO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white px-3 py-2 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#ffa8b7] focus:outline-none focus:ring-1 focus:ring-[#c4808c]/30 max-h-24"
                style={{ minHeight: "36px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  input.trim() && !sending
                    ? "bg-[#c4808c] text-white hover:bg-[#a66d77]"
                    : "bg-gray-100 text-gray-400"
                )}
                aria-label="Enviar"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
