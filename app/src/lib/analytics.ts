/**
 * Merkley Analytics — Lightweight hybrid tracking layer.
 *
 * - Umami:       Loaded on every page via <script> in layout.tsx.
 *                Events sent via window.umami.track().
 * - Meta Pixel:  Lazy-loaded ONLY when a conversion event fires.
 * - Google Ads:  Lazy-loaded ONLY when a conversion event fires.
 *
 * Total cost on regular pages: 0 KB extra (Umami script is ~2KB, loaded in layout).
 * Conversion pages: +~35KB one-time when pixel/gtag load.
 */

// ── Types ──

interface AnalyticsConfig {
  umami_website_id: string;
  umami_script_url: string;
  meta_pixel_id: string;
  google_ads_id: string;
  google_ads_registration_label: string;
  google_ads_quote_label: string;
  tiktok_pixel_id: string;
}

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

// ── State ──

let _config: AnalyticsConfig | null = null;
let _metaPixelLoaded = false;
let _gtagLoaded = false;
let _tiktokPixelLoaded = false;

// ── Config ──

export function initAnalytics(config: AnalyticsConfig) {
  _config = config;
}

// ── Umami ──

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: EventData) => void;
    };
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ttq?: any;
  }
}

function trackUmami(event: string, data?: EventData) {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(event, data);
  }
}

// ── Meta Pixel (lazy) ──

