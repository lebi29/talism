# TALISM AI customer assistant

This package adds a floating **Ask TALISM** chat assistant to the public GitHub Pages storefront. It answers in the customer’s language when possible and uses the published Supabase catalog plus verified TALISM website guidance. The Gemini key stays in Supabase and is never placed in GitHub.

## Supabase setup

The `products` table and `product-images` bucket must already exist. In the Supabase dashboard, open **Edge Functions**, create a function named `ask-talis`, and paste the contents of `supabase/functions/ask-talis/index.ts` as the function source. Deploy the function and make it publicly callable without requiring a customer login; the function itself reads only published catalog rows through the public RLS policy.

In **Edge Function Secrets**, add the following value. Use the same browser-safe publishable key already present in `supabase-config.js`; never use a secret or service-role key.

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | The Google AI Studio key you created. |
| `SUPABASE_ANON_KEY` | The Supabase publishable/anon key. |
| `GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash`. |

Supabase automatically provides `SUPABASE_URL` to Edge Functions. If the dashboard asks whether JWT verification should be enabled, disable gateway JWT verification for this public customer-help function; the function validates the request shape and does not expose management operations. Product management remains protected by Supabase Auth and RLS.

## GitHub Pages setup

Upload `ai-widget.js`, `supabase-config.js`, and the modified public HTML pages to the root of the `lebi29/talism-store` repository. Each public page should load `supabase-config.js`, `catalog-feed.js`, and `ai-widget.js` before the closing body tag. The widget calls:

`https://tuahvjarjrpwpyxmqirb.supabase.co/functions/v1/ask-talis`

After GitHub Pages rebuilds, the **ASK TALISM** button appears at the lower-right corner of public storefront pages.

## Assistant behavior

The assistant can explain products, categories, prices, sizing guidance, product care, delivery, returns, FAQs, contact options, and site navigation. It must not invent stock, prices, discounts, delivery promises, policies, or unavailable products. It must not request passwords or payment-card details, process payments, claim an order was placed, or give professional medical, legal, financial, or insurance advice. For information that is not present in the verified context, it directs the customer to TALISM support.

Gemini free-tier availability, rate limits, and model availability can change. If the provider is unavailable or quota is exhausted, the widget displays a polite support fallback instead of blocking the storefront.
