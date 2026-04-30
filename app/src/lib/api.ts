import type {
  BlogCategoriesResponse,
  BlogDetailResponse,
  BlogListResponse,
  BootstrapResponse,
  ClientPortfolioResponse,
  CreateQuotationInput,
  FeaturedClientsResponse,
  InvoiceDetailResponse,
  InvoiceListResponse,
  LinkPageResponse,
  ProductDetailResponse,
  ProductListResponse,
  QuotationDetailResponse,
  QuotationListResponse,
  RecentBlogPostsResponse,
  RegisterResponse,
  RegistrationData,
  SeasonProductsResponse,
  SeasonsResponse,
  SessionResponse,
  ShippingCalculation,
  ShippingZonesResponse,
} from "./types";
import type { NotificationListResponse } from "@/types/notifications";

import { ERP_BASE_URL as ERP_BASE } from "./env";
// Re-exported for callers that still import ERP_BASE from this module.
export { ERP_BASE };

// ── CSRF Token Management ──

let _csrfToken: string | null = null;

/** Store a CSRF token obtained from a session response. */
export function setCsrfToken(token: string | null | undefined) {
  _csrfToken = token || null;
}

/** Fetch a fresh CSRF token from the server (requires authenticated session). */
async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(
    `${ERP_BASE}/api/method/merkley_web.api.auth.get_csrf_token`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new ApiError("Failed to fetch CSRF token", response.status);
  }

  const data = await response.json();
  const token = data.message?.csrf_token;
  if (!token) {
    throw new ApiError("No CSRF token in response", 500);
  }
  _csrfToken = token;
  return token;
}

/** Get the current CSRF token, fetching one if not available. */
async function getCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  return fetchCsrfToken();
}

/** Clear the cached CSRF token (call on logout). */
function clearCsrfToken() {
  _csrfToken = null;
}

// ── Session Expiry ──

let _redirectingForSessionExpiry = false;

/**
 * Called when an authenticated client-side request returns 401 — the user's
 * session expired mid-flow. We surface a single toast (deduped via the
 * module-scoped flag), preserve their current location so post-login
 * routing returns them here, and route them to /auth/login. Form drafts
 * stashed in sessionStorage by individual flows (quote-builder, retention,
 * approval method) are unaffected.
 *
 * If the cookie says we were never authenticated, this is just an unauth
 * RPC — skip the redirect so probes like getSessionContext on a logged-out
 * user don't bounce around.
 */
