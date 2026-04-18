import type { QuoteStage, DeliveryTier } from "./constants";

// ── Auth / Session ──

export interface SessionUser {
  email: string;
  is_authenticated: boolean;
}

export interface SessionCustomer {
  name: string | null;
  company_name: string | null;
  rnc: string | null;
  contact_name: string | null;
  whatsapp: string | null;
  industry: string | null;
  is_company_admin?: boolean;
  trusted_domain?: string | null;
}

export interface PriceContext {
  price_list: string;
  is_guest: boolean;
}

export interface SessionSettings {
  currency: string;
  quote_expiry_days: number;
}

export interface SessionResponse {
  csrf_token: string;
  user: SessionUser;
  customer: SessionCustomer;
  price_context: PriceContext;
  settings: SessionSettings;
}

// ── Catalog ──

export interface ProductImage {
  url: string;
  label: string | null;
}

export interface ProductComponent {
  label: string;
  description: string | null;
}

export interface ProductAvailability {
  label: string;
  stock_qty: number | null;
}

export interface ProductPrice {
  amount: number | null;
  currency: string;
  price_list: string;
}

export interface Product {
  sku: string;
  slug: string;
  name: string;
  category: string | null;
  tier: string | null;
  short_description: string | null;
  description: string | null;
  customization_options: string | null;
  is_personalizable: boolean;
  minimum_order_qty: number;
  lead_time_days: number;
  availability: ProductAvailability;
  images: ProductImage[];
  components: ProductComponent[];
  price: ProductPrice;
}

export interface CategoryFilter {
  category: string;
  product_count: number;
}

export interface CategoryTreeNode {
  name: string;
  slug: string;
  children: CategoryTreeNode[];
  product_count: number;
  own_count: number;
  image: string | null;
}

export interface TierFilter {
  tier: string;
  product_count: number;
}

export type SortOption = "newest" | "price_asc" | "price_desc" | "alpha";

// ── Season ──

export interface Season {
  name: string;
  season_name: string;
  slug: string;
  description: string | null;
  month: number;
  end_day: number;
  is_active: number;
  banner_image: string | null;
  sort_order: number;
  product_count: number;
}

export interface SeasonSummary {
  name: string;
  season_name: string;
  slug: string;
  description: string | null;
  banner_image: string | null;
  sort_order: number;
  month: number;
  end_day: number;
  product_count?: number;
}

export interface SeasonsResponse {
  seasons: Season[];
}

export interface SeasonProductsResponse {
  season: {
    name: string;
    season_name: string;
    slug: string;
    description: string | null;
    banner_image: string | null;
    is_active: number;
    month: number;
    end_day: number;
  };
  items: Product[];
  pagination: {
    page: number;
    page_length: number;
    has_more: boolean;
  };
  price_context: PriceContext;
}

export interface ContactScheduleItem {
  day: string;
  hours: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  support_email: string;
  whatsapp: string;
  brand_name: string;
  address: string[];
  schedule: ContactScheduleItem[];
}

export interface BootstrapResponse {
  settings: {
    public_price_list: string;
    currency: string;
    itbis_rate: number;
    quote_expiry_days: number;
    storefront_base_url: string;
  };
  price_context: PriceContext;
  filters: {
    categories: CategoryFilter[];
    category_tree: CategoryTreeNode[];
    tiers: TierFilter[];
  };
  seasons: SeasonSummary[];
  contact: ContactInfo;
  analytics?: AnalyticsConfig;
}

export interface AnalyticsConfig {
  umami_website_id: string;
  umami_script_url: string;
  meta_pixel_id: string;
  google_ads_id: string;
  google_ads_registration_label: string;
  google_ads_quote_label: string;
  tiktok_pixel_id: string;
}

export interface ProductListResponse {
  items: Product[];
  total_count: number;
  pagination: {
    page: number;
    page_length: number;
    has_more: boolean;
  };
  applied_filters: {
    category: string | null;
    tier: string | null;
    search: string | null;
    season: string | null;
    sort_by: string | null;
    availability: string | null;
  };
  price_context: PriceContext;
}

export interface ProductDetailResponse {
  item: Product;
  price_context: PriceContext;
}

// ── Quotation ──

export interface QuotationItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  base_rate: number;
  surcharge_percentage: number;
  delivery_tier: DeliveryTier;
  requested_delivery_date: string | null;
  customization_notes: string | null;
  logo_file_url: string | null;
}

