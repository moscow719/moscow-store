import React, { useEffect, useState } from 'react';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  updateAdminOrder,
  updateAdminProduct
} from '../api';

const emptyProduct = { name: '', price: '', image: '/images/product1.jpg', category: 'T-SHIRTS', inStock: true };

export default function AdminPanel({ onClose }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('moscow-admin-token') || '');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [product, setProduct] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const loadData = async (adminToken = token) => {
    setLoading(true);
    setError('');
    try {
      const [nextProducts, nextOrders, nextUsers] = await Promise.all([
        fetchAdminProducts(adminToken),
        fetchAdminOrders(adminToken),
        fetchAdminUsers(adminToken)
      ]);
      sessionStorage.setItem('moscow-admin-token', adminToken);
      setProducts(nextProducts);
      setOrders(nextOrders);
      setUsers(nextUsers);
      setAuthenticated(true);
    } catch (requestError) {
      setAuthenticated(false);
      sessionStorage.removeItem('moscow-admin-token');
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData(token);
  }, []);

  const submitProduct = async (event) => {
    event.preventDefault();
    try {
      const saved = editingId
        ? await updateAdminProduct(token, editingId, product)
        : await createAdminProduct(token, product);
      setProducts(prev => editingId ? prev.map(item => item.id === editingId ? saved : item) : [...prev, saved]);
      setProduct(emptyProduct);
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteAdminProduct(token, id);
      setProducts(prev => prev.filter(item => item.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      const updated = await updateAdminOrder(token, id, status);
      setOrders(prev => prev.map(order => order.id === id ? updated : order));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-6">
        <form onSubmit={(event) => { event.preventDefault(); setError(''); loadData(token); }} className="w-full max-w-md bg-[#0d0617] border border-purple-900 rounded-xl p-6 space-y-4">
          <div className="flex justify-between"><h2 className="text-xl font-black text-white">{loading ? 'Checking Admin Access' : 'Admin Login'}</h2><button type="button" onClick={onClose} className="text-gray-400">×</button></div>
          <p className="text-xs text-gray-400">Enter the ADMIN_TOKEN configured on the backend.</p>
          <input type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="Admin token" className="w-full bg-black border border-purple-900 rounded px-3 py-3 text-white" required disabled={loading} />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white py-3 rounded font-bold">{loading ? 'Checking...' : 'Open Dashboard'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black overflow-y-auto text-white">
      <div className="sticky top-0 z-10 bg-[#0d0617] border-b border-purple-900 px-6 py-4 flex justify-between items-center">
        <h1 className="font-black tracking-widest">MOSCOW ADMIN</h1>
        <div className="flex gap-3"><button onClick={() => loadData()} className="text-xs text-purple-300">Refresh</button><button onClick={onClose} className="bg-white text-black px-3 py-1 rounded text-xs font-bold">Close ×</button></div>
      </div>
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {error && <p className="bg-red-950/50 border border-red-700 text-red-300 p-3 rounded text-sm">{error}</p>}
        <section>
          <h2 className="text-lg font-black mb-4">Products ({products.length})</h2>
          <form onSubmit={submitProduct} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
            <input value={product.name} onChange={event => setProduct({ ...product, name: event.target.value })} placeholder="Name" className="admin-input" required />
            <input type="number" min="0" value={product.price} onChange={event => setProduct({ ...product, price: event.target.value })} placeholder="Price" className="admin-input" required />
            <input value={product.image} onChange={event => setProduct({ ...product, image: event.target.value })} placeholder="Image path" className="admin-input" />
            <input value={product.category} onChange={event => setProduct({ ...product, category: event.target.value })} placeholder="Category" className="admin-input" />
            <button className="bg-purple-600 rounded px-3 py-2 font-bold">{editingId ? 'Save Product' : 'Add Product'}</button>
          </form>
          <div className="overflow-x-auto border border-purple-950 rounded"><table className="w-full text-left text-sm"><tbody>{products.map(item => <tr key={item.id} className="border-b border-purple-950"><td className="p-3">{item.name}</td><td className="p-3">LE {item.price}</td><td className="p-3">{item.category}</td><td className="p-3 text-right"><button onClick={() => { setEditingId(item.id); setProduct({ ...item }); }} className="text-purple-300 mr-3">Edit</button><button onClick={() => removeProduct(item.id)} className="text-red-400">Delete</button></td></tr>)}</tbody></table></div>
        </section>
        <section><h2 className="text-lg font-black mb-4">Orders ({orders.length})</h2><div className="space-y-2">{orders.map(order => <div key={order.id} className="border border-purple-950 rounded p-3 flex flex-wrap gap-3 items-center justify-between text-sm"><span>{order.id.slice(0, 8)} · {order.customer?.fullName || 'Customer'}</span><select value={order.status} onChange={event => changeStatus(order.id, event.target.value)} className="bg-black border border-purple-800 rounded px-2 py-1"><option value="received">Received</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>)}</div></section>
        <section><h2 className="text-lg font-black mb-4">Users ({users.length})</h2><div className="space-y-2">{users.map(user => <div key={user.id} className="border border-purple-950 rounded p-3 text-sm">{user.email} <span className="text-gray-500">· {user.role}</span></div>)}</div></section>
        {loading && <p className="text-purple-300">Loading...</p>}
      </main>
    </div>
  );
}