function handleSessionExpiry() {
  if (typeof window === "undefined") return;
  if (_redirectingForSessionExpiry) return;
  // Only redirect if the user thought they were logged in. AuthProvider
  // sets `mw_session=1` on successful login.
  if (!document.cookie.includes("mw_session=1")) return;
  _redirectingForSessionExpiry = true;
  try {
    const here = window.location.pathname + window.location.search;
    sessionStorage.setItem("md_post_login_redirect", here);
  } catch { /* sessionStorage blocked */ }
  // Best-effort: avoid bouncing if we're already on an auth page.
  if (!window.location.pathname.startsWith("/auth/")) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/login?next=${next}&expired=1`;
  } else {
    _redirectingForSessionExpiry = false;
  }
}

// ── Error Class ──

class ApiError extends Error {
  status: number;
  serverMessage?: string;

  constructor(message: string, status: number, serverMessage?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

/**
 * Strip HTML tags and decode the small set of entities Frappe emits
 * in _server_messages. Keeps backend errors readable in toasts.
 */
function stripHtml(value: string): string {
  return value
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ── XHR Upload Helper (progress-aware) ──

/** Callback fired during upload with 0-100 percent. */
export type UploadProgressCallback = (percent: number) => void;

interface XhrUploadOptions {
  url: string;
  formData: FormData;
  headers?: Record<string, string>;
  onProgress?: UploadProgressCallback;
}

/**
 * fetch() doesn't expose upload progress, so the upload helpers route
 * through XMLHttpRequest. Behavior mirrors the existing fetch path:
 * credentials are sent, custom headers (incl. CSRF) attach, the JSON
 * response body is parsed, and errors surface via Frappe's
 * _server_messages envelope when present.
 */
function xhrUpload<T>(opts: XhrUploadOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", opts.url, true);
    xhr.withCredentials = true;
    if (opts.headers) {
      for (const [k, v] of Object.entries(opts.headers)) xhr.setRequestHeader(k, v);
    }
    if (opts.onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          opts.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new ApiError("Respuesta inválida del servidor", xhr.status));
        }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?._server_messages) {
            const msgs = JSON.parse(body._server_messages);
            if (msgs?.[0]) {
              const parsed = JSON.parse(msgs[0]);
              if (parsed?.message) msg = stripHtml(parsed.message);
            }
          } else if (body?.exception || body?.message) {
            msg = body.exception || body.message;
          }
        } catch { /* keep generic */ }
        reject(new ApiError(msg, xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError("Error de red", 0));
    xhr.onabort = () => reject(new ApiError("Cancelado", 0));
    xhr.send(opts.formData);
  });
}

// ── Core API Call ──

/**
 * Shared fetch pipeline for all Frappe RPC calls. Expects an already-prefixed
 * method path (e.g. "merkley_web.api.auth.login" or
 * "merkley_web.state_machine.api.get_state_metadata"). Handles CSRF token
 * injection, a one-shot 403 retry with a refreshed token, request timeout,
 * and extraction of human-readable messages from Frappe's _server_messages
 * envelope.
 */
async function rawFrappeCall<T>(
  fullPath: string,
  params?: Record<string, unknown>,
  options?: { method?: "GET" | "POST"; revalidate?: number | false; timeoutMs?: number; signal?: AbortSignal }
): Promise<T> {
  const httpMethod = options?.method || "POST";
  // Default 15s for typical RPCs; PDF generation and DGII verification
  // call sites override to 60s via options.timeoutMs. Pass 0 to disable.
  const timeoutMs = options?.timeoutMs ?? 15000;
  let url = `${ERP_BASE}/api/method/${fullPath}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // Include CSRF token on all unsafe (POST) requests
  if (httpMethod === "POST") {
    try {
      const token = await getCsrfToken();
      headers["X-Frappe-CSRF-Token"] = token;
    } catch {
      // If we can't get a token (e.g. not logged in), proceed without it.
      // The server will reject if the token is actually required.
    }
  }

  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  // If the caller passes an external signal (e.g. to cancel a stale
  // DGII verify when a newer one starts), forward its abort into our
  // internal controller so fetch() observes a single signal.
  if (options?.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const fetchOptions: RequestInit & { next?: { revalidate?: number | false } } = {
    method: httpMethod,
    credentials: "include",
    headers,
    signal: controller.signal,
    ...(options?.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : {}),
  };

  if (httpMethod === "GET" && params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null) searchParams.set(key, String(value));
    }
    url += `?${searchParams.toString()}`;
  } else if (httpMethod === "POST" && params) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(params);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("La solicitud tardo demasiado. Intenta de nuevo.", 408);
    }
    throw err;
  }
  if (timeoutId) clearTimeout(timeoutId);

  // If we get a 403, the CSRF token may be stale — refresh and retry once
  if (response.status === 403 && httpMethod === "POST") {
    try {
      clearCsrfToken();
      const freshToken = await fetchCsrfToken();
      headers["X-Frappe-CSRF-Token"] = freshToken;
      fetchOptions.headers = headers;
      response = await fetch(url, fetchOptions);
    } catch {
      // If refresh also fails, fall through to error handling below
    }
  }

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      const errorData = await response.json();
      const raw =
        (errorData?.exc_type === "ValidationError" || errorData?.exc_type === "DuplicateEntryError")
          ? errorData?._server_messages
            ? JSON.parse(errorData._server_messages)?.[0]
              ? JSON.parse(JSON.parse(errorData._server_messages)[0])?.message
              : undefined
            : undefined
          : errorData?.message;
      if (typeof raw === "string" && raw.length > 0) {
        serverMessage = stripHtml(raw);
      }
    } catch {
      // ignore
    }
    // Mid-flow session expiry: if the user thought they were logged in
    // (mw_session cookie set by AuthProvider), preserve their location
    // and bounce them through /auth/login so post-login they land back
    // where they were. SessionStorage drafts already in place from
    // earlier audit fixes survive the round-trip.
    if (response.status === 401) {
      handleSessionExpiry();
    }
    throw new ApiError(
      serverMessage || `Request failed: ${response.status}`,
      response.status,
      serverMessage
    );
  }

  const data = await response.json();
  return data.message as T;
}