export interface QuotationTax {
  description: string;
  rate: number;
  tax_amount: number;
}

export interface QuotationDocuments {
  approval_method: string | null;
  approval_document_file: string | null;
  logo_file: string | null;
  orden_compra_file: string | null;
  uploaded_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_notes: string | null;
}

export interface QuotationShipping {
  delivery_method: string;
  zone: string | null;
  cost: number;
  tier: string | null;
  may_vary: boolean;
}

export interface Quotation {
  name: string;
  status: string;
  stage: QuoteStage;
  currency: string;
  transaction_date: string;
  valid_till: string;
  desired_delivery_date: string | null;
  general_notes: string | null;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  pdf_download_url: string;
  items: QuotationItem[];
  taxes: QuotationTax[];
  documents: QuotationDocuments | null;
  rejection_reason: string | null;
  can_approve: boolean;
  has_personalizable_items: boolean;
  mw_approval_doc_required: number;
  shipping: QuotationShipping | null;
}

export interface QuotationSummary {
  name: string;
  transaction_date: string;
  valid_till: string;
  currency: string;
  grand_total: number;
  tax_total: number;
  status: string;
  stage: QuoteStage;
  pdf_download_url: string;
  modified: string;
}

export interface QuotationListResponse {
  quotes: QuotationSummary[];
  price_context: PriceContext;
  settings: SessionSettings;
}

export interface QuotationDetailResponse {
  quote: Quotation;
  price_context: PriceContext;
}

// ── Registration ──

export interface RegistrationData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  password: string;
  rnc: string;
  industry?: string;
  employee_count_range?: string;
  referral_source?: string;
  position?: string;
}

export interface DgiiValidationResult {
  valid: boolean;
  rnc?: string;
  full_name?: string;
  trade_name?: string;
  status?: string;
  rnc_type?: "rnc" | "cedula";
  message?: string;
  company_exists?: boolean;
  existing_company_name?: string;
  trusted_domain?: string | null;
}

// ── Email Verification ──

export interface VerificationRequiredResponse {
  verification_required: true;
  email: string;
  joined_existing?: boolean;
  company_name?: string;
}

export interface ApprovalPendingResponse {
  approval_pending: true;
  email: string;
}

export type RegisterResponse = SessionResponse | VerificationRequiredResponse | ApprovalPendingResponse;

// ── Quotation Creation ──

export interface QuotationLineInput {
  item_code: string;
  qty: number;
  customization_notes?: string;
}

export interface CreateQuotationInput {
  items: QuotationLineInput[];
  desired_delivery_date?: string;
  general_notes?: string;
  submit?: boolean;
  delivery_method?: string;
  shipping_zone?: string;
}

// ── Shipping ──

export interface ShippingZone {
  zone_name: string;
  delivery_method: string;
  level_1_price: number;
}

export interface ShippingZonesResponse {
  shipping_enabled: boolean;
  zones: ShippingZone[];
}

export interface ShippingCalculation {
  cost: number;
  tier: number;
  tier_label: string;
  may_vary: boolean;
  zone_name: string;
  delivery_method: string;
}

// ── Cart ──

export interface CartItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  customization_options: string | null;
  image_url: string | null;
}

// ── Invoices ──

export interface InvoicePaymentStatus {
  label: string;
  color: "success" | "warning" | "info" | "destructive";
}

export interface InvoiceItem {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
}

export interface InvoiceTax {
  description: string;
  rate: number;
  tax_amount: number;
}

// Canonical post-migration stages. See
// merkley_web.state_machine.invoice.STATES for the authoritative source.
export const INVOICE_STAGES = [
  "Pendiente de Pago",
  "Comprobante en Revisión",
  "Pago Aprobado",
  "Pago Parcial",
  "Pagada",
  "Vencida",
  "Anulación Solicitada",
  "Anulada",
] as const;

// Pre-migration stage values we still accept defensively so legacy rows
// surfaced from the backend don't crash list rendering. New work should
// target the canonical values only.
export const LEGACY_INVOICE_STAGES = [
  "Pago Sometido",
  "Pago en Revisión",
  "Recargo Aplicado",
] as const;

export type InvoiceStage =
  | (typeof INVOICE_STAGES)[number]
  | (typeof LEGACY_INVOICE_STAGES)[number];

