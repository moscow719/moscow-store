const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3001);
const dataDir = path.join(__dirname, 'data');
const ordersFile = path.join(dataDir, 'orders.json');
const usersFile = path.join(dataDir, 'users.json');
const productsFile = path.join(dataDir, 'products.json');
fs.mkdirSync(dataDir, { recursive: true });
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(supabaseUrl && supabaseKey);

const toCamel = key => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const toSnake = key => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const fromDb = value => {
  if (Array.isArray(value)) return value.map(fromDb);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [toCamel(key), fromDb(item)]));
};
const toDb = value => {
  if (Array.isArray(value)) return value.map(toDb);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [toSnake(key), toDb(item)]));
};
const supabaseRequest = async (table, options = {}) => {
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
  return fromDb(await response.json());
};
const db = {
  async list(table, file) {
    return useSupabase ? supabaseRequest(table) : readJson(file);
  },
  async insert(table, file, value) {
    if (useSupabase) {
      const rows = await supabaseRequest(table, { method: 'POST', body: value });
      return rows[0] || value;
    }
    const rows = readJson(file); rows.push(value); writeJson(file, rows); return value;
  },
  async update(table, file, id, value) {
    if (useSupabase) {
      const rows = await supabaseRequest(table, { method: 'PATCH', query: { id: `eq.${id}` }, body: value });
      return rows[0];
    }
    const rows = readJson(file); const index = rows.findIndex(item => String(item.id) === String(id));
    if (index < 0) return undefined;
    rows[index] = { ...rows[index], ...value }; writeJson(file, rows); return rows[index];
  },
  async remove(table, file, id) {
    if (useSupabase) {
      const rows = await supabaseRequest(table, { method: 'DELETE', query: { id: `eq.${id}` } });
      return rows[0];
    }
    const rows = readJson(file); const index = rows.findIndex(item => String(item.id) === String(id));
    if (index < 0) return undefined;
    const [removed] = rows.splice(index, 1); writeJson(file, rows); return removed;
  }
};

