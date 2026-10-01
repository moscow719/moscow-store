import crypto from 'node:crypto';

const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORDER_STATUSES = {
  received: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};
const MAX_ORDER_LINES = 50;
const MAX_ITEM_QUANTITY = 99;
const SHIPPING_FEE_CENTS = 6000;
const FREE_SHIPPING_THRESHOLD_CENTS = 150000;

const sendTelegramOrderNotification = async order => {
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN || '');
  const chatId = String(process.env.TELEGRAM_CHAT_ID || '');
  if (!botToken || !chatId) return;

  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const itemLines = items.map(item => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return `- ${item.name || 'Product'} x${quantity} — ${price * quantity} LE`;
  });
  const message = [
    '🛍️ New MOSCOW order',
    `Order: #${String(order.id).slice(0, 8).toUpperCase()}`,
    `Customer: ${customer.fullName || 'N/A'}`,
    `Phone: ${customer.phone || 'N/A'}`,
    `Address: ${[customer.address, customer.city].filter(Boolean).join(', ') || 'N/A'}`,
    `Payment: ${order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online'}`,
    `Subtotal: ${Number(order.subtotal) || 0} LE`,
    `Shipping: ${Number(order.shipping) || 0} LE`,
    `Total: ${Number(order.total) || 0} LE`,
    '',
    'Items:',
    ...(itemLines.length ? itemLines : ['- N/A'])
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Telegram order notification failed:', detail || response.statusText);
    }
  } catch (error) {
    console.error('Telegram order notification failed:', error.message);
  }
};

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
const getOrder = async id => (await dbRequest('orders', { query: { id: `eq.${id}`, limit: '1' } }))[0] || null;
const updateOrderStatus = async (id, currentStatus, status) => (await dbRequest('orders', {
  method: 'PATCH',
  query: { id: `eq.${id}`, status: `eq.${currentStatus}` },
  body: { status, updatedAt: new Date().toISOString() }
}))[0] || null;
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
const normalizeCustomer = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const fields = ['fullName', 'phone', 'address', 'city'];
  const customer = Object.fromEntries(fields.map(field => [
    field,
    typeof value[field] === 'string' ? value[field].trim() : ''
  ]));
  customer.notes = typeof value.notes === 'string' ? value.notes.trim() : '';
  const hasControlCharacters = (text, allowLineBreaks = false) => [...text].some(character => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && !(allowLineBreaks && (code === 9 || code === 10)));
  });
  if (customer.fullName.length < 3 || customer.fullName.length > 100 ||
      hasControlCharacters(customer.fullName)) return null;
  if (!/^01[0125]\d{8}$/.test(customer.phone)) return null;
  if (customer.address.length < 5 || customer.address.length > 300 ||
      hasControlCharacters(customer.address)) return null;
  if (customer.city.length < 2 || customer.city.length > 100 ||
      hasControlCharacters(customer.city)) return null;
  if (customer.notes.length > 500 || hasControlCharacters(customer.notes, true)) return null;
  return customer;
};
const normalizeOrderLines = value => {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ORDER_LINES) return null;
  const variants = new Map();
  for (const line of value) {
    if (!line || typeof line !== 'object' || Array.isArray(line) ||
        (typeof line.id !== 'string' && typeof line.id !== 'number') ||
        String(line.id).trim().length === 0 || String(line.id).length > 64 ||
        !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_ITEM_QUANTITY) {
      return null;
    }
    const size = line.size === undefined || line.size === null ? '' : String(line.size).trim().toUpperCase();
    const color = line.color === undefined || line.color === null ? '' : String(line.color).trim();
    if (size.length > 20 || (size && !/^(XS|S|M|L|XL|XXL|XXXL|ONE SIZE)$/.test(size))) return null;
    if (color.length > 32 || [...color].some(character => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })) return null;
    const key = `${String(line.id)}|${size}|${color}`;
    const previous = variants.get(key);
    const quantity = (previous?.quantity || 0) + line.quantity;
    if (quantity > MAX_ITEM_QUANTITY) return null;
    variants.set(key, { id: String(line.id).trim(), size, color, quantity });
  }
  return [...variants.values()];
};
const idempotentOrderMatches = (order, customer, paymentMethod, lines) => {
  const savedCustomer = normalizeCustomer(order?.customer);
  if (!order || order.paymentMethod !== paymentMethod ||
      JSON.stringify(savedCustomer) !== JSON.stringify(customer) ||
      !Array.isArray(order.items)) return false;
  const savedLines = order.items.map(item => ({
    id: String(item.clientProductId ?? item.id ?? item.productId ?? ''),
    size: String(item.size || '').toUpperCase(),
    color: String(item.color || ''),
    quantity: Number(item.quantity)
  })).sort((a, b) => `${a.id}|${a.size}|${a.color}`.localeCompare(`${b.id}|${b.size}|${b.color}`));
  const requestedLines = [...lines].sort((a, b) => `${a.id}|${a.size}|${a.color}`.localeCompare(`${b.id}|${b.size}|${b.color}`));
  return JSON.stringify(savedLines) === JSON.stringify(requestedLines);
};
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

