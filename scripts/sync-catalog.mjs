import { products, typeCategories } from '../src/data/products.js';

const apiUrl = (process.env.CATALOG_API_URL || process.env.API_URL || 'http://localhost:3000/api')
  .replace(/\/+$/, '');
const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
  console.error('ADMIN_TOKEN is required');
  process.exit(1);
}

const categoryProducts = Object.values(typeCategories).flat();
const allProducts = [...products, ...categoryProducts];
const seen = new Set();
const catalog = allProducts.map((product, index) => {
  const sourceId = String(product.id);
  let id = Number.isInteger(Number(product.id)) ? Number(product.id) : 1000 + index;
  while (seen.has(id)) id += 1000;
  seen.add(id);
  return { ...product, id, sourceId };
});

const batchSize = 10;
let synced = 0;
for (let index = 0; index < catalog.length; index += batchSize) {
  const batch = catalog.slice(index, index + batchSize);
  const response = await fetch(`${apiUrl}/admin/products/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken
    },
    body: JSON.stringify({ products: batch })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`Catalog sync failed for batch ${index / batchSize + 1} (HTTP ${response.status}): ${detail}`);
    process.exit(1);
  }

  const result = await response.json();
  synced += Number(result.count) || batch.length;
  console.log(`Synced ${synced}/${catalog.length} products`);
}

console.log(`Catalog sync complete: ${synced} products`);
