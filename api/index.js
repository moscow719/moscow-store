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
    `Order: #${String(order.id).toUpperCase()}`,
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
    const responseText = await response.text();
    let detail;
    try { detail = JSON.parse(responseText); } catch { detail = null; }
    const error = new Error(detail?.message || `Supabase ${response.status}: ${responseText || response.statusText}`);
    error.status = detail?.code === 'P0001' ? 409 : 500;
    throw error;
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
const getOrderByIdempotencyKey = async key => (await dbRequest('orders', {
  query: { idempotency_key: `eq.${key}`, limit: '1' }
}))[0] || null;
const createOrderTransaction = async order => {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase is not configured');
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/place_order`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(toDb(order))
  });
  if (!response.ok) {
    const responseText = await response.text();
    let detail;
    try { detail = JSON.parse(responseText); } catch { detail = null; }
    const error = new Error(detail?.message || `Supabase ${response.status}: ${responseText || response.statusText}`);
    error.status = detail?.code === 'P0001' ? 409 : 500;
    throw error;
  }
  return fromDb(await response.json());
};
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
        (typeof line.productId !== 'string' && typeof line.productId !== 'number') ||
        String(line.productId).trim().length === 0 || String(line.productId).length > 64 ||
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
    const key = `${String(line.productId)}|${size}|${color}`;
    const previous = variants.get(key);
    const quantity = (previous?.quantity || 0) + line.quantity;
    if (quantity > MAX_ITEM_QUANTITY) return null;
    variants.set(key, { id: String(line.productId).trim(), size, color, quantity });
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
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isFiniteNumberField = value =>
  typeof value === 'number'
    ? Number.isFinite(value)
    : typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
const validProduct = body => isPlainObject(body) &&
  typeof body.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 160 &&
  isFiniteNumberField(body.price) &&
  Number.isFinite(Number(body.price)) && Number(body.price) >= 0 && Number(body.price) <= 9_999_999_999.99 &&
  (body.image === undefined || body.image === null ||
    (typeof body.image === 'string' && body.image.length <= 2048)) &&
  (body.category === undefined || body.category === null ||
    (typeof body.category === 'string' && body.category.length <= 80)) &&
  (body.rating === undefined || (isFiniteNumberField(body.rating) &&
    Number(body.rating) >= 0 && Number(body.rating) <= 5)) &&
  (body.inStock === undefined || typeof body.inStock === 'boolean') &&
  (body.details === undefined || isPlainObject(body.details));
const validStockQuantity = value => value === null || value === '' ||
  ((typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) &&
    Number.isSafeInteger(Number(value)) && Number(value) >= 0);
const validProductUpdate = body => isPlainObject(body) &&
  ['name', 'price', 'image', 'category', 'stockQuantity', 'inStock', 'rating', 'details']
    .some(key => hasOwn(body, key)) &&
  (!hasOwn(body, 'name') || (typeof body.name === 'string' && body.name.trim().length > 0 && body.name.trim().length <= 160)) &&
  (!hasOwn(body, 'price') || (isFiniteNumberField(body.price) &&
    Number(body.price) >= 0 && Number(body.price) <= 9_999_999_999.99)) &&
  (!hasOwn(body, 'image') || body.image === null ||
    (typeof body.image === 'string' && body.image.length <= 2048)) &&
  (!hasOwn(body, 'category') || body.category === null ||
    (typeof body.category === 'string' && body.category.length <= 80)) &&
  (!hasOwn(body, 'stockQuantity') || validStockQuantity(body.stockQuantity)) &&
  (!hasOwn(body, 'inStock') || typeof body.inStock === 'boolean') &&
  (!hasOwn(body, 'rating') || (isFiniteNumberField(body.rating) &&
    Number(body.rating) >= 0 && Number(body.rating) <= 5)) &&
  (!hasOwn(body, 'details') || isPlainObject(body.details));
const normalizeAdminProduct = (body, current = {}) => {
  const stockWasProvided = hasOwn(body, 'stockQuantity');
  const stockQuantity = stockWasProvided
    ? body.stockQuantity === '' || body.stockQuantity === null ? null : Number(body.stockQuantity)
    : current.stockQuantity ?? null;
  const nextProduct = {
    id: current.id,
    name: hasOwn(body, 'name') ? body.name.trim() : current.name,
    price: hasOwn(body, 'price') ? Number(body.price) : Number(current.price),
    image: hasOwn(body, 'image') ? body.image || null : current.image ?? null,
    category: hasOwn(body, 'category') ? body.category || null : current.category ?? null,
    rating: hasOwn(body, 'rating') ? Number(body.rating) : Number(current.rating) || 0,
    inStock: stockWasProvided && stockQuantity !== null
      ? stockQuantity > 0
      : hasOwn(body, 'inStock') ? body.inStock : current.inStock !== false,
    stockQuantity
  };
  const currentDetails = isPlainObject(current.details) ? current.details : {};
  const submittedDetails = isPlainObject(body.details) ? body.details : {};
  const details = {
    ...currentDetails,
    ...submittedDetails,
    name: nextProduct.name,
    price: nextProduct.price,
    image: nextProduct.image,
    category: nextProduct.category,
    rating: nextProduct.rating,
    inStock: nextProduct.inStock,
    stockQuantity: nextProduct.stockQuantity
  };
  return { ...nextProduct, details };
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.end(status === 204 ? '' : JSON.stringify(body));
};

export default async function handler(req, res) {
  const path = new URL(req.url, 'http://vercel.local').pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const parts = path ? path.split('/') : [];
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {}, req);
    if (req.method === 'GET' && path === 'products') return send(res, 200, await list('products'), req);
    if (req.method === 'GET' && parts[0] === 'orders' && parts.length === 2) {
      const orderId = parts[1];
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
        return send(res, 400, { error: 'Enter the full order number shown in your confirmation' }, req);
      }
      const order = await getOrder(orderId);
      if (!order) return send(res, 404, { error: 'Order not found' }, req);
      return send(res, 200, {
        orderId: order.id,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt || null
      }, req);
    }

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

      const existingOrder = await getOrderByIdempotencyKey(idempotencyKey);
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
        p_order_id: crypto.randomUUID(),
        p_idempotency_key: idempotencyKey,
        p_customer: customer,
        p_items: items,
        p_payment_method: paymentMethod,
        p_status: 'received',
        p_created_at: new Date().toISOString(),
        p_subtotal: totals.subtotal,
        p_shipping: totals.shipping,
        p_total: totals.total
      };
      const transaction = await createOrderTransaction(order);
      const savedOrder = transaction.order;
      if (!transaction.created) {
        if (!idempotentOrderMatches(savedOrder, customer, paymentMethod, requestedLines)) {
          return send(res, 409, { error: 'This idempotency key was already used for a different order' }, req);
        }
        return send(res, 200, {
          orderId: savedOrder.id,
          status: savedOrder.status,
          paymentMethod: savedOrder.paymentMethod,
          subtotal: savedOrder.subtotal,
          shipping: savedOrder.shipping,
          total: savedOrder.total,
          duplicate: true
        }, req);
      }
      const notificationOrder = {
        id: savedOrder.id,
        customer,
        items,
        paymentMethod,
        ...totals
      };
      await sendTelegramOrderNotification(notificationOrder);
      return send(res, 201, {
        orderId: savedOrder.id,
        status: savedOrder.status,
        paymentMethod,
        subtotal: savedOrder.subtotal,
        shipping: savedOrder.shipping,
        total: savedOrder.total,
        inventoryTracked: transaction.inventoryTracked
      }, req);
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
          if (body.products.length > 500) return send(res, 400, { error: 'A catalog sync may contain at most 500 products' }, req);
          const ids = new Set();
          for (const product of body.products) {
            if (!isPlainObject(product) ||
                !(typeof product.id === 'number' || (typeof product.id === 'string' && product.id.trim() !== '')) ||
                !Number.isSafeInteger(Number(product.id)) ||
                Number(product.id) < 1 || !validProduct(product) ||
                (product.stockQuantity !== undefined && !validStockQuantity(product.stockQuantity))) {
              return send(res, 400, { error: 'Each synced product requires a valid numeric id, name, price, and stock quantity' }, req);
            }
            if (ids.has(Number(product.id))) return send(res, 400, { error: `Duplicate product id ${product.id} in catalog sync` }, req);
            ids.add(Number(product.id));
          }
          const existingProducts = await list('products');
          const existingById = new Map(existingProducts.map(product => [Number(product.id), product]));
          const products = body.products.map(product => {
            const existing = existingById.get(Number(product.id));
            const stockWasProvided = hasOwn(product, 'stockQuantity');
            const stockQuantity = stockWasProvided
              ? product.stockQuantity === '' || product.stockQuantity === null ? null : Number(product.stockQuantity)
              : existing?.stockQuantity ?? null;
            const inStock = stockQuantity !== null
              ? stockQuantity > 0
              : product.inStock !== false;
            const details = {
              ...(existing && isPlainObject(existing.details) ? existing.details : {}),
              ...product,
              id: product.sourceId ?? product.id,
              sourceId: product.sourceId ?? product.id,
              name: product.name.trim(),
              price: Number(product.price),
              image: product.image || null,
              category: product.category || null,
              inStock,
              stockQuantity
            };
            return {
              id: Number(product.id),
              name: product.name.trim(),
              price: Number(product.price),
              image: product.image || null,
              category: product.category || null,
              inStock,
              rating: product.rating === undefined ? Number(existing?.rating) || 0 : Number(product.rating),
              stockQuantity,
              details
            };
          });
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
          if (body.stockQuantity !== undefined && !validStockQuantity(body.stockQuantity)) {
            return send(res, 400, { error: 'stockQuantity must be a non-negative whole number or empty' }, req);
          }
          const id = Math.max(0, ...products.map(product => Number(product.id) || 0)) + 1;
          const product = normalizeAdminProduct(body);
          product.id = id;
          return send(res, 201, await insert('products', product), req);
        }
        const id = Number(parts[2]);
        if (!Number.isSafeInteger(id) || id < 1) return send(res, 400, { error: 'A valid product id is required' }, req);
        if (!products.some(product => Number(product.id) === id)) return send(res, 404, { error: 'Product not found' }, req);
        if (req.method === 'DELETE' && parts.length === 3) return send(res, 200, await remove('products', id), req);
        if ((req.method === 'PATCH' || req.method === 'PUT') && parts.length === 3) {
          const body = await jsonBody(req);
          if (!validProductUpdate(body)) return send(res, 400, { error: 'Product update contains invalid or unsupported fields' }, req);
          const current = products.find(product => Number(product.id) === id);
          return send(res, 200, await update('products', id, normalizeAdminProduct(body, current)), req);
        }
      }
      if (resource === 'orders' && req.method === 'GET' && parts.length === 2) return send(res, 200, await list('orders'), req);
      if (resource === 'orders' && (req.method === 'PATCH' || req.method === 'PUT') && parts.length === 3) {
        const id = parts[2];
        const order = await getOrder(id);
        if (!order) return send(res, 404, { error: 'Order not found' }, req);
        const body = await jsonBody(req);
        if (!isPlainObject(body) || typeof body.status !== 'string' || !Object.hasOwn(ORDER_STATUSES, body.status)) {
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
    const status = error.status || (['Invalid JSON', 'Payload too large'].includes(error.message) ? 400 : 500);
    return send(res, status, { error: error.message || 'Server error' }, req);
  }
}
