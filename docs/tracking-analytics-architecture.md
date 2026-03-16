# Tracking & Analytics Architecture

## Overview

Merkley Details uses a multi-layered tracking setup optimized for conversion measurement while keeping the site fast.

```
                    ┌─────────────────┐
                    │   Google Ads     │
                    │ AW-18012244228   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
    │ Lead Form Ext  │ │  gtag.js │ │     GTM     │
    │ (Webhook)      │ │ (direct) │ │GTM-TSFZRK62 │
    └─────────┬──────┘ └────┬─────┘ └──────┬──────┘
              │             │              │
              │             │     ┌────────┼────────┐
              │             │     │        │        │
              ▼             ▼     ▼        ▼        ▼
         ERPNext      Conversions  Clarity  Remarketing  Conv Linker
         Lead + Conv  (page load)
```

## Components

### 1. Google Tag Manager (GTM-TSFZRK62)

**Installation:** `app/src/components/analytics/gtm-script.tsx` loaded in `layout.tsx`

**Published Tags:**
| Tag | Trigger | Purpose |
|-----|---------|---------|
| Google Ads - Conversion Linker | All Pages | Links ad clicks to conversions via cookies |
| Google Ads - Remarketing | All Pages | Builds audience lists for retargeting |
| Microsoft Clarity | All Pages | Session recording & heatmaps |

### 2. Google Ads Conversion Tracking (gtag.js)

**Conversion ID:** `AW-18012244228`
**Google Ads Account:** `672-348-7598`

**Installation:** gtag.js is loaded via GTM container. The `gtag('config', 'AW-18012244228')` is configured within GTM.

**Conversion Actions:**
| Name | Type | Trigger | Status |
|------|------|---------|--------|
| Lead form - Submit | Google hosted | Lead Form Extension submission | Primary |
| Submit lead form | Website | Page load of `/auth/verificar-correo` | Primary |

**How website conversions work:**
- gtag.js (via GTM) runs on all pages
- Google Ads matches the URL `/auth/verificar-correo` against the conversion action config
- When a user reaches that page (after email verification = completed registration), the conversion fires automatically
- No separate GTM conversion tag needed — Google handles it via the page load URL match

### 3. Google Ads Lead Form Webhook

**Full documentation:** See `google-ads-webhook.md`

**Quick summary:**
- Google Ads Lead Form Extensions → POST to `https://merkleydetails.com/api/webhooks/google-ads`
- Next.js proxy validates key, responds 200 immediately, forwards to ERPNext
- ERPNext creates Lead + MW Conversation in background job

### 4. Umami Analytics

**Dashboard:** `https://analytics.merkleydetails.com`
**Purpose:** Privacy-friendly web analytics (page views, referrers, devices)
**Installation:** Script tag in `layout.tsx`

### 5. Microsoft Clarity

**Installation:** Via GTM tag (Microsoft Clarity - Official)
**Purpose:** Session recordings, heatmaps, rage click detection
**CSP:** Updated to allow `*.clarity.ms` and `c.bing.com`

### 6. Enhanced Conversions

**Status:** Managed through Google Tag
**Method:** Configured in Google Ads account settings
**Purpose:** Uses hashed user data to improve conversion attribution

## SEO Setup

### Sitemap
- **URL:** `https://merkleydetails.com/sitemap.xml`
- **File:** `app/src/app/sitemap.ts`
- **Content:** 8 static pages + ~1,549 product pages (fetched from ERPNext API)
- **Revalidation:** Every 3600 seconds
- **Nginx:** Dedicated location block strips CSP headers, adds caching

### robots.txt
- **URL:** `https://merkleydetails.com/robots.txt`
- **File:** `app/src/app/robots.ts`
- **References:** Sitemap URL

### JSON-LD Structured Data
- **Organization + LocalBusiness:** Global in `layout.tsx` `<head>`
- **Product:** Per product page in `catalogo/[slug]/page.tsx`

### Page Metadata
Each page exports metadata via Next.js `generateMetadata()` or static `metadata` object:
- Title with template: `%s | Merkley Details`
- Open Graph tags (title, description, images)
- Product pages: dynamic titles, descriptions, OG images from ERPNext

## Product Feeds

### Google Merchant Center
- **Feed URL:** `https://merkleydetails.com/api/feeds/google?token=<token>`
- **Format:** XML (Google Shopping feed)
- **Auth:** Token-based or Basic Auth (user: merkley)
- **Shipping:** Flat rate RD$500, Dominican Republic only, feed label MKD_RD

### Meta Commerce
- **Feed URL:** `https://merkleydetails.com/api/feeds/meta?token=<token>`
- **Format:** TSV

## Infrastructure Notes

### Nginx Stream Proxy (Port 443)
Port 443 uses `ssl_preread` to multiplex HTTPS and TURN traffic:
```nginx
stream {
    map $ssl_preread_server_name $backend {
        default                     nginx_https;      # All HTTP traffic
        turn.merkleydetails.com     coturn_tls;       # TURN clients only
    }
}
```

**CRITICAL:** Do NOT change this to ALPN-based routing. Some HTTP clients (including Google Ads webhooks) don't send ALPN, which would route them to the TURN server. See `google-ads-webhook.md` for the full incident report.

### CSP (Content Security Policy)
**File:** `/etc/nginx/snippets/merkley-security-headers.conf`

Domains allowed:
- **script-src:** `googletagmanager.com`, `clarity.ms`
- **img-src:** `c.bing.com`, `c.clarity.ms`
- **connect-src:** `*.clarity.ms`, `c.bing.com`, `google-analytics.com`

### Bot Blocking
**File:** `/etc/nginx/snippets/merkley-bot-block.conf`

Empty user agents are blocked EXCEPT for webhook paths (`/api/webhooks/`), controlled via nginx map in `nginx.conf`.

## Performance Considerations

- **No Google Analytics (GA4):** Umami handles analytics without the weight of GA4
- **GTM loads afterInteractive:** Non-blocking, loads after page is interactive
- **gtag.js via GTM:** Single script load, not a separate gtag.js + GTM
- **Clarity via GTM:** No additional script tag in HTML

## File Reference

| File | Purpose |
|------|---------|
| `app/src/components/analytics/gtm-script.tsx` | GTM Script + NoScript components |
| `app/src/app/layout.tsx` | GTM, JSON-LD, Umami integration |
| `app/src/app/sitemap.ts` | Dynamic sitemap generation |
| `app/src/app/robots.ts` | robots.txt with sitemap reference |
| `app/src/app/api/webhooks/google-ads/route.ts` | Webhook proxy for Lead Forms |
| `app/src/app/api/feeds/google/route.ts` | Google Merchant Center feed |
| `app/src/app/api/feeds/meta/route.ts` | Meta Commerce feed |
| `app/src/app/style-guide/route.ts` | Brand style guide (plain HTML) |
| `merkley_web/api/google_ads_webhook.py` | ERPNext webhook handler |
| `/etc/nginx/nginx.conf` | Stream proxy + empty UA map |
| `/etc/nginx/snippets/merkley-security-headers.conf` | CSP headers |
| `/etc/nginx/snippets/merkley-bot-block.conf` | Bot blocking rules |
| `/etc/nginx/conf.d/erpnext-v16-bench.conf` | Nginx server blocks |

## Date
Last updated: 2026-03-14
