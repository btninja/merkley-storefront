"use client";
import { api } from "./api";

export type StateMeta = {
  label: string;
  hint: string;
  color: "gray" | "blue" | "amber" | "green" | "red";
  actor: "customer" | "staff" | "system" | "owner" | "terminal";
};

export type StateMetadataResponse = {
  states: Record<string, StateMeta>;
};

export async function fetchStateMetadata(
  doctype: "Quotation" | "Sales Invoice"
): Promise<StateMetadataResponse> {
  return api.frappeCall<StateMetadataResponse>(
    "merkley_web.state_machine.api.get_state_metadata",
    { doctype }
  );
}
