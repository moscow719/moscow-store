import React, { useCallback, useState } from 'react';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  updateAdminOrder,
  updateAdminProduct
} from '../api';

const emptyProduct = { name: '', price: '', image: '/images/product1.jpg', category: 'T-SHIRTS', stockQuantity: '', inStock: true };
const formatMoney = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
  ? `LE ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : 'Not recorded';
const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};
const nextOrderStatuses = {
  received: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

export default function AdminPanel({ onClose }) {
  const [token, setToken] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [product, setProduct] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadData = useCallback(async (adminToken) => {
    if (!adminToken.trim()) {
      setError('Enter the backend admin token.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [nextProducts, nextOrders, nextUsers] = await Promise.all([
        fetchAdminProducts(adminToken),
        fetchAdminOrders(adminToken),
        fetchAdminUsers(adminToken)
      ]);
      if (![nextProducts, nextOrders, nextUsers].every(Array.isArray)) {
        throw new Error('The admin API returned incomplete dashboard data.');
      }
      setProducts(nextProducts);
      setOrders([...nextOrders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setUsers(nextUsers);
      setAuthenticated(true);
    } catch (requestError) {
      setAuthenticated(false);
      setToken('');
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitProduct = async (event) => {
    event.preventDefault();
    setError('');
    setSavingProduct(true);
    try {
      const price = Number(product.price);
      const stockQuantity = product.stockQuantity === '' ? '' : Number(product.stockQuantity);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Enter a valid non-negative product price.');
      }
      if (stockQuantity !== '' && (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0)) {
        throw new Error('Stock quantity must be a non-negative whole number or left blank.');
      }
      const normalizedProduct = {
        ...product,
        name: String(product.name).trim(),
        price,
        stockQuantity,
        category: String(product.category || '').trim().toUpperCase()
      };
      const saved = editingId
        ? await updateAdminProduct(token, editingId, normalizedProduct)
        : await createAdminProduct(token, normalizedProduct);
      setProducts(prev => editingId ? prev.map(item => item.id === editingId ? saved : item) : [...prev, saved]);
      setProduct(emptyProduct);
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await deleteAdminProduct(token, id);
      setProducts(prev => prev.filter(item => item.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const changeStatus = async (id, status) => {
    setError('');
    setUpdatingOrderId(id);
    try {
      const updated = await updateAdminOrder(token, id, status);
      setOrders(prev => prev.map(order => order.id === id ? updated : order));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const closeAdmin = () => {
    setToken('');
    setAuthenticated(false);
    onClose();
  };

  const logOut = () => {
    setToken('');
    setAuthenticated(false);
    setProducts([]);
    setOrders([]);
    setUsers([]);
    setExpandedOrderId(null);
    setError('');
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
        <form onSubmit={(event) => { event.preventDefault(); void loadData(token); }} className="w-full max-w-md bg-[#0d0617] border border-purple-900 rounded-xl p-6 space-y-4 shadow-2xl">
          <div className="flex justify-between items-center">
            <h2 id="admin-login-title" className="text-xl font-black text-white">{loading ? 'Verifying Admin Access' : 'Admin Sign-in'}</h2>
            <button type="button" onClick={closeAdmin} className="text-gray-400 hover:text-white" aria-label="Close admin sign-in">×</button>
          </div>
          <p className="text-xs text-gray-400">Use the admin token configured on the backend. It is held only for this open dashboard.</p>
          <label htmlFor="admin-token" className="sr-only">Admin token</label>
          <input id="admin-token" type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Admin token" autoComplete="off" spellCheck="false" className="w-full bg-black border border-purple-900 rounded px-3 py-3 text-white outline-none focus:border-purple-500" required disabled={loading} />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white py-3 rounded font-bold">{loading ? 'Checking...' : 'Open Dashboard'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black overflow-y-auto text-white">
      <div className="sticky top-0 z-10 bg-[#0d0617] border-b border-purple-900 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-black tracking-widest">MOSCOW ADMIN</h1>
          <p className="text-[10px] text-gray-500 mt-1">Protected dashboard · stock, orders and customer data</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => void loadData(token)} disabled={loading} className="text-xs text-purple-300 disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh'}</button>
          <button onClick={logOut} className="text-xs text-red-300">Log out</button>
          <button onClick={closeAdmin} className="bg-white text-black px-3 py-1 rounded text-xs font-bold">Close ×</button>
        </div>
      </div>
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {error && <p className="bg-red-950/50 border border-red-700 text-red-300 p-3 rounded text-sm" role="alert">{error}</p>}
        <section>
          <h2 className="text-lg font-black mb-4">Inventory ({products.length} products)</h2>
          <p className="text-xs text-gray-400 mb-4">Set stock to 0 to mark sold out; leave the quantity blank when you do not track inventory.</p>
          <form onSubmit={submitProduct} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-5 bg-[#0d0617] border border-purple-950 rounded-lg p-4">
            <label className="text-[10px] text-gray-400">Product name
              <input value={product.name} onChange={event => setProduct({ ...product, name: event.target.value })} placeholder="Name" className="admin-input mt-1 w-full" required maxLength={160} />
            </label>
            <label className="text-[10px] text-gray-400">Unit price (LE)
              <input type="number" min="0" step="0.01" value={product.price} onChange={event => setProduct({ ...product, price: event.target.value })} placeholder="Price" className="admin-input mt-1 w-full" required />
            </label>
            <label className="text-[10px] text-gray-400">Stock quantity
              <input type="number" min="0" step="1" value={product.stockQuantity ?? ''} onChange={event => setProduct({ ...product, stockQuantity: event.target.value })} placeholder="Blank = untracked" className="admin-input mt-1 w-full" />
            </label>
            <label className="text-[10px] text-gray-400">Image path
              <input value={product.image || ''} onChange={event => setProduct({ ...product, image: event.target.value })} placeholder="/images/product.jpg" className="admin-input mt-1 w-full" maxLength={500} />
            </label>
            <label className="text-[10px] text-gray-400">Category
              <input value={product.category || ''} onChange={event => setProduct({ ...product, category: event.target.value })} placeholder="Category" className="admin-input mt-1 w-full" maxLength={80} />
            </label>
            <div className="flex gap-2 items-end">
              <button disabled={savingProduct} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded px-3 py-2 text-sm font-bold">{savingProduct ? 'Saving…' : editingId ? 'Save Product' : 'Add Product'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setProduct(emptyProduct); }} className="border border-purple-800 rounded px-3 py-2 text-xs">Cancel</button>}
            </div>
          </form>
          <div className="overflow-x-auto border border-purple-950 rounded">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#0d0617] text-[10px] uppercase tracking-wider text-gray-400">
                <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Category</th><th className="p-3">Stock</th><th className="p-3">Availability</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {products.map(item => {
                  const trackedStock = Number.isInteger(item.stockQuantity) && item.stockQuantity >= 0;
                  const soldOut = item.inStock === false || (trackedStock && item.stockQuantity === 0);
                  return (
                    <tr key={item.id} className="border-t border-purple-950">
                      <td className="p-3 font-semibold">{item.name}</td>
                      <td className="p-3">{formatMoney(item.price)}</td>
                      <td className="p-3">{item.category || '—'}</td>
                      <td className="p-3">{trackedStock ? item.stockQuantity : 'Untracked'}</td>
                      <td className="p-3"><span className={soldOut ? 'text-red-300' : 'text-green-300'}>{soldOut ? 'Out of stock' : 'Available'}</span></td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button type="button" onClick={() => { setEditingId(item.id); setProduct({ ...item, stockQuantity: item.stockQuantity ?? '', inStock: item.inStock !== false }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-purple-300 mr-3">Edit</button>
                        <button type="button" onClick={() => void removeProduct(item.id)} className="text-red-400">Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-500">No products found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div><h2 className="text-lg font-black">Orders ({orders.length})</h2><p className="text-xs text-gray-500 mt-1">Newest orders appear first. Expand an order for customer and payment details.</p></div>
          </div>
          <div className="space-y-3">
            {orders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const customer = order.customer && typeof order.customer === 'object' ? order.customer : {};
              const items = Array.isArray(order.items) ? order.items : [];
              const calculatedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
              const subtotal = order.subtotal !== null && order.subtotal !== undefined && order.subtotal !== '' &&
                Number.isFinite(Number(order.subtotal)) ? Number(order.subtotal) : calculatedSubtotal;
              const shipping = order.shipping !== null && order.shipping !== undefined && order.shipping !== '' &&
                Number.isFinite(Number(order.shipping)) ? Number(order.shipping) : null;
              const total = order.total !== null && order.total !== undefined && order.total !== '' &&
                Number.isFinite(Number(order.total)) ? Number(order.total) : null;
              const allowedStatuses = nextOrderStatuses[order.status] || [];
              return (
                <article key={order.id} className="border border-purple-950 rounded-lg bg-[#0b0613] overflow-hidden">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <button type="button" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} aria-expanded={isExpanded} className="text-left min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white">{customer.fullName || 'Customer'} <span className="text-gray-500 font-normal">· {String(order.id || '').slice(0, 8)}</span></span>
                      <span className="block text-xs text-gray-400 mt-1">{formatDate(order.createdAt)} · {items.length} item(s) · {formatMoney(total)}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${order.status === 'cancelled' ? 'border-red-800 text-red-300' : order.status === 'delivered' ? 'border-green-800 text-green-300' : 'border-purple-800 text-purple-300'}`}>{order.status || 'Unknown'}</span>
                      <label className="sr-only" htmlFor={`order-status-${order.id}`}>Update order status</label>
                      <select id={`order-status-${order.id}`} value={order.status || ''} onChange={event => void changeStatus(order.id, event.target.value)} disabled={updatingOrderId === order.id || allowedStatuses.length === 0} className="bg-black border border-purple-800 rounded px-2 py-2 text-xs disabled:opacity-50">
                        <option value={order.status}>{updatingOrderId === order.id ? 'Updating…' : order.status || 'Unknown'}</option>
                        {allowedStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-purple-950 p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                      <section className="space-y-2">
                        <h3 className="text-xs uppercase tracking-wider text-purple-300 font-bold">Customer details</h3>
                        <p><span className="text-gray-500">Name:</span> {customer.fullName || 'Not recorded'}</p>
                        <p><span className="text-gray-500">Phone:</span> {customer.phone ? <a className="text-purple-300 underline" href={`tel:${encodeURIComponent(customer.phone)}`}>{customer.phone}</a> : 'Not recorded'}</p>
                        <p><span className="text-gray-500">Address:</span> {[customer.address, customer.city].filter(Boolean).join(', ') || 'Not recorded'}</p>
                        {customer.notes && <p><span className="text-gray-500">Notes:</span> {customer.notes}</p>}
                        <p><span className="text-gray-500">Order ID:</span> <bdi className="break-all">{order.id}</bdi></p>
                      </section>
                      <section className="space-y-2">
                        <h3 className="text-xs uppercase tracking-wider text-purple-300 font-bold">Payment & totals</h3>
                        <p><span className="text-gray-500">Payment:</span> {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod || 'Not recorded'}</p>
                        <p><span className="text-gray-500">Subtotal:</span> {formatMoney(subtotal)}</p>
                        <p><span className="text-gray-500">Shipping:</span> {shipping === null ? 'Not recorded' : formatMoney(shipping)}</p>
                        <p className="font-bold"><span className="text-gray-500">Total:</span> {total === null ? 'Not recorded' : formatMoney(total)}</p>
                        <p><span className="text-gray-500">Last updated:</span> {order.updatedAt ? formatDate(order.updatedAt) : 'Not recorded'}</p>
                      </section>
                      <section className="lg:col-span-2">
                        <h3 className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">Order items</h3>
                        <div className="divide-y divide-purple-950 border-y border-purple-950">
                          {items.map((item, index) => (
                            <div key={`${item.productId || item.id || item.name}-${index}`} className="py-3 flex flex-wrap justify-between gap-2 text-xs">
                              <span>{item.name || 'Product'}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''} × {item.quantity || 0}</span>
                              <span className="text-purple-300">{formatMoney((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
                            </div>
                          ))}
                          {items.length === 0 && <p className="py-3 text-xs text-gray-500">No item details recorded for this order.</p>}
                        </div>
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
            {orders.length === 0 && <p className="border border-purple-950 rounded p-6 text-center text-sm text-gray-500">No orders found.</p>}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-black mb-4">Users ({users.length})</h2>
          <div className="space-y-2">{users.map(user => <div key={user.id} className="border border-purple-950 rounded p-3 text-sm">{user.email} <span className="text-gray-500">· {user.role}</span></div>)}</div>
        </section>
        {loading && <p className="text-purple-300" role="status">Loading dashboard data…</p>}
      </main>
    </div>
  );
}