/**
 * Call a Frappe method under the "merkley_web.api.*" namespace. The method
 * argument should be the portion after that prefix (e.g. "auth.login").
 */
async function frappeCall<T>(
  method: string,
  params?: Record<string, unknown>,
  options?: { method?: "GET" | "POST"; revalidate?: number | false; timeoutMs?: number; signal?: AbortSignal }
): Promise<T> {
  return rawFrappeCall<T>(`merkley_web.api.${method}`, params, options);
}

/**
 * Call a fully-qualified Frappe whitelisted method without any prefix
 * rewriting (e.g. "merkley_web.state_machine.api.get_state_metadata").
 */
async function frappeCallAbsolute<T>(
  method: string,
  params?: Record<string, unknown>,
  options?: { method?: "GET" | "POST"; revalidate?: number | false; timeoutMs?: number; signal?: AbortSignal }
): Promise<T> {
  return rawFrappeCall<T>(method, params, options);
}

// ── Auth ──

export async function login(email: string, password: string): Promise<SessionResponse> {
  const session = await frappeCall<SessionResponse>("auth.authenticate_client", { email, password });
  setCsrfToken(session.csrf_token);
  return session;
}

export async function validateRnc(
  rnc: string,
  options?: { signal?: AbortSignal },
): Promise<import("@/lib/types").DgiiValidationResult> {
  // DGII registry calls are external + occasionally slow; 15s default is
  // too aggressive. 60s matches our other PDF/external-API call sites.
  return frappeCall<import("@/lib/types").DgiiValidationResult>(
    "auth.validate_rnc",
    { rnc },
    { timeoutMs: 60_000, signal: options?.signal },
  );
}

export async function register(data: RegistrationData): Promise<RegisterResponse> {
  const result = await frappeCall<RegisterResponse>("auth.register_client", data as unknown as Record<string, unknown>);
  if ("csrf_token" in result) {
    setCsrfToken(result.csrf_token);
  }
  return result;
}

export async function verifyEmail(code: string, email: string): Promise<SessionResponse | { approval_pending: true }> {
  const result = await frappeCall<SessionResponse | { approval_pending: true }>("auth.verify_email", { code, email });
  if ("csrf_token" in result) {
    setCsrfToken(result.csrf_token);
  }
  return result;
}

export async function resendVerificationEmail(email: string): Promise<{ ok: boolean }> {
  return frappeCall<{ ok: boolean }>("auth.resend_verification_email", { email });
}

export async function logout(): Promise<void> {
  await frappeCall("auth.logout_client");
  clearCsrfToken();
}

export async function getSessionContext(): Promise<SessionResponse> {
  const session = await frappeCall<SessionResponse>("auth.get_session_context", undefined, {
    method: "GET",
  });
  setCsrfToken(session.csrf_token);
  return session;
}

/** Issue / fetch the current website user's Frappe api_key + api_secret so
 *  the storefront can authenticate with the socket.io server via an
 *  Authorization header. Lives on the full merkley_web namespace (not the
 *  default auth namespace), so we use the absolute helper. */
export async function ensureSocketToken(): Promise<{ api_key: string; api_secret: string }> {
  return api.frappeCall<{ api_key: string; api_secret: string }>(
    "merkley_web.realtime.ensure_socket_token",
    undefined,
    { method: "GET" },
  );
}

// ── Multi-company unified portal: list companies, request access,
// multi-create quotations. The portal runs in unified mode (no
// "active" customer) — every listing endpoint spans all customers by
// default and accepts an optional ?customer=NAME filter.

export async function listMyCustomers(): Promise<{
  customers: import("@/lib/types").AvailableCustomer[];
}> {
  return api.frappeCall(
    "merkley_web.api.storefront_session.list_my_customers",
    undefined,
    { method: "GET" },
  );
}