const seedProducts = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: ['SUMMER COLLECTION TEE', 'ULTIMATE BERSERK TEE', 'LUFFY - STRAW HAT', 'ZORO ASHU MODE', 'DARK STREET OVERSIZED', 'ANIME VINTAGE TEE', 'SHADOW HUNTER HOODIE', 'TOKYO REVENGE DROP', 'NINJA STREETWEAR', 'CYBERPUNK GRAPHIC TEE'][index],
  price: [700, 750, 750, 680, 800, 720, 1150, 790, 850, 740][index],
  image: `/images/product${index + 1}.jpg`,
  category: index === 6 ? 'HOODIES' : 'T-SHIRTS',
  inStock: index !== 2 && index !== 7,
  rating: [4.5, 5, 4.2, 4.8, 4.6, 4.1, 4.9, 3.9, 4.4, 4.7][index]
}));
for (const [file, initial] of [[ordersFile, []], [usersFile, []], [productsFile, seedProducts]]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initial, null, 2), 'utf8');
}

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
const send = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS'
  });
  res.end(JSON.stringify(body));
};
const readBody = req => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', chunk => {
    raw += chunk;
    if (raw.length > 1_000_000) reject(new Error('Payload too large'));
  });
  req.on('end', () => {
    try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); }
  });
  req.on('error', reject);
});
const publicUser = user => ({ id: user.id, email: user.email, role: user.role || 'customer' });
const adminOnly = (req, res) => {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = req.headers['x-admin-token'] ||
    (String(req.headers.authorization || '').startsWith('Bearer ') ? String(req.headers.authorization).slice(7) : '');
  const suppliedBuffer = Buffer.from(String(supplied));
  const expectedBuffer = Buffer.from(String(expected || ''));
  if (!expected || !supplied || suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    send(res, 401, { error: 'Admin authentication required' });
    return false;
  }
  return true;
};
const hashPassword = password => new Promise((resolve, reject) => {
  const salt = crypto.randomBytes(16);
  crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derived) => {
    if (error) reject(error);
    else resolve(`scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`);
  });
});
const verifyPassword = (password, stored) => new Promise((resolve, reject) => {
  if (typeof stored !== 'string') return resolve(false);
  if (stored.startsWith('scrypt$')) {
    const [, saltText, hashText] = stored.split('$');
    try {
      const salt = Buffer.from(saltText, 'base64url');
      const expected = Buffer.from(hashText, 'base64url');
      return crypto.scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 }, (error, actual) => {
        if (error) reject(error);
        else resolve(actual.length === expected.length && crypto.timingSafeEqual(actual, expected));
      });
    } catch { return resolve(false); }
  }
  // Existing installations used SHA-256. It remains readable only to allow a
  // successful login to transparently upgrade the record to scrypt.
  const legacy = crypto.createHash('sha256').update(password).digest('hex');
  resolve(stored.length === legacy.length && crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(legacy)));
});
const validProduct = body => body && typeof body.name === 'string' && body.name.trim() &&
  Number.isFinite(Number(body.price)) && Number(body.price) >= 0;

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (req.method === 'GET' && url.pathname === '/api/products') return send(res, 200, await db.list('products', productsFile));

    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readBody(req);
      if (!body.customer || !Array.isArray(body.items) || body.items.length === 0) {
        return send(res, 400, { error: 'Customer and order items are required' });
      }
      const paymentMethod = body.paymentMethod || 'cod';
      if (!['cod', 'online'].includes(paymentMethod)) return send(res, 400, { error: 'Unsupported payment method' });
      const order = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'received', paymentMethod };
      await db.insert('orders', ordersFile, order);
      return send(res, 201, { orderId: order.id, status: order.status, paymentMethod });
    }
    if (req.method === 'POST' && url.pathname === '/api/payments/intents') {
      const body = await readBody(req);
      if (!body.orderId) return send(res, 400, { error: 'orderId is required' });
      return send(res, 501, { error: 'Online payment provider is not configured', payment: { status: 'not_configured', orderId: body.orderId } });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readBody(req);
      if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || typeof body.password !== 'string' || body.password.length < 8) {
        return send(res, 400, { error: 'Valid email and password of at least 8 characters are required' });
      }
      const users = await db.list('users', usersFile);
      const email = body.email.toLowerCase();
      if (users.some(user => user.email === email)) return send(res, 409, { error: 'Email already registered' });
      const user = { id: crypto.randomUUID(), email, passwordHash: await hashPassword(body.password), role: 'customer', createdAt: new Date().toISOString() };
      await db.insert('users', usersFile, user);
      return send(res, 201, { user: publicUser(user) });
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readBody(req);
      const users = await db.list('users', usersFile);
      const user = users.find(item => item.email === String(body.email || '').toLowerCase());
      if (!user || !(await verifyPassword(String(body.password || ''), user.passwordHash))) return send(res, 401, { error: 'Invalid email or password' });
      if (!user.passwordHash.startsWith('scrypt$')) {
        user.passwordHash = await hashPassword(String(body.password));
        await db.update('users', usersFile, user.id, { passwordHash: user.passwordHash });
      }
      return send(res, 200, { user: publicUser(user) });
    }

    if (parts[0] === 'api' && parts[1] === 'admin') {
      if (!adminOnly(req, res)) return;
      const resource = parts[2];
      if (resource === 'products') {
        const products = await db.list('products', productsFile);
        if (req.method === 'GET' && parts.length === 3) return send(res, 200, products);
        if (req.method === 'POST' && parts.length === 3) {
          const body = await readBody(req);
          if (!validProduct(body)) return send(res, 400, { error: 'name and non-negative price are required' });
          const product = { ...body, id: Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1, price: Number(body.price) };
          const created = await db.insert('products', productsFile, product); return send(res, 201, created);
        }
        const id = Number(parts[3]); const index = products.findIndex(p => p.id === id);
        if (index < 0) return send(res, 404, { error: 'Product not found' });
        if (req.method === 'DELETE' && parts.length === 4) { const removed = await db.remove('products', productsFile, id); return send(res, 200, removed); }
        if ((req.method === 'PATCH' || req.method === 'PUT') && parts.length === 4) {
          const body = await readBody(req);
          if (body.price !== undefined && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) return send(res, 400, { error: 'price must be non-negative' });
          const updated = await db.update('products', productsFile, id, { ...body, id, ...(body.price !== undefined ? { price: Number(body.price) } : {}) });
          return send(res, 200, updated);
        }
      }
      if (resource === 'orders' && req.method === 'GET' && parts.length === 3) return send(res, 200, await db.list('orders', ordersFile));
      if (resource === 'orders' && (req.method === 'PATCH' || req.method === 'PUT') && parts.length === 4) {
        const orders = await db.list('orders', ordersFile); const order = orders.find(item => String(item.id) === parts[3]);
        if (!order) return send(res, 404, { error: 'Order not found' });
        const body = await readBody(req);
        if (typeof body.status !== 'string' || !['received', 'processing', 'shipped', 'delivered', 'cancelled'].includes(body.status)) return send(res, 400, { error: 'Invalid order status' });
        order.status = body.status; order.updatedAt = new Date().toISOString();
        const updated = await db.update('orders', ordersFile, parts[3], { status: order.status, updatedAt: order.updatedAt });
        return send(res, 200, updated || order);
      }
      if (resource === 'users' && req.method === 'GET' && parts.length === 3) return send(res, 200, (await db.list('users', usersFile)).map(publicUser));
      return send(res, 404, { error: 'Admin resource not found' });
    }
    return send(res, 404, { error: 'Not found' });
  } catch (error) {
    return send(res, error.message === 'Invalid JSON' || error.message === 'Payload too large' ? 400 : 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Moscow API listening on http://localhost:${PORT}`);
  if (useSupabase) {
    console.log('Persistence: Supabase REST');
  } else {
    console.warn('WARNING: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing; using local JSON persistence.');
  }
});
