"use client";

/**
 * Form dropout tracking — emits form_start on first user input
 * and form_abandon on unmount/navigation/tab-close if the user
 * never reached the submit handler.
 *
 * Usage:
 *   const formTracking = useFormTracking("access_request");
 *   <Input onChange={formTracking.markDirty} ... />
 *   <Button onClick={() => { doSubmit(); formTracking.markSubmitted(); }} />
 *
 * Pair with trackFormStart / trackFormAbandon in analytics.ts.
 */

import { useCallback, useEffect, useRef } from "react";
import { trackFormStart, trackFormAbandon } from "@/lib/analytics";

export function useFormTracking(formName: string) {
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const fieldsFilledRef = useRef(0);

  const markDirty = useCallback(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackFormStart(formName);
    }
    fieldsFilledRef.current += 1;
  }, [formName]);

  const markSubmitted = useCallback(() => {
    submittedRef.current = true;
  }, []);

  useEffect(() => {
    // Tab close / navigation away handler — fires abandon if the user
    // touched fields but never hit submit. Browsers fire both
    // beforeunload and pagehide for reliability across exit types.
    const maybeFireAbandon = () => {
      if (startedRef.current && !submittedRef.current) {
        trackFormAbandon(formName, fieldsFilledRef.current);
        // Mark submitted so we don't double-fire from a second unload event
        submittedRef.current = true;
      }
    };

    window.addEventListener("beforeunload", maybeFireAbandon);
    window.addEventListener("pagehide", maybeFireAbandon);

    return () => {
      window.removeEventListener("beforeunload", maybeFireAbandon);
      window.removeEventListener("pagehide", maybeFireAbandon);
      // Fire on unmount too (route change within SPA)
      maybeFireAbandon();
    };
  }, [formName]);

  return { markDirty, markSubmitted };
}