export async function requestCustomerAccess(data: {
  company_name: string;
  rnc?: string;
  message?: string;
  // Attribution forwarded from utm-context — the B2B access-request
  // form is a B2B conversion point and its attribution was previously
  // dropped. Enables revenue-by-channel once these users close deals.
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landing_page?: string;
  utm_history_json?: string;
}): Promise<{ ok: true; name: string; duplicate: boolean }> {
  return api.frappeCall(
    "merkley_web.api.storefront_session.request_customer_access",
    data as unknown as Record<string, unknown>,
  );
}

export async function listMyAccessRequests(): Promise<{
  requests: import("@/lib/types").CustomerAccessRequest[];
}> {
  return api.frappeCall(
    "merkley_web.api.storefront_session.list_my_access_requests",
    undefined,
    { method: "GET" },
  );
}

/** Preview per-customer totals for a multi-company quotation before
 *  actually creating the documents. Lets the UI show "Empresa A:
 *  $1,500 · Empresa B: $1,820" if prices differ between companies. */
export async function quotePreviewMulti(payload: {
  customers: string[];
  items: unknown[];
  [key: string]: unknown;
}): Promise<{
  previews: Array<{
    customer: string;
    customer_name?: string | null;
    price_list?: string;
    grand_total?: number;
    tax_total?: number;
    currency?: string;
    error?: string;
  }>;
}> {
  return frappeCall("quotations.quote_preview_multi", payload as unknown as Record<string, unknown>);
}

/** Atomic multi-company quotation create — produces N Quotations in a
 *  single transaction, each scoped to one of the selected Customers.
 *  A shared `group_id` is stamped on each quotation so sibling links
 *  work on the detail page. */
export async function createQuotationsForCustomers(payload: {
  customers: string[];
  items: unknown[];
  [key: string]: unknown;
}): Promise<{
  group_id: string | null;
  quotations: Array<{
    name: string;
    customer: string;
    customer_name: string | null;
    grand_total: number;
    currency: string;
    stage: string;
  }>;
}> {
  return frappeCall("quotations.create_quotations_for_customers", payload as unknown as Record<string, unknown>);
}

// ── Catalog ──

export async function getBootstrap(): Promise<BootstrapResponse> {
  return frappeCall<BootstrapResponse>("catalog.get_website_bootstrap", undefined, {
    method: "GET",
  });
}

export async function getProducts(params: {
  page?: number;
  page_length?: number;
  category?: string;
  tier?: string;
  search?: string;
  season?: string;
  sort_by?: string;
  availability?: string;
}): Promise<ProductListResponse> {
  return frappeCall<ProductListResponse>("catalog.get_website_products", params, { method: "GET" });
}

export async function getProductDetail(slug: string): Promise<ProductDetailResponse> {
  return frappeCall<ProductDetailResponse>("catalog.get_product_detail", { slug }, { method: "GET", revalidate: 120 });
}

// ── Seasons ──

export async function getSeasons(): Promise<SeasonsResponse> {
  return frappeCall<SeasonsResponse>("seasons.get_seasons", undefined, { method: "GET" });
}

export async function getActiveSeasons(): Promise<SeasonsResponse> {
  return frappeCall<SeasonsResponse>("seasons.get_active_seasons", undefined, { method: "GET" });
}

export async function getSeasonProducts(params: {
  season: string;
  page?: number;
  page_length?: number;
  tier?: string;
  search?: string;
  sort_by?: string;
}): Promise<SeasonProductsResponse> {
  return frappeCall<SeasonProductsResponse>("seasons.get_season_products", params, { method: "GET" });
}

// ── Catalog PDF ──

export async function generateCustomerCatalogPdf(params: {
  season: string;
}): Promise<{ file_name: string; file_url: string; item_count: number }> {
  // Server-side PDF rendering can take longer than the default 15s
  // RPC timeout when the season has many items / images.
  return frappeCall("catalogs.generate_customer_catalog_pdf", params as Record<string, unknown>, { timeoutMs: 60_000 });
}

// ── Quotations ──

export async function getMyQuotations(stage?: string, customer?: string): Promise<QuotationListResponse> {
  const params: Record<string, unknown> = {};
  if (stage) params.stage = stage;
  if (customer) params.customer = customer;
  return frappeCall<QuotationListResponse>(
    "quotations.get_my_quotations",
    Object.keys(params).length > 0 ? params : undefined,
  );
}

