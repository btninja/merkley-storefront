"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import type { SessionCustomer, SessionResponse, SessionSettings, PriceContext, RegistrationData, RegisterResponse } from "@/lib/types";
import * as api from "@/lib/api";
import { trackLogin, trackRegistration } from "@/lib/analytics";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  email: string | null;
  customer: SessionCustomer | null;
  priceContext: PriceContext | null;
  settings: SessionSettings | null;
}

/** Return value of register(): either the user got logged in or verification is required. */
export interface RegisterResult {
  verificationRequired: boolean;
  email: string;
  joinedExisting?: boolean;
  companyName?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  applyVerifiedSession: (session: SessionResponse) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applySession(response: SessionResponse): AuthState {
  return {
    isLoading: false,
    isAuthenticated: response.user.is_authenticated,
    email: response.user.email,
    customer: response.customer,
    priceContext: response.price_context,
    settings: response.settings,
  };
}

function isVerificationResponse(r: RegisterResponse): r is { verification_required: true; email: string } {
  return "verification_required" in r && r.verification_required === true;
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
  });

  const refreshSession = useCallback(async () => {
    try {
      const response = await api.getSessionContext();
      setState(applySession(response));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    setState(applySession(response));
    trackLogin();
  }, []);

  const register = useCallback(async (data: RegistrationData): Promise<RegisterResult> => {
    const response = await api.register(data);

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

    setState(applySession(response));
    trackRegistration(data.email, data.referral_source);
    return { verificationRequired: false, email: data.email };
  }, []);

  const applyVerifiedSession = useCallback((session: SessionResponse) => {
    api.setCsrfToken(session.csrf_token);
    setState(applySession(session));
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      email: null,
      customer: null,
      priceContext: null,
      settings: null,
    });
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
