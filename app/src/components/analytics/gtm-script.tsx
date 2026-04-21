"use client";

import Script from "next/script";
import { useBootstrap } from "@/hooks/use-catalog";
import { useConsentGranted } from "./consent-banner";

/**
 * GTM + Google Ads gtag loader.
 *
 * Both IDs come from the backend brand config (Website Settings
 * → mw_gtm_id, mw_google_ads_id) rather than being hardcoded, so a
 * new deployment only needs to update the ERPNext doc, not code.
 *
 * Loads only when consent has been granted — otherwise stays dormant.
 */

export function GtmScript() {
  const { data: bootstrap } = useBootstrap();
  const gtmId = bootstrap?.analytics?.gtm_id;
  const gadsId = bootstrap?.analytics?.google_ads_id;
  const consent = useConsentGranted();

  if (!consent) return null;

  return (
    <>
      {gtmId && (
        <Script
          id="gtm-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      )}
      {gadsId && (
        <>
          <Script
            id="gtag-js"
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${gadsId}`}
          />
          <Script
            id="gtag-config"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gadsId}',{'allow_enhanced_conversions':true});`,
            }}
          />
        </>
      )}
    </>
  );
}