export async function getQuotationDetail(name: string): Promise<QuotationDetailResponse> {
  return frappeCall<QuotationDetailResponse>("quotations.get_quotation_detail", { name });
}

export async function createQuotation(input: CreateQuotationInput): Promise<QuotationDetailResponse> {
  return frappeCall<QuotationDetailResponse>("quotations.create_quotation", input as unknown as Record<string, unknown>);
}

export async function updateQuotation(
  name: string,
  input: CreateQuotationInput
): Promise<QuotationDetailResponse> {
  return frappeCall<QuotationDetailResponse>("quotations.update_quotation", {
    name,
    ...input,
  } as unknown as Record<string, unknown>);
}

export async function submitQuotation(
  name: string
): Promise<{ ok: boolean; stage: string }> {
  return frappeCall<{ ok: boolean; stage: string }>("quotations.submit_quotation", {
    name,
  });
}

export async function declineQuotation(
  name: string,
  reason?: string
): Promise<{ ok: boolean; stage: string }> {
  return frappeCall<{ ok: boolean; stage: string }>("quotations.decline_quotation", {
    name,
    reason,
  });
}

export async function acceptQuotationWithoutDocs(
  name: string
): Promise<{ ok: boolean; stage: string; sales_order?: string }> {
  return frappeCall<{ ok: boolean; stage: string; sales_order?: string }>(
    "quotations.accept_quotation_without_docs",
    { name },
  );
}

export async function downloadQuotationPdf(name: string): Promise<void> {
  const url = `${ERP_BASE}/api/method/merkley_web.api.quotations.download_my_quotation_pdf?name=${encodeURIComponent(name)}`;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new ApiError("Failed to download PDF", response.status);
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ── Invoices ──

export async function getMyInvoices(params?: {
  status?: string;
  customer?: string;
  page?: number;
  page_length?: number;
}): Promise<InvoiceListResponse> {
  return frappeCall<InvoiceListResponse>("invoices.get_my_invoices", params as Record<string, unknown>);
}

export async function getInvoiceDetail(name: string): Promise<InvoiceDetailResponse> {
  return frappeCall<InvoiceDetailResponse>("invoices.get_invoice_detail", { name });
}

export async function getBankInfo(): Promise<{
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_account_type: string | null;
  bank_rnc: string | null;
}> {
  return frappeCall("invoices.get_bank_info", undefined, { method: "GET" });
}

export async function submitPaymentProof(
  name: string,
  fileUrl: string
): Promise<{ ok: boolean; stage: string }> {
  return frappeCall("invoices.submit_payment_proof", { name, file_url: fileUrl });
}

export async function uploadInvoiceFile(
  file: File,
  invoiceName: string,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", invoiceName);

  const url = `${ERP_BASE}/api/method/merkley_web.api.invoices.upload_invoice_file`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  try {
    const token = await getCsrfToken();
    headers["X-Frappe-CSRF-Token"] = token;
  } catch {
    // proceed without token
  }

  try {
    const data = await xhrUpload<{ message?: { file_url?: string } }>({
      url, formData, headers, onProgress,
    });
    return data.message?.file_url || "";
  } catch (err) {
    // Retry once on 403 (stale CSRF token), preserving the existing
    // CSRF refresh semantics from the prior fetch-based implementation.
    if (err instanceof ApiError && err.status === 403) {
      try {
        clearCsrfToken();
        headers["X-Frappe-CSRF-Token"] = await fetchCsrfToken();
      } catch {
        throw err;
      }
      const data = await xhrUpload<{ message?: { file_url?: string } }>({
        url, formData, headers, onProgress,
      });
      return data.message?.file_url || "";
    }
    throw err;
  }
}

export async function requestAnnulment(
  name: string,
  reason: string
): Promise<{ ok: boolean; stage: string }> {
  return frappeCall("invoices.request_annulment", { name, reason });
}

export async function downloadInvoicePdf(name: string): Promise<void> {
  const url = `${ERP_BASE}/api/method/merkley_web.api.invoices.download_my_invoice_pdf?name=${encodeURIComponent(name)}`;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new ApiError("Failed to download PDF", response.status);
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ── Retention Letter ──

export async function submitRetentionLetter(
  name: string,
  fileUrl: string,
  retentionAmount?: number,
  retentionPercentage?: number
): Promise<{ invoice: Record<string, unknown> }> {
  return frappeCall("invoices.submit_retention_letter", {
    name,
    file_url: fileUrl,
    retention_amount: retentionAmount,
    retention_percentage: retentionPercentage,
  });
}

// ── Quotation Approval ──

export async function approveQuotation(
  name: string,
  approvalMethod: string,
  approvalDocumentFileUrl: string,
  logoFileUrl?: string,
): Promise<{ ok: boolean; stage: string }> {
  return frappeCall<{ ok: boolean; stage: string }>("quotations.approve_quotation", {
    name,
    approval_method: approvalMethod,
    approval_document_file: approvalDocumentFileUrl,
    logo_file: logoFileUrl,
  });
}

/**
 * Download a pre-filled Carta de Responsabilidad PDF. The storefront dialog
 * collects the field values and POSTs them here; backend renders them into
 * the template and returns a flat (non-fillable) PDF blob.
 *
 * Replaces the legacy fillable-PDF flow (downloadCartaResponsabilidad) where
 * users filled form fields inside their PDF reader.
 */
export async function downloadCartaResponsabilidadFilled(
  name: string,
  fields: {
    rep_nombre: string;
    rep_cedula: string;
    rep_cargo: string;
    firma_fecha: string;
    firma_ciudad: string;
    firma_nombre?: string; // defaults server-side to rep_nombre
    firma_cargo?: string;  // defaults server-side to rep_cargo
  },
): Promise<Blob> {
  const params = new URLSearchParams({ name });
  for (const [k, v] of Object.entries(fields)) {
    if (v) params.set(k, v);
  }
  const url = `${ERP_BASE}/api/method/merkley_web.api.quotations.generate_carta_responsabilidad_filled?${params.toString()}`;
  const headers: Record<string, string> = {};

  try {
    const token = await getCsrfToken();
    headers["X-Frappe-CSRF-Token"] = token;
  } catch {
    // proceed without token
  }

  let response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
  });

  // Retry on 403 (stale CSRF token)
  if (response.status === 403) {
    try {
      clearCsrfToken();
      const freshToken = await fetchCsrfToken();
      headers["X-Frappe-CSRF-Token"] = freshToken;
      response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
      });
    } catch {
      // fall through to error handling
    }
  }

  if (!response.ok) throw new ApiError(`Generando carta: HTTP ${response.status}`, response.status);
  return response.blob();
}

