"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import type { SessionCustomer, SessionResponse, SessionSettings, PriceContext, RegistrationData, RegisterResponse, ApprovalPendingResponse } from "@/lib/types";
import * as api from "@/lib/api";
import { trackLogin, trackRegistration } from "@/lib/analytics";

interface SocketAuth {
  api_key: string;
  api_secret: string;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  email: string | null;
  customer: SessionCustomer | null;
  priceContext: PriceContext | null;
  settings: SessionSettings | null;
  /** Per-user Frappe API credentials used by the realtime socket. Fetched
   *  asynchronously after auth succeeds; realtime features fall back to
   *  polling while this is null. */
  socketAuth: SocketAuth | null;
}

/** Return value of register(): either the user got logged in, verification is required, or approval is pending. */
export interface RegisterResult {
  verificationRequired: boolean;
  email: string;
  joinedExisting?: boolean;
  companyName?: string;
  approvalPending?: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  applyVerifiedSession: (session: SessionResponse) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setSessionMarker(authenticated: boolean) {
  if (typeof document === "undefined") return;
  if (authenticated) {
    document.cookie = "mw_session=1; path=/; max-age=604800; secure; samesite=lax";
  } else {
    document.cookie = "mw_session=; path=/; max-age=0; secure; samesite=lax";
  }
}

function applySession(response: SessionResponse, socketAuth: SocketAuth | null = null): AuthState {
  setSessionMarker(response.user.is_authenticated);
  return {
    isLoading: false,
    isAuthenticated: response.user.is_authenticated,
    email: response.user.email,
    customer: response.customer,
    priceContext: response.price_context,
    settings: response.settings,
    socketAuth,
  };
}

function isVerificationResponse(r: RegisterResponse): r is { verification_required: true; email: string } {
  return "verification_required" in r && r.verification_required === true;
}

function isApprovalPendingResponse(r: RegisterResponse): r is ApprovalPendingResponse {
  return "approval_pending" in r && (r as ApprovalPendingResponse).approval_pending === true;
}

function isAutoVerifiedResponse(r: RegisterResponse): boolean {
  return "auto_verified" in r && (r as Record<string, unknown>).auto_verified === true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    email: null,
    customer: null,
    priceContext: null,
    settings: null,
    socketAuth: null,
  });

  const refreshSession = useCallback(async () => {
    try {
      const response = await api.getSessionContext();
      setState(applySession(response));
      // Fire-and-forget: fetch the realtime socket token so the next page
      // navigation can subscribe. Best-effort — if this fails (missing
      // perm, network blip) the storefront still works via polling.
      if (response.user.is_authenticated) {
        api.ensureSocketToken()
          .then((socketAuth) => setState((prev) => ({ ...prev, socketAuth })))
          .catch(() => {
            // socket is optional — polling fallback keeps everything working
          });
      }
    } catch {
      setSessionMarker(false);
      setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false, socketAuth: null }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    setState(applySession(response));
    trackLogin();
    // Grab the socket token in the background — not awaited so login
    // UX stays fast.
    api.ensureSocketToken()
      .then((socketAuth) => setState((prev) => ({ ...prev, socketAuth })))
      .catch(() => { /* polling fallback keeps everything working */ });
  }, []);

  const register = useCallback(async (data: RegistrationData): Promise<RegisterResult> => {
    const response = await api.register(data);

    if (isApprovalPendingResponse(response)) {
      trackRegistration(response.email, data.referral_source);
      return {
        verificationRequired: false,
        email: response.email,
        approvalPending: true,
      };
    }

    if (isVerificationResponse(response)) {
      trackRegistration(response.email, data.referral_source);
      return {
        verificationRequired: true,
        email: response.email,
        joinedExisting: response.joined_existing ?? false,
        companyName: response.company_name,
      };
    }

    // Auto-verified (customer has invoices) — login automatically
    if (isAutoVerifiedResponse(response)) {
      trackRegistration(data.email, data.referral_source);
      try {
        const session = await api.login(data.email, data.password);
        setState(applySession(session));
      } catch {
        // Auto-login failed — user can log in manually
      }
      return { verificationRequired: false, email: data.email };
    }

    // Full session response (direct activation)
    const sessionResponse = response as SessionResponse;
    setState(applySession(sessionResponse));
    trackRegistration(data.email, data.referral_source);
    return { verificationRequired: false, email: data.email };
  }, []);

  const applyVerifiedSession = useCallback((session: SessionResponse) => {
    api.setCsrfToken(session.csrf_token);
    setState(applySession(session));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clear local state even if server-side logout fails
    } finally {
      api.setCsrfToken(null);
      setSessionMarker(false);
      setState({
        isLoading: false,
        isAuthenticated: false,
        email: null,
        customer: null,
        priceContext: null,
        settings: null,
        socketAuth: null,
      });
      try {
        sessionStorage.removeItem("md_login_email");
        sessionStorage.removeItem("md_registro_form");
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshSession, applyVerifiedSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