function ensureMetaPixel(): Promise<void> {
  if (!_config?.meta_pixel_id) return Promise.resolve();
  if (_metaPixelLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    _metaPixelLoaded = true;
    const pixelId = _config!.meta_pixel_id;

    // Inline Meta Pixel base code
    const f = window;
    const b = document;
    if (f.fbq) { resolve(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n: any = (f.fbq = function (...args: unknown[]) {
      if (n.callMethod) { n.callMethod(...args); } else { n.queue.push(args); }
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = b.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    s.onload = () => resolve();
    s.onerror = () => resolve();
    const t = b.getElementsByTagName("script")[0];
    t.parentNode?.insertBefore(s, t);

    window.fbq!("init", pixelId);
    window.fbq!("track", "PageView");
  });
}

function trackMeta(event: string, params?: Record<string, unknown>) {
  ensureMetaPixel().then(() => {
    if (window.fbq) {
      if (event === "track" || event === "trackCustom") return;
      window.fbq("track", event, params);
    }
  }).catch(() => {});
}

// ── Google Ads gtag (lazy) ──

function ensureGtag(): Promise<void> {
  if (!_config?.google_ads_id) return Promise.resolve();
  if (_gtagLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    _gtagLoaded = true;
    const adsId = _config!.google_ads_id;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", adsId);

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

function trackGoogleConversion(label: string, value?: number, currency?: string) {
  ensureGtag().then(() => {
    if (window.gtag && _config?.google_ads_id) {
      window.gtag("event", "conversion", {
        send_to: `${_config.google_ads_id}/${label}`,
        value: value || 0,
        currency: currency || "DOP",
      });
    }
  }).catch(() => {});
}

// ── TikTok Pixel (lazy) ──

function ensureTikTokPixel(): Promise<void> {
  if (!_config?.tiktok_pixel_id) return Promise.resolve();
  if (_tiktokPixelLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    _tiktokPixelLoaded = true;
    const pixelId = _config!.tiktok_pixel_id;

    const w = window;
    if (w.ttq) { resolve(); return; }

    // TikTok Pixel base code (minified official snippet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ttq: any = (w.ttq = function (...args: unknown[]) {
      ttq._i?.forEach((id: unknown) => {
        const instance = (ttq as Record<string, unknown>)[id as string];
        if (instance && typeof (instance as { _q?: unknown })._q !== "undefined") {
          (instance as { _q: unknown[] })._q.push(args);
        }
      });
    });
    ttq._i = [];
    ttq._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._t = {};
    ttq._o = {};
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off",
      "once", "ready", "alias", "group", "enableCookie", "disableCookie",
      "holdConsent", "revokeConsent", "grantConsent",
    ];
    ttq.setAndDefer = function (t: unknown, e: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t as any)[e] = function (...args: unknown[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t as any)._q.push([e, ...args]);
      };
    };
    for (const method of ttq.methods) {
      ttq.setAndDefer(ttq, method);
    }
    ttq.instance = function (id: string) {
      const instance = ttq._t[id] || {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (instance as any)._q = [];
      for (const method of ttq.methods) {
        ttq.setAndDefer(instance, method);
      }
      ttq._t[id] = instance;
      ttq._i.push(id);
      return instance;
    };
    ttq.instance(pixelId);

    const s = document.createElement("script");
    s.async = true;
    s.src = ttq._u;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    const t = document.getElementsByTagName("script")[0];
    t.parentNode?.insertBefore(s, t);

    w.ttq!.page();
  });
}

function trackTikTok(event: string, params?: Record<string, unknown>) {
  ensureTikTokPixel().then(() => {
    if (window.ttq) {
      window.ttq.track(event, params);
    }
  }).catch(() => {});
}

/** Send enhanced conversion data (hashed user info) for better attribution. */
function sendEnhancedConversionData(data: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (typeof window === "undefined" || !window.gtag) return;
  // gtag handles hashing automatically when using 'set' with user_data
  window.gtag("set", "user_data", {
    email: data.email,
    phone_number: data.phone,
    address: {
      first_name: data.firstName,
      last_name: data.lastName,
    },
  });
}

// ── Public API — Event Functions ──

/** Track a product list view (catalog page). */
export function trackViewItemList(category?: string, itemCount?: number) {
  trackUmami("view_item_list", { category: category || "all", item_count: itemCount || 0 });
}

/** Track a single product view. */
export function trackViewItem(itemCode: string, itemName: string, price?: number, category?: string | null) {
  trackUmami("view_item", {
    item_code: itemCode,
    item_name: itemName,
    price: price || 0,
    category: category || "",
  });
}

/** Track adding an item to the quote/cart. */
export function trackAddToCart(itemCode: string, itemName: string, qty: number, price: number) {
  trackUmami("add_to_cart", {
    item_code: itemCode,
    item_name: itemName,
    qty,
    value: qty * price,
  });
  // Also fire Meta (lazy-loads pixel on first cart add)
  trackMeta("AddToCart", {
    content_ids: [itemCode],
    content_name: itemName,
    content_type: "product",
    value: qty * price,
    currency: "DOP",
  });
  // TikTok
  trackTikTok("AddToCart", {
    content_id: itemCode,
    content_name: itemName,
    content_type: "product",
    value: qty * price,
    currency: "DOP",
    quantity: qty,
  });
}

/** Track registration start (form opened). */
export function trackBeginRegistration() {
  trackUmami("begin_registration");
}

/** Track successful registration. */
export function trackRegistration(email: string, referralSource?: string, userData?: { phone?: string; firstName?: string; lastName?: string }) {
  trackUmami("sign_up", { referral_source: referralSource || "" });

  // Fire Meta conversion
  trackMeta("CompleteRegistration", {
    content_name: "B2B Registration",
    status: true,
  });
  // TikTok
  trackTikTok("CompleteRegistration", {
    content_name: "B2B Registration",
  });

  // Send enhanced conversion data for better Google Ads attribution
  sendEnhancedConversionData({
    email,
    phone: userData?.phone,
    firstName: userData?.firstName,
    lastName: userData?.lastName,
  });

  // Fire Google Ads conversion (with or without label)
  if (_config?.google_ads_registration_label) {
    trackGoogleConversion(_config.google_ads_registration_label);
  } else if (_config?.google_ads_id) {
    // No label = page-load based conversion, fire a generic conversion event
    ensureGtag().then(() => {
      if (window.gtag) {
        window.gtag("event", "conversion", {
          send_to: _config!.google_ads_id,
        });
      }
    }).catch(() => {});
  }
}

/** Track login. */
export function trackLogin() {
  trackUmami("login");
}

/** Track draft quotation creation. */
export function trackBeginCheckout(itemCount: number, value: number) {
  trackUmami("begin_checkout", { item_count: itemCount, value });
  trackMeta("InitiateCheckout", {
    num_items: itemCount,
    value,
    currency: "DOP",
  });
  // TikTok
  trackTikTok("InitiateCheckout", {
    value,
    currency: "DOP",
    quantity: itemCount,
  });
}

/** Track quotation submitted for approval — primary conversion event. */
export function trackQuoteSubmitted(quoteName: string, value: number, itemCount: number, userData?: { email?: string; phone?: string; firstName?: string; lastName?: string }) {
  trackUmami("quote_submitted", {
    quote_name: quoteName,
    value,
    item_count: itemCount,
  });

  // Meta: Purchase event (our primary conversion for ad optimization)
  trackMeta("Purchase", {
    content_type: "product",
    value,
    currency: "DOP",
    num_items: itemCount,
    content_name: quoteName,
  });
  // TikTok: CompletePayment (their equivalent of Purchase)
  trackTikTok("CompletePayment", {
    content_type: "product",
    value,
    currency: "DOP",
    quantity: itemCount,
    content_id: quoteName,
  });

  // Send enhanced conversion data for better attribution
  if (userData) {
    sendEnhancedConversionData(userData);
  }

  // Google Ads conversion
  if (_config?.google_ads_quote_label) {
    trackGoogleConversion(_config.google_ads_quote_label, value, "DOP");
  }
}

/** Track product search. */
export function trackSearch(query: string, resultCount: number) {
  trackUmami("search", { query, result_count: resultCount });
}

/** Track CTA button clicks (for homepage optimization). */
export function trackCtaClick(ctaName: string, location: string) {
  trackUmami("cta_click", { cta: ctaName, location });
}

/** Track WhatsApp contact click — also fires Google Ads micro-conversion. */
export function trackWhatsAppClick(context: string) {
  trackUmami("whatsapp_click", { context });
  trackMeta("Contact", { content_name: context });
  trackTikTok("Contact", { content_name: context });

  // Fire Google Ads conversion for WhatsApp clicks (micro-conversion for bidding signals)
  ensureGtag().then(() => {
    if (window.gtag && _config?.google_ads_id) {
      window.gtag("event", "conversion", {
        send_to: _config.google_ads_id,
        value: 0,
        currency: "DOP",
      });
    }
  }).catch(() => {});
}

/** Track a generic custom event (for components that don't import specific functions). */
export function trackEvent(event: string, data?: EventData) {
  trackUmami(event, data);
}

/** Track contact method click (phone, email, whatsapp on contact page). */
export function trackContactClick(method: string) {
  trackUmami("contact_click", { method });
  if (method === "whatsapp") {
    trackMeta("Contact", { content_name: "contact_page" });
  }
}

/** Track catalog filter usage. */
export function trackFilterUsed(filterType: string, value: string) {
  trackUmami("filter_used", { filter_type: filterType, value });
}

/** Track every SPA route change as a `page_view` event.
 *
 *  The automatic Umami `data-auto-track` only fires once per full page
 *  load; SPA navigations (App Router push/replace) need to be reported
 *  manually so Umami's dashboard reflects actual traffic.
 */
export function trackPageView(path: string, title?: string) {
  trackUmami("page_view", { path, title: title || "" });
}

/** Product impression-to-click transition on catalog cards. Without
 *  this event, "clicks per impression" on the catalog is invisible. */
export function trackProductClick(itemCode: string, itemName: string, position?: number, listContext?: string) {
  trackUmami("product_click", {
    item_code: itemCode,
    item_name: itemName,
    position: position ?? 0,
    list: listContext || "catalog",
  });
}

/** B2B access-request submit — a high-value conversion on the
 *  unified multi-company portal. Counts against CAC for B2B channels. */
export function trackAccessRequestSubmitted(companyName: string, duplicate: boolean) {
  trackUmami("access_request_submitted", {
    company_name: companyName,
    duplicate,
  });
  // Treat as a CompleteRegistration-equivalent conversion on Meta —
  // signals the B2B funnel advancement.
  if (!duplicate) {
    trackMeta("CompleteRegistration", {
      content_name: "b2b_access_request",
      status: "pending_approval",
    });
  }
}

/** Invoice payment proof upload — closes the B2C payment loop.
 *  Marks the moment a client self-reports payment, which is the
 *  closest storefront-observable signal to "paid". */
export function trackPaymentProofUploaded(invoiceName: string, amount: number) {
  trackUmami("payment_proof_uploaded", {
    invoice: invoiceName,
    value: amount,
  });
}
