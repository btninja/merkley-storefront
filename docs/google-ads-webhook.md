# Google Ads Lead Form Webhook

## Overview

Google Ads Lead Form Extensions allow users to submit lead forms directly within Google Ads. When a form is submitted, Google sends the lead data to our webhook in real-time.

**Flow:**
```
Google Ads Lead Form
  -> POST https://merkleydetails.com/api/webhooks/google-ads  (Next.js proxy)
    -> POST https://erp.merkleydetails.com/api/method/merkley_web.api.google_ads_webhook.receive_lead  (ERPNext backend)
      -> Creates Lead + MW Conversation (background job via frappe.enqueue)
```

## Configuration

### Google Ads Side
- **Webhook URL:** `https://merkleydetails.com/api/webhooks/google-ads`
- **Key:** Stored in ERPNext site_config as `google_ads_webhook_key`
- **Google's User Agent:** `Google-Ads-Notifications`

### ERPNext Side
- **site_config key:** `google_ads_webhook_key`
- **Backend file:** `merkley_web/api/google_ads_webhook.py`
- The `receive_lead()` endpoint validates the key via HMAC and enqueues lead processing

### Next.js Proxy Side
- **File:** `app/src/app/api/webhooks/google-ads/route.ts`
- Validates the `google_key` field, responds 200 immediately, and forwards to ERP fire-and-forget
- Debug logging to `/tmp/google-ads-webhook.log`

## Test Payload (from Google)

```json
{
  "lead_id": "TeSter-123-...",
  "user_column_data": [
    { "column_name": "Full Name", "string_value": "FirstName LastName", "column_id": "FULL_NAME" },
    { "column_name": "User Phone", "string_value": "+16505550123", "column_id": "PHONE_NUMBER" },
    { "column_name": "City", "string_value": "Mountain View", "column_id": "CITY" },
    { "column_name": "Company Name", "string_value": "CompanyName", "column_id": "COMPANY_NAME" },
    { "column_name": "Work Email", "string_value": "work-test@example.com", "column_id": "WORK_EMAIL" }
  ],
  "api_version": "1.0",
  "form_id": 40000000000,
  "campaign_id": 281498631867774,
  "google_key": "<secret>",
  "is_test": true,
  "gcl_id": "TeSter-123-...",
  "adgroup_id": 20000000000,
  "creative_id": 30000000000
}
```

## Lead Processing

The backend extracts these fields from `user_column_data`:
- `FULL_NAME` -> Lead first_name / last_name
- `EMAIL` or `WORK_EMAIL` -> Lead email_id
- `PHONE_NUMBER` -> Lead mobile_no
- `COMPANY_NAME` -> Lead company_name
- `CITY` -> Lead city

Additional fields set on the Lead:
- `mw_lead_source_type`: "Lead Form"
- `mw_auto_created`: 1
- `mw_utm_source`: "google"
- `mw_utm_medium`: "cpc"
- `mw_utm_campaign`: campaign_id from payload

An MW Conversation is also created and linked to the Lead.

## Debugging

### Check the webhook log
```bash
cat /tmp/google-ads-webhook.log
```

### Check nginx access logs
```bash
sudo tail -50 /var/log/nginx/access.log | grep webhook
```

### Check ERPNext error logs
```bash
tail -50 /home/frappe/erpnext-v16-bench/logs/web.log | grep google
```

### Test the endpoint manually
```bash
# With correct key (should return 200)
curl -X POST https://merkleydetails.com/api/webhooks/google-ads \
  -H "Content-Type: application/json" \
  -d '{"google_key":"<key>","is_test":true,"user_column_data":[{"column_id":"FULL_NAME","string_value":"Test"}]}'

# Simulating Google (no ALPN, specific UA)
curl --no-alpn -X POST https://merkleydetails.com/api/webhooks/google-ads \
  -H "User-Agent: Google-Ads-Notifications" \
  -H "Content-Type: application/json" \
  -d '{"google_key":"<key>","is_test":true}'
```

---

## Bug History: "We can't reach your data management system"

### Symptoms
Google Ads "Send test data" button consistently failed with "We can't reach your data management system." No requests from Google appeared in any log.

### Root Cause (Primary): Nginx Stream Proxy ALPN Routing

The server uses an nginx `stream` block on port 443 with `ssl_preread` to multiplex HTTPS and TURN (coTURN) traffic on the same port.

**Broken config:**
```nginx
stream {
    map $ssl_preread_alpn_protocols $backend {
        ~\bh2\b         nginx_https;      # HTTP/2 -> nginx
        ~\bhttp/1.1\b   nginx_https;      # HTTP/1.1 -> nginx
        default          coturn_tls;       # Everything else -> TURN server
    }
    ...
}
```

**Problem:** Google Ads' webhook HTTP client does NOT send ALPN (Application-Layer Protocol Negotiation) in the TLS handshake. Without ALPN, the request matched `default` and was routed to the **coTURN server on port 5349** instead of nginx on port 8443. The TURN server responded with the wrong SSL certificate (`crm.merkleydetails.com` instead of `merkleydetails.com`), causing an SSL mismatch. Google saw a certificate error and reported "can't reach."

**Verification:**
```bash
# This worked (curl sends ALPN h2,http/1.1):
curl -X POST https://merkleydetails.com/api/webhooks/google-ads ...  # 200 OK

# This failed (no ALPN = routed to TURN server):
curl --no-alpn -X POST https://merkleydetails.com/api/webhooks/google-ads ...
# SSL error: certificate subject name 'crm.merkleydetails.com' doesn't match
```

**Fix:** Changed routing from ALPN-based to SNI-based (Server Name Indication):
```nginx
stream {
    map $ssl_preread_server_name $backend {
        default                     nginx_https;      # All traffic -> nginx by default
        turn.merkleydetails.com     coturn_tls;       # Only TURN clients -> TURN server
    }
    ...
}
```

SNI is always present in TLS handshakes (it's how the client tells the server which hostname it's connecting to), so this works universally.

**Important:** Do NOT route `crm.merkleydetails.com` to coturn — the CRM web app also uses that hostname. The TURN server should use a dedicated subdomain (`turn.merkleydetails.com`) or clients should connect directly to port 5349.

### Root Cause (Secondary): Empty User Agent Blocking

The nginx bot-block snippet blocked ALL requests with empty user agents:
```nginx
if ($http_user_agent = "") {
    return 444;  # Close connection without response
}
```

**Fix:** Added a `map` in the http context that exempts webhook paths:
```nginx
# In nginx.conf http context:
map $uri $is_webhook_path {
    default 0;
    ~^/api/webhooks/ 1;
}
map "$http_user_agent:$is_webhook_path" $empty_ua_action {
    default "";
    ":0" "block";
    ":1" "";
}

# In bot-block snippet:
if ($empty_ua_action = "block") {
    return 444;
}
```

Note: In practice, Google Ads sends `User-Agent: Google-Ads-Notifications`, so this wasn't the active blocker. But it's good defense-in-depth for any future webhook integrations that may send empty UAs.

### Key Lesson

When using nginx `stream` with `ssl_preread` for protocol multiplexing, **never use ALPN as the routing criterion** if external services need to reach your server. Not all HTTP clients send ALPN. Use SNI (`$ssl_preread_server_name`) instead, which is universally present in modern TLS handshakes.

### Files Modified
1. `/etc/nginx/nginx.conf` - Stream block routing + empty UA map
2. `/etc/nginx/snippets/merkley-bot-block.conf` - Empty UA uses map variable
3. `/etc/nginx/conf.d/erpnext-v16-bench.conf` - Dedicated webhook location block

### Date Fixed
2026-03-14
