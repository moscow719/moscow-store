# MOSCOW Store

React and Vite storefront with a Vercel API function and Supabase persistence.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- A Supabase project for the deployed API

## Local development

From this directory:

```sh
npm ci
npm run dev
```

The Vite development server proxies `/api` requests to the configured MOSCOW Vercel deployment in `vite.config.js`. Production API requests use the same-origin `/api` path by default. Set `VITE_API_URL` only when intentionally using a different API base URL.

The standalone Node backend is located at `../backend`. It is separate from the Vercel API function in `api/index.js`; moving it does not change the Vercel deployment routing.

Available checks and commands:

```sh
npm run lint
npm run build
npm run preview
npm run sync:catalog
```

## Deployment

Deploy this directory as the Vercel project root. The project uses `api/index.js` as its serverless API entry point and `vercel.json` routes `/api/*` requests to it. Vite builds the storefront into `dist`.

Configure these server-side environment variables in Vercel:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase service role key |
| `ADMIN_TOKEN` | Yes | Protects admin API operations |
| `FRONTEND_ORIGIN` | No | Restricts the API CORS origin; defaults to `*` |
| `TELEGRAM_BOT_TOKEN` | No | Enables Telegram order notifications when used with `TELEGRAM_CHAT_ID` |
| `TELEGRAM_CHAT_ID` | No | Destination for optional Telegram order notifications |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_TOKEN` as `VITE_` variables or commit their values.

Optional client build variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL; defaults to the same-origin `/api` |
| `VITE_PROMOTION_ENDS_AT` | ISO-8601 timestamp, including timezone, for the promotion countdown |

## Supabase setup

Apply `supabase/migrations/20261001_order_inventory_tracking.sql` to the production database before deploying the matching order API. It adds order totals and idempotency support, nullable product stock quantities, and the transactional `place_order` function.

Existing stock quantities remain untracked (`NULL`) until set in the Admin Panel. Enter accurate inventory before relying on stock deduction.

## Product catalog

`GET /api/products` is the storefront's catalog source. `src/data/products.js` supplies the local fallback if the API cannot be reached; the same de-duplicated `localCatalog` is used by `npm run sync:catalog`. Sync reads the current admin catalog first and updates every database record with the matching `sourceId`, so legacy duplicate rows receive the same current name instead of keeping an old placeholder.

Names for products without a supplied catalog title are descriptive labels based on their photos and visible prints; they are not verified supplier or official model names.

To update existing product names immediately in Supabase, run `supabase/migrations/20261001_product_display_names.sql` in the Supabase SQL Editor. The migration changes names only and updates any duplicate rows sharing the same source ID.

Catalog sync requires `ADMIN_TOKEN` and sends batches to `CATALOG_API_URL` or `API_URL`. Set one to the API base URL, including `/api` (for example, `https://your-deployment.vercel.app/api`). If neither is set, the script uses `http://localhost:3000/api`. The script does not load `.env` files automatically; provide the variables in the shell or CI environment.

## Orders and administration

The Admin Panel keeps its token in memory only while open. Customers can track orders with the full UUID shown after checkout; `GET /api/orders/:id` returns order status and timestamps without customer details.