export interface InvoiceSummary {
  name: string;
  posting_date: string;
  due_date: string | null;
  currency: string;
  grand_total: number;
  outstanding_amount: number;
  tax_total: number;
  status: string;
  is_return: number;
  payment_status: InvoicePaymentStatus;
  // Current post-migration field name is `stage`. `invoice_stage` is kept for
  // backward compatibility with mid-rollout responses.
  stage: InvoiceStage | null;
  invoice_stage: InvoiceStage | null;
  ncf: string | null;
  late_fee_applied: boolean;
  pdf_download_url: string;
  modified: string;
}

export interface InvoiceBankInfo {
  bank_name: string | null;
  account_number: string | null;
  account_type: string | null;
  rnc: string | null;
}

export interface Invoice {
  name: string;
  posting_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  outstanding_amount: number;
  status: string;
  is_return: number;
  return_against: string | null;
  payment_status: InvoicePaymentStatus;
  // Canonical post-migration stage field. `invoice_stage` is a deprecated
  // alias kept transiently so older client bundles don't crash during a
  // deploy window.
  stage: InvoiceStage | null;
  invoice_stage: InvoiceStage | null;
  ncf: string | null;
  ncf_expiry: string | null;
  payment_proof_file: string | null;
  payment_proof_uploaded_at: string | null;
  payment_rejection_reason: string | null;
  late_fee_applied: boolean;
  late_fee_amount: number;
  // Recargo por mora stamped on the invoice itself by the late-fee scheduler.
  // Shown inline in the Details tab when > 0.
  custom_recargo_amount: number;
  original_invoice: string | null;
  annulment_reason: string | null;
  annulment_requested_at: string | null;
  can_request_annulment: boolean;
  bank_info: InvoiceBankInfo | null;
  // Retention letter fields
  retention_letter_file: string | null;
  retention_letter_uploaded_at: string | null;
  retention_amount: number;
  retention_percentage: number;
  retention_reviewed_by: string | null;
  retention_reviewed_at: string | null;
  can_submit_retention: boolean;
  items: InvoiceItem[];
  taxes: InvoiceTax[];
  linked_quotation: string | null;
  pdf_download_url: string;
  modified: string;
}

export interface InvoiceListResponse {
  invoices: InvoiceSummary[];
  pagination: {
    page: number;
    page_length: number;
    has_more: boolean;
  };
}

export interface InvoiceDetailResponse {
  invoice: Invoice;
}

// ── Client Portfolio ──

export interface FeaturedClient {
  company_name: string;
  logo: string | null;
  industry: string | null;
}

export interface PortfolioImage {
  image: string;
  caption: string | null;
  display_order: number;
}

export interface PortfolioClient {
  name: string;
  company_name: string;
  slug: string;
  logo: string | null;
  industry: string | null;
  short_description: string | null;
  display_order: number;
  portfolio_images: PortfolioImage[];
}

export interface FeaturedClientsResponse {
  clients: FeaturedClient[];
}

export interface ClientPortfolioResponse {
  clients: PortfolioClient[];
  total_count: number;
}

// ── Link Page ──

export interface LinkPageItem {
  label: string;
  url: string;
  icon: string;
  link_type: "Primario" | "Secundario" | "Social";
  display_order: number;
}

export interface LinkPageResponse {
  headline: string;
  tagline: string;
  avatar: string;
  links: LinkPageItem[];
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
  };
}

// ── Blog ──

export interface BlogPost {
  title: string;
  slug: string;
  summary: string;
  cover_image: string | null;
  category: string | null;
  author_name: string;
  published_on: string | null;
}

export interface BlogPostDetail extends BlogPost {
  content: string;
  meta_title: string;
  meta_description: string;
  og_image: string | null;
}

export interface BlogCategory {
  category_name: string;
  slug: string;
  description: string | null;
  post_count: number;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total_count: number;
  pagination: {
    page: number;
    page_length: number;
    has_more: boolean;
  };
}

export interface BlogDetailResponse {
  post: BlogPostDetail;
}

export interface BlogCategoriesResponse {
  categories: BlogCategory[];
}

export interface RecentBlogPostsResponse {
  posts: BlogPost[];
}

// ── Team Management ──

export interface TeamMember {
  email: string;
  contact_name: string;
  position: string | null;
  is_admin: boolean;
  enabled: boolean;
  last_login: string | null;
}

export interface TeamListResponse {
  company_name: string;
  trusted_domain: string | null;
  members: TeamMember[];
}
