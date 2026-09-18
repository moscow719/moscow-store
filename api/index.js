import crypto from 'node:crypto';

const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const toCamel = key => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const toSnake = key => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const fromDb = value => Array.isArray(value)
  ? value.map(fromDb)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([key, item]) => [toCamel(key), fromDb(item)]))
    : value;
const toDb = value => Array.isArray(value)
  ? value.map(toDb)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([key, item]) => [toSnake(key), toDb(item)]))
    : value;

const dbRequest = async (table, options = {}) => {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase is not configured');
  const query = options.query ? `?${new URLSearchParams(options.query).toString()}` : '';
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
    method: options.method || 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation'
    },
    body: options.body === undefined ? undefined : JSON.stringify(toDb(options.body))
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${response.status}: ${detail || response.statusText}`);
  }
  if (response.status === 204) return [];
  const text = await response.text();
  return text ? fromDb(JSON.parse(text)) : [];
};

const list = table => dbRequest(table);
const insert = async (table, value) => (await dbRequest(table, { method: 'POST', body: value }))[0] || value;
const update = async (table, id, value) => (await dbRequest(table, {
  method: 'PATCH', query: { id: `eq.${id}` }, body: value
}))[0];
const remove = async (table, id) => (await dbRequest(table, {
  method: 'DELETE', query: { id: `eq.${id}` }
}))[0];

const jsonBody = async req => {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('Payload too large');
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error('Invalid JSON'); }
};

const publicUser = user => ({ id: user.id, email: user.email, role: user.role || 'customer' });
const validProduct = body => body && typeof body.name === 'string' && body.name.trim() &&
  Number.isFinite(Number(body.price)) && Number(body.price) >= 0;
const hashPassword = password => new Promise((resolve, reject) => {
  const salt = crypto.randomBytes(16);
  crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derived) => {
    if (error) reject(error);
    else resolve(`scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`);
  });
});
const verifyPassword = (password, stored) => new Promise((resolve, reject) => {
  if (typeof stored !== 'string') return resolve(false);
  if (!stored.startsWith('scrypt$')) {
    const legacy = crypto.createHash('sha256').update(password).digest('hex');
    return resolve(stored.length === legacy.length &&
      crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(legacy)));
  }
  const [, saltText, hashText] = stored.split('$');
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    crypto.scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }, (error, actual) => {
      if (error) reject(error);
      else resolve(actual.length === expected.length && crypto.timingSafeEqual(actual, expected));
    });
  } catch { resolve(false); }
});

const adminAuthorized = req => {
  const supplied = req.headers['x-admin-token'] ||
    (String(req.headers.authorization || '').startsWith('Bearer ')
      ? String(req.headers.authorization).slice(7) : '');
  const expected = String(process.env.ADMIN_TOKEN || '');
  const actualBuffer = Buffer.from(String(supplied));
  const expectedBuffer = Buffer.from(expected);
  return Boolean(expected && supplied && actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer));
};

const send = (res, status, body, req) => {
  const configuredOrigin = process.env.FRONTEND_ORIGIN;
  const origin = configuredOrigin || '*';
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.end(status === 204 ? '' : JSON.stringify(body));
};

export default async function handler(req, res) {
  const path = new URL(req.url, 'http://vercel.local').pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const parts = path ? path.split('/') : [];
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {}, req);
    if (req.method === 'GET' && path === 'products') return send(res, 200, await list('products'), req);

    if (req.method === 'POST' && path === 'orders') {
      const body = await jsonBody(req);
      if (!body.customer || !Array.isArray(body.items) || !body.items.length) {
        return send(res, 400, { error: 'Customer and order items are required' }, req);
      }
      const paymentMethod = body.paymentMethod || 'cod';
      if (!['cod', 'online'].includes(paymentMethod)) return send(res, 400, { error: 'Unsupported payment method' }, req);
      const order = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'received', paymentMethod };
      await insert('orders', order);
      return send(res, 201, { orderId: order.id, status: order.status, paymentMethod }, req);
    }
    if (req.method === 'POST' && path === 'payments/intents') {
      const body = await jsonBody(req);
      if (!body.orderId) return send(res, 400, { error: 'orderId is required' }, req);
      return send(res, 501, { error: 'Online payment provider is not configured', payment: { status: 'not_configured', orderId: body.orderId } }, req);
    }
    if (req.method === 'POST' && path === 'auth/register') {
      const body = await jsonBody(req);
      if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
          typeof body.password !== 'string' || body.password.length < 8) {
        return send(res, 400, { error: 'Valid email and password of at least 8 characters are required' }, req);
      }
      const email = body.email.toLowerCase();
      const users = await list('users');
      if (users.some(user => user.email === email)) return send(res, 409, { error: 'Email already registered' }, req);
      const user = { id: crypto.randomUUID(), email, passwordHash: await hashPassword(body.password), role: 'customer', createdAt: new Date().toISOString() };
      await insert('users', user);
      return send(res, 201, { user: publicUser(user) }, req);
    }
    if (req.method === 'POST' && path === 'auth/login') {
      const body = await jsonBody(req);
      const user = (await list('users')).find(item => item.email === String(body.email || '').toLowerCase());
      if (!user || !(await verifyPassword(String(body.password || ''), user.passwordHash))) {
        return send(res, 401, { error: 'Invalid email or password' }, req);
      }
      if (!user.passwordHash.startsWith('scrypt$')) {
        user.passwordHash = await hashPassword(String(body.password));
        await update('users', user.id, { passwordHash: user.passwordHash });
      }
      return send(res, 200, { user: publicUser(user) }, req);
    }

    if (parts[0] === 'admin') {
      if (!adminAuthorized(req)) return send(res, 401, { error: 'Admin authentication required' }, req);
      const resource = parts[1];
      if (resource === 'products') {
        if (req.method === 'POST' && parts.length === 3 && parts[2] === 'sync') {
          const body = await jsonBody(req);
          if (!Array.isArray(body.products)) {
            return send(res, 400, { error: 'products must be an array' }, req);
          }
          if (body.products.some(product => !product || typeof product !== 'object' ||
              product.id === undefined || product.id === null || product.id === '')) {
            return send(res, 400, { error: 'each product must have an id' }, req);
          }
          const products = body.products.map(product => ({
            id: Number(product.id),
            name: String(product.name || '').trim(),
            price: Number(product.price) || 0,
            image: product.image || null,
            category: product.category || null,
            inStock: product.inStock !== false,
            rating: Number(product.rating) || 0,
            details: product
          }));
          if (products.some(product => !Number.isInteger(product.id) || !product.name)) {
            return send(res, 400, { error: 'products must use numeric ids and names' }, req);
          }
          await dbRequest('products', {
            method: 'POST',
            query: { on_conflict: 'id' },
            prefer: 'resolution=merge-duplicates,return=minimal',
            body: products
          });
          return send(res, 200, { count: products.length }, req);
        }
        const products = await list('products');
        if (req.method === 'GET' && parts.length === 2) return send(res, 200, products, req);
        if (req.method === 'POST' && parts.length === 2) {
          const body = await jsonBody(req);
          if (!validProduct(body)) return send(res, 400, { error: 'name and non-negative price are required' }, req);
          const product = { ...body, id: Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1, price: Number(body.price) };
          return send(res, 201, await insert('products', product), req);
        }
        const id = Number(parts[2]);
        if (!products.some(product => Number(product.id) === id)) return send(res, 404, { error: 'Product not found' }, req);
        if (req.method === 'DELETE' && parts.length === 3) return send(res, 200, await remove('products', id), req);
        if ((req.method === 'PATCH' || req.method === 'PUT') && parts.length === 3) {
          const body = await jsonBody(req);
          if (body.price !== undefined && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) {
            return send(res, 400, { error: 'price must be non-negative' }, req);
          }
          return send(res, 200, await update('products', id, { ...body, id, ...(body.price !== undefined ? { price: Number(body.price) } : {}) }), req);
        }
      }
      if (resource === 'orders' && req.method === 'GET' && parts.length === 2) return send(res, 200, await list('orders'), req);
      if (resource === 'orders' && (req.method === 'PATCH' || req.method === 'PUT') && parts.length === 3) {
        const id = parts[2];
        if (!(await list('orders')).some(order => String(order.id) === id)) return send(res, 404, { error: 'Order not found' }, req);
        const body = await jsonBody(req);
        if (!['received', 'processing', 'shipped', 'delivered', 'cancelled'].includes(body.status)) {
          return send(res, 400, { error: 'Invalid order status' }, req);
        }
        return send(res, 200, await update('orders', id, { status: body.status, updatedAt: new Date().toISOString() }), req);
      }
      if (resource === 'users' && req.method === 'GET' && parts.length === 2) {
        return send(res, 200, (await list('users')).map(publicUser), req);
      }
      return send(res, 404, { error: 'Admin resource not found' }, req);
    }
    return send(res, 404, { error: 'Not found' }, req);
  } catch (error) {
    const status = ['Invalid JSON', 'Payload too large'].includes(error.message) ? 400 : 500;
    return send(res, status, { error: error.message || 'Server error' }, req);
  }
}
