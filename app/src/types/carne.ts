export type Regime = "Normal" | "RST" | "Gobierno" | "Exento";

export interface CarneStatus {
  regime: Regime | null;
  cert_number: string | null;
  cert_expiry: string | null;
  cert_file_url: string | null;
  days_until_expiry: number | null;
  pending_request: {
    name: string;
    requested_at: string;
    requested_by_name: string;
  } | null;
  last_rejection_reason: string | null;
  carne_pending: boolean;
}