// ── Shipping ──

export async function getShippingZones(): Promise<ShippingZonesResponse> {
  return frappeCall<ShippingZonesResponse>("quotations.get_shipping_zones", undefined, {
    method: "GET",
  });
}

export async function calculateShippingCost(
  items: { item_code: string; qty: number }[],
  zoneName: string
): Promise<ShippingCalculation> {
  return frappeCall<ShippingCalculation>("quotations.calculate_shipping_cost", {
    items,
    zone_name: zoneName,
  });
}

// ── Files ──

/**
 * Upload a file attached to a Quotation using our custom endpoint that
 * verifies ownership and bypasses the Quotation write-permission check.
 */
export async function uploadQuotationFile(
  file: File,
  quotationName: string,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", quotationName);

  const url = `${ERP_BASE}/api/method/merkley_web.api.quotations.upload_quotation_file`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  try {
    const token = await getCsrfToken();
    headers["X-Frappe-CSRF-Token"] = token;
  } catch {
    // proceed without token
  }

  try {
    const data = await xhrUpload<{ message?: { file_url?: string } }>({
      url, formData, headers, onProgress,
    });
    return data.message?.file_url || "";
  } catch (err) {
    // Retry once on 403 (stale CSRF token).
    if (err instanceof ApiError && err.status === 403) {
      try {
        clearCsrfToken();
        headers["X-Frappe-CSRF-Token"] = await fetchCsrfToken();
      } catch {
        throw err;
      }
      const data = await xhrUpload<{ message?: { file_url?: string } }>({
        url, formData, headers, onProgress,
      });
      return data.message?.file_url || "";
    }
    throw err;
  }
}