const send = (res, status, body, _req) => {
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
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return send(res, 400, { error: 'A valid order payload is required' }, req);
      }
      const customer = normalizeCustomer(body.customer);
      if (!customer) return send(res, 400, { error: 'Enter a valid name, Egyptian phone number, address, city, and optional notes' }, req);
      const requestedLines = normalizeOrderLines(body.items);
      if (!requestedLines) return send(res, 400, { error: 'Order items must contain valid product ids and quantities (1–99, up to 50 lines)' }, req);
      const paymentMethod = body.paymentMethod || 'cod';
      if (!['cod', 'online'].includes(paymentMethod)) return send(res, 400, { error: 'Unsupported payment method' }, req);
      const idempotencyKey = String(body.idempotencyKey || req.headers['idempotency-key'] || '');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
        return send(res, 400, { error: 'A valid idempotency key is required' }, req);
      }

      const existingOrder = await getOrder(idempotencyKey);
      if (existingOrder) {
        if (!idempotentOrderMatches(existingOrder, customer, paymentMethod, requestedLines)) {
          return send(res, 409, { error: 'This idempotency key was already used for a different order' }, req);
        }
        const subtotalCents = existingOrder.items.reduce((sum, item) =>
          sum + Math.round(Number(item.price) * 100) * Number(item.quantity), 0);
        const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
          ? 0
          : SHIPPING_FEE_CENTS;
        return send(res, 200, {
          orderId: existingOrder.id,
          status: existingOrder.status,
          paymentMethod: existingOrder.paymentMethod,
          subtotal: subtotalCents / 100,
          shipping: shippingCents / 100,
          total: (subtotalCents + shippingCents) / 100,
          duplicate: true
        }, req);
      }

      const catalog = await list('products');
      const items = [];
      let subtotalCents = 0;
      for (const line of requestedLines) {
        const idMatches = catalog.filter(product => {
          const details = product.details && typeof product.details === 'object' ? product.details : {};
          return [product.id, product.sourceId, details.id, details.sourceId]
            .some(id => id !== undefined && id !== null && String(id) === line.id);
        });
        let product = idMatches.find(candidate => String(candidate.id) === line.id) || idMatches[0];
        if (!product && typeof body.items.find(item => String(item.id) === line.id)?.name === 'string') {
          const requestedName = body.items.find(item => String(item.id) === line.id).name.trim().toLowerCase();
          const nameMatches = catalog.filter(candidate => {
            const details = candidate.details && typeof candidate.details === 'object' ? candidate.details : {};
            return String(candidate.name || details.name || '').trim().toLowerCase() === requestedName;
          }).sort((a, b) => Number(a.id) - Number(b.id));
          product = nameMatches.find(candidate => candidate.inStock === true) || nameMatches[0];
        }
        if (!product) return send(res, 404, { error: `Product ${line.id} is not available in the catalog` }, req);
        if (product.inStock !== true) return send(res, 409, { error: `${product.name} is currently out of stock` }, req);
        if (Number.isInteger(product.stockQuantity) && line.quantity > product.stockQuantity) {
          return send(res, 409, { error: `Only ${product.stockQuantity} unit(s) of ${product.name} are available` }, req);
        }

        const details = product.details && typeof product.details === 'object' ? product.details : {};
        if (line.color && Array.isArray(details.availableColors) &&
            !details.availableColors.some(color => String(color).toLowerCase() === line.color.toLowerCase()) &&
            String(details.color || '').toLowerCase() !== line.color.toLowerCase()) {
          return send(res, 400, { error: `The selected color is not available for ${product.name}` }, req);
        }
        const unitPriceCents = Math.round(Number(product.price) * 100);
        if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
          throw new Error(`Invalid catalog price for product ${product.id}`);
        }
        const lineTotalCents = unitPriceCents * line.quantity;
        subtotalCents += lineTotalCents;
        if (!Number.isSafeInteger(subtotalCents)) return send(res, 400, { error: 'Order total is too large' }, req);
        items.push({
          id: line.id,
          clientProductId: line.id,
          productId: product.id,
          name: String(product.name || details.name),
          image: product.image || details.image || null,
          price: unitPriceCents / 100,
          quantity: line.quantity,
          ...(line.size ? { size: line.size } : {}),
          ...(line.color ? { color: line.color } : {})
        });
      }

      const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : SHIPPING_FEE_CENTS;
      const totals = {
        subtotal: subtotalCents / 100,
        shipping: shippingCents / 100,
        total: (subtotalCents + shippingCents) / 100
      };
      const order = {
        id: idempotencyKey,
        customer,
        items,
        paymentMethod,
        status: 'received',
        createdAt: new Date().toISOString()
      };
      try {
        await insert('orders', order);
      } catch (error) {
        const concurrentOrder = await getOrder(idempotencyKey);
        if (!concurrentOrder) throw error;
        if (!idempotentOrderMatches(concurrentOrder, customer, paymentMethod, requestedLines)) {
          return send(res, 409, { error: 'This idempotency key was already used for a different order' }, req);
        }
        const subtotalCents = concurrentOrder.items.reduce((sum, item) =>
          sum + Math.round(Number(item.price) * 100) * Number(item.quantity), 0);
        const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
          ? 0
          : SHIPPING_FEE_CENTS;
        return send(res, 200, {
          orderId: concurrentOrder.id,
          status: concurrentOrder.status,
          paymentMethod: concurrentOrder.paymentMethod,
          subtotal: subtotalCents / 100,
          shipping: shippingCents / 100,
          total: (subtotalCents + shippingCents) / 100,
          duplicate: true
        }, req);
      }
      await sendTelegramOrderNotification({
        ...order,
        ...totals
      });
      return send(res, 201, { orderId: order.id, status: order.status, paymentMethod, ...totals }, req);
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
        const order = await getOrder(id);
        if (!order) return send(res, 404, { error: 'Order not found' }, req);
        const body = await jsonBody(req);
        if (!Object.hasOwn(ORDER_STATUSES, body.status)) {
          return send(res, 400, { error: 'Invalid order status' }, req);
        }
        if (body.status === order.status) return send(res, 200, order, req);
        if (!ORDER_STATUSES[order.status]?.includes(body.status)) {
          return send(res, 409, { error: `Order cannot transition from ${order.status} to ${body.status}` }, req);
        }
        const updatedOrder = await updateOrderStatus(id, order.status, body.status);
        if (updatedOrder) return send(res, 200, updatedOrder, req);
        const latestOrder = await getOrder(id);
        return send(res, 409, { error: `Order status changed concurrently${latestOrder ? ` to ${latestOrder.status}` : ''}` }, req);
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
