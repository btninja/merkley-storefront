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

// ── Core API Call ──

async function frappeCall<T>(
  method: string,
  params?: Record<string, unknown>,
  options?: { method?: "GET" | "POST"; revalidate?: number | false }
): Promise<T> {
  const httpMethod = options?.method || "POST";
  let url = `${ERP_BASE}/api/method/merkley_web.api.${method}`;

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
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("La solicitud tardo demasiado. Intenta de nuevo.", 408);
    }
    throw err;
  }
  clearTimeout(timeoutId);

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
    throw new ApiError(
      serverMessage || `Request failed: ${response.status}`,
      response.status,
      serverMessage
    );
  }

  const data = await response.json();
  return data.message as T;
}

// ── Auth ──

export async function login(email: string, password: string): Promise<SessionResponse> {
  const session = await frappeCall<SessionResponse>("auth.authenticate_client", { email, password });
  setCsrfToken(session.csrf_token);
  return session;
}

export async function validateRnc(rnc: string): Promise<import("@/lib/types").DgiiValidationResult> {
  return frappeCall<import("@/lib/types").DgiiValidationResult>("auth.validate_rnc", { rnc });
}

export async function register(data: RegistrationData): Promise<RegisterResponse> {
  const result = await frappeCall<RegisterResponse>("auth.register_client", data as unknown as Record<string, unknown>);
  if ("csrf_token" in result) {
    setCsrfToken(result.csrf_token);
  }
  return result;
}

export async function verifyEmail(token: string, email: string): Promise<SessionResponse | { approval_pending: true }> {
  const result = await frappeCall<SessionResponse | { approval_pending: true }>("auth.verify_email", { token, email });
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
  return frappeCall("catalogs.generate_customer_catalog_pdf", params as Record<string, unknown>);
}

// ── Quotations ──

export async function getMyQuotations(stage?: string): Promise<QuotationListResponse> {
  return frappeCall<QuotationListResponse>("quotations.get_my_quotations", stage ? { stage } : undefined);
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
  name: string,
  generalNotes?: string
): Promise<QuotationDetailResponse> {
  return frappeCall<QuotationDetailResponse>("quotations.submit_quotation", {
    name,
    general_notes: generalNotes,
  });
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

export async function uploadInvoiceFile(file: File, invoiceName: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", invoiceName);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  try {
    const token = await getCsrfToken();
    headers["X-Frappe-CSRF-Token"] = token;
  } catch {
    // proceed without token
  }

  let response = await fetch(
    `${ERP_BASE}/api/method/merkley_web.api.invoices.upload_invoice_file`,
    {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    }
  );

  // Retry on 403 (stale CSRF token)
  if (response.status === 403) {
    try {
      clearCsrfToken();
      const freshToken = await fetchCsrfToken();
      headers["X-Frappe-CSRF-Token"] = freshToken;
      response = await fetch(
        `${ERP_BASE}/api/method/merkley_web.api.invoices.upload_invoice_file`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: formData,
        }
      );
    } catch {
      // fall through
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new ApiError(`Upload failed: ${errorText}`, response.status);
  }
  const data = await response.json();
  return data.message?.file_url || "";
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
): Promise<QuotationDetailResponse> {
  return frappeCall<QuotationDetailResponse>("quotations.approve_quotation", {
    name,
    approval_method: approvalMethod,
    approval_document_file: approvalDocumentFileUrl,
    logo_file: logoFileUrl,
  });
}

export async function downloadCartaResponsabilidad(name: string): Promise<void> {
  const url = `${ERP_BASE}/api/method/merkley_web.api.quotations.download_carta_responsabilidad?name=${encodeURIComponent(name)}`;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new ApiError("Failed to download PDF", response.status);
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Carta_Responsabilidad_${name}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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
export async function uploadQuotationFile(file: File, quotationName: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", quotationName);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // Include CSRF token
  try {
    const token = await getCsrfToken();
    headers["X-Frappe-CSRF-Token"] = token;
  } catch {
    // proceed without token
  }

  let response = await fetch(
    `${ERP_BASE}/api/method/merkley_web.api.quotations.upload_quotation_file`,
    {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    }
  );

  // Retry on 403 (stale CSRF token)
  if (response.status === 403) {
    try {
      clearCsrfToken();
      const freshToken = await fetchCsrfToken();
      headers["X-Frappe-CSRF-Token"] = freshToken;
      response = await fetch(
        `${ERP_BASE}/api/method/merkley_web.api.quotations.upload_quotation_file`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: formData,
        }
      );
    } catch {
      // fall through to error handling
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new ApiError(`Upload failed: ${errorText}`, response.status);
  }
  const data = await response.json();
  return data.message?.file_url || "";
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

export async function getOrderPipeline(): Promise<OrderPipelineResponse> {
  return frappeCall<OrderPipelineResponse>("portal.get_order_pipeline", undefined, {
    method: "GET",
  });
}

export interface PurchaseHistoryItem {
  name: string;
  doctype: string;
  date: string;
  grand_total: number;
  currency: string;
  status: string;
  item_count: number;
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

export async function getDownloadCenter(year?: number): Promise<DownloadCenterResponse> {
  return frappeCall<DownloadCenterResponse>(
    "portal.get_download_center",
    year ? { year } : undefined,
    { method: "GET" }
  );
}

export interface SupportMessage {
  id: string;
  sender: string;
  sender_name: string;
  content: string;
  timestamp: string;
  direction: "in" | "out";
}

export interface SupportConversation {
  conversation_id: string;
  subject: string;
  created_at: string;
  last_message_at: string;
  status: string;
}

export interface SupportMessagesResponse {
  conversation: SupportConversation;
  messages: SupportMessage[];
}

export interface InitiateChatResponse {
  conversation_id: string;
  subject: string;
}

export async function initiateSupportChat(
  message: string,
  subject: string
): Promise<InitiateChatResponse> {
  return frappeCall("portal.initiate_support_chat", { message, subject });
}

export async function getSupportMessages(
  conversationId: string
): Promise<SupportMessagesResponse> {
  return frappeCall<SupportMessagesResponse>(
    "portal.get_support_messages",
    { conversation_id: conversationId },
    { method: "GET" }
  );
}

export async function sendSupportMessage(
  conversationId: string,
  message: string
): Promise<{ ok: boolean; message: SupportMessage }> {
  return frappeCall("portal.send_support_message", {
    conversation_id: conversationId,
    message,
  });
}

export async function getSupportConversations(): Promise<{
  conversations: SupportConversation[];
}> {
  return frappeCall("portal.get_support_conversations", undefined, {
    method: "GET",
  });
}

export { ApiError };
