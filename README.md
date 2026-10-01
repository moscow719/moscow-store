# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Supabase order inventory and tracking

Before deploying order API changes, run `supabase/migrations/20261001_order_inventory_tracking.sql` in the Supabase SQL Editor. The migration adds a unique idempotency key, persisted order totals, nullable stock quantities, and the transactional `place_order` function used to atomically create orders and decrement tracked inventory.

Existing product quantities are intentionally left `NULL` because the catalog only records whether a product is available, not how many units exist. Set accurate stock quantities in the Admin Panel before relying on quantity-based stock deduction. A blank stock quantity remains untracked; a quantity of zero marks the product out of stock.

Customers can track an order using the full UUID shown on the order confirmation. `GET /api/orders/:id` returns only the order status and timestamps, not customer details.
