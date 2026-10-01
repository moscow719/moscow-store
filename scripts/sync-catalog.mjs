import { localCatalog } from '../src/data/products.js';

const apiUrl = (process.env.CATALOG_API_URL || process.env.API_URL || 'http://localhost:3000/api')
  .replace(/\/+$/, '');
const adminToken = process.env.ADMIN_TOKEN;

if (!adminToken) {
  console.error('ADMIN_TOKEN is required');
  process.exit(1);
}

const catalogResponse = await fetch(`${apiUrl}/admin/products`, {
  headers: { 'X-Admin-Token': adminToken }
});
if (!catalogResponse.ok) {
  const detail = await catalogResponse.text();
  console.error(`Could not read the existing catalog (HTTP ${catalogResponse.status}): ${detail}`);
  process.exit(1);
}

const existingProducts = await catalogResponse.json();
if (!Array.isArray(existingProducts)) {
  console.error('Could not read the existing catalog: expected a product list');
  process.exit(1);
}
const existingIds = existingProducts.map(product => Number(product.id));
if (existingIds.some(id => !Number.isSafeInteger(id) || id < 1)) {
  console.error('Could not read the existing catalog: found a product with an invalid id');
  process.exit(1);
}
let nextId = Math.max(0, ...existingIds) + 1;
if (!Number.isSafeInteger(nextId)) {
  console.error('Could not sync the catalog: no safe numeric id is available for new products');
  process.exit(1);
}
const catalog = localCatalog.flatMap(product => {
  const sourceId = String(product.id);
  const matchingProducts = existingProducts.filter(existing => {
    const details = existing.details && typeof existing.details === 'object' ? existing.details : {};
    return [existing.sourceId, details.sourceId, details.id]
      .some(id => id !== undefined && id !== null && String(id) === sourceId);
  });
  const ids = matchingProducts.length
    ? [...new Set(matchingProducts.map(existing => Number(existing.id)))]
    : [nextId++];
  return ids.map(id => ({ ...product, id, sourceId }));
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

console.log(`Catalog sync complete: ${synced} product records from ${localCatalog.length} catalog items`);