// ── Clients ──

export async function getFeaturedClients(): Promise<FeaturedClientsResponse> {
  return frappeCall<FeaturedClientsResponse>("clients.get_featured_clients", undefined, {
    method: "GET",
  });
}

export async function getClientPortfolio(): Promise<ClientPortfolioResponse> {
  return frappeCall<ClientPortfolioResponse>("clients.get_client_portfolio", undefined, { method: "GET" });
}

// ── Link Page ──

export async function getLinkPage(): Promise<LinkPageResponse> {
  return frappeCall<LinkPageResponse>("links.get_link_page", undefined, {
    method: "GET",
  });
}

// ── Team Management ──

export async function getTeamMembers(): Promise<import("./types").TeamListResponse> {
  return frappeCall<import("./types").TeamListResponse>("auth.get_team_members");
}

export async function deactivateTeamMember(email: string): Promise<{ ok: boolean }> {
  return frappeCall("auth.deactivate_team_member", { email });
}

export async function activateTeamMember(email: string): Promise<{ ok: boolean }> {
  return frappeCall("auth.activate_team_member", { email });
}

export async function transferAdmin(email: string): Promise<{ ok: boolean }> {
  return frappeCall("auth.transfer_admin", { email });
}

export async function inviteTeamMember(
  email: string,
  contactName: string
): Promise<{ ok: boolean; email: string; contact_name: string }> {
  return frappeCall("auth.invite_team_member", { email, contact_name: contactName });
}

export async function changePassword(
  newPassword: string,
  currentPassword?: string
): Promise<{ ok: boolean }> {
  return frappeCall("auth.change_password", {
    new_password: newPassword,
    current_password: currentPassword,
  });
}

// ── Blog ──

export async function getBlogPosts(params?: {
  page?: number;
  page_length?: number;
  category?: string;
}): Promise<BlogListResponse> {
  return frappeCall<BlogListResponse>("blog.get_blog_posts", params, { method: "GET" });
}

export async function getBlogPost(slug: string): Promise<BlogDetailResponse> {
  return frappeCall<BlogDetailResponse>("blog.get_blog_post", { slug }, { method: "GET" });
}

export async function getBlogCategories(): Promise<BlogCategoriesResponse> {
  return frappeCall<BlogCategoriesResponse>("blog.get_blog_categories", undefined, { method: "GET" });
}

export async function getRecentBlogPosts(limit?: number): Promise<RecentBlogPostsResponse> {
  return frappeCall<RecentBlogPostsResponse>("blog.get_recent_blog_posts", limit ? { limit } : undefined, { method: "GET" });
}

// ── Customer Portal ──

export interface OrderPipelineStep {
  key: string;
  label: string;
  description: string;
}

export interface OrderPipelineOrder {
  name: string;
  doctype: string;
  customer?: string | null;
  customer_name?: string | null;
  date: string;
  status: string;
  current_step: string;
  grand_total: number;
  currency: string;
  items: { item_code: string; item_name: string; qty: number; rate: number; amount: number }[];
  linked_quote: string | null;
  linked_invoice: string | null;
}

export interface OrderPipelineResponse {
  steps: OrderPipelineStep[];
  orders: OrderPipelineOrder[];
}

export async function getOrderPipeline(customer?: string): Promise<OrderPipelineResponse> {
  return frappeCall<OrderPipelineResponse>(
    "portal.get_order_pipeline",
    customer ? { customer } : undefined,
    { method: "GET" },
  );
}

export interface PurchaseHistoryItem {
  name: string;
  doctype: string;
  doc_type?: string;
  customer?: string | null;
  customer_name?: string | null;
  date: string;
  grand_total: number;
  currency: string;
  status: string;
  item_count?: number;
  outstanding_amount?: number;
  ncf?: string | null;
  stage?: string | null;
}

export interface MonthlySpending {
  month: string;
  label: string;
  total: number;
}

export interface TopProduct {
  item_code: string;
  item_name: string;
  total_qty: number;
  total_amount: number;
}

export interface PurchaseHistoryResponse {
  documents: PurchaseHistoryItem[];
  monthly_spending: MonthlySpending[];
  top_products: TopProduct[];
  year: number;
  available_years: number[];
}

export async function getPurchaseHistory(params?: {
  year?: number;
  page?: number;
  customer?: string;
}): Promise<PurchaseHistoryResponse> {
  return frappeCall<PurchaseHistoryResponse>(
    "portal.get_purchase_history",
    params as Record<string, unknown>,
    { method: "GET" }
  );
}

export async function reorderFromDocument(
  doctype: string,
  docname: string
): Promise<{ ok: boolean; quotation_name: string }> {
  return frappeCall("portal.reorder_from_document", { doctype, docname });
}

export interface DownloadDocument {
  name: string;
  doctype: string;
  doc_type?: string;
  customer?: string | null;
  customer_name?: string | null;
  date: string;
  grand_total: number;
  currency: string;
  ncf: string | null;
  pdf_url: string;
  month: string;
  month_label: string;
}

export interface DownloadCenterResponse {
  documents: DownloadDocument[];
  year: number;
  available_years: number[];
}

export async function getDownloadCenter(year?: number, customer?: string): Promise<DownloadCenterResponse> {
  const params: Record<string, unknown> = {};
  if (year) params.year = year;
  if (customer) params.customer = customer;
  return frappeCall<DownloadCenterResponse>(
    "portal.get_download_center",
    Object.keys(params).length > 0 ? params : undefined,
    { method: "GET" }
  );
}

// ── Carné de Exención ──

export async function getCarneStatus(
  customer: string,
): Promise<import("@/types/carne").CarneStatus> {
  return api.frappeCall<import("@/types/carne").CarneStatus>(
    "merkley_web.api.storefront_session.get_carne_status",
    { customer },
    { method: "GET" },
  );
}

export async function submitCarneRequest(payload: {
  customer: string;
  cert_number: string;
  cert_expiry: string;
  cert_file_url: string;
}): Promise<{ name: string }> {
  return api.frappeCall<{ name: string }>(
    "merkley_web.api.storefront_session.submit_carne_request",
    payload as unknown as Record<string, unknown>,
  );
}

export async function cancelCarneRequest(request_name: string): Promise<void> {
  await api.frappeCall<void>(
    "merkley_web.api.storefront_session.cancel_carne_request",
    { request_name },
  );
}

/**
 * Upload a carné de exención file. Wraps the existing private brand-asset
 * endpoint, which attaches the file to the active Customer (no quotation
 * scope) and forces is_private=1. Returns the resulting file_url, which
 * the caller then passes to submitCarneRequest.
 */
export async function uploadCarneFile(file: File): Promise<string> {
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:<mime>;base64," prefix — backend expects raw base64.
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new ApiError("No se pudo leer el archivo.", 0));
    reader.readAsDataURL(file);
  });

  const result = await api.frappeCall<{ file_url: string }>(
    "merkley_web.api.files.upload_brand_asset",
    { filename: file.name, content, is_private: 1 },
  );
  return result.file_url;
}

// ── Notifications ──

export async function getCustomerNotifications(
  args: { customer?: string } = {}
): Promise<NotificationListResponse> {
  return frappeCall<NotificationListResponse>(
    "notifications.get_customer_notifications",
    args.customer ? { customer: args.customer } : {}
  );
}

export async function markNotificationRead(args: {
  name?: string;
  mark_all?: boolean;
  customer?: string;
}): Promise<{ ok: true }> {
  return frappeCall<{ ok: true }>("notifications.mark_notification_read", args as Record<string, unknown>);
}

export { ApiError };

// ── Generic RPC bridge ──
// Exposes a typed `frappeCall` that accepts a *fully-qualified* Frappe method
// path (e.g. "merkley_web.state_machine.api.get_state_metadata"). The rest of
// this module's helpers live under the "merkley_web.api.*" namespace and
// internally use the private `frappeCall` above, which auto-prefixes that
// namespace. Newer state-machine endpoints live under
// "merkley_web.state_machine.*" which is outside that prefix, so we need a
// callable that does no rewriting.
export const api = {
  /** Call a fully-qualified Frappe whitelisted method (no prefix rewriting). */
  frappeCall: frappeCallAbsolute,
};
