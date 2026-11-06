import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminUsers,
  updateAdminOrder,
  updateAdminProduct
} from '../api';
import './AdminPanel.css';

const emptyProduct = {
  name: '',
  price: '',
  image: '/images/product1.jpg',
  category: 'T-SHIRTS',
  stockQuantity: '',
  inStock: true
};

const orderStatuses = ['received', 'processing', 'shipped', 'delivered', 'cancelled'];
const nextOrderStatuses = {
  received: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};
const statusLabels = {
  received: 'جديد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'مكتمل',
  cancelled: 'ملغي'
};
const periods = [
  { value: '1', label: 'يوم' },
  { value: '7', label: '7 أيام' },
  { value: '30', label: '30 يوم' },
  { value: 'all', label: 'الكل' }
];

const formatMoney = value => {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
    return 'غير مسجل';
  }
  return `${Number(value).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م.`;
};

const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'تاريخ غير متاح'
    : date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
};

const getOrderItems = order => Array.isArray(order?.items) ? order.items : [];
const getOrderTotal = order => {
  if (order?.total !== null && order?.total !== undefined && order.total !== '' && Number.isFinite(Number(order.total))) {
    return Number(order.total);
  }
  const itemsTotal = getOrderItems(order).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const shipping = Number(order?.shipping);
  return itemsTotal + (Number.isFinite(shipping) ? shipping : 0);
};

const statusClass = status => ({
  received: 'admin-status-new',
  processing: 'admin-status-processing',
  shipped: 'admin-status-shipped',
  delivered: 'admin-status-delivered',
  cancelled: 'admin-status-cancelled'
}[status] || 'admin-status-muted');

const categoryLabel = value => {
  const category = String(value || '').trim().toUpperCase();
  return ({
    'T-SHIRTS': 'تيشيرتات',
    HOODIES: 'هوديز',
    JACKETS: 'جاكيتات',
    PANTS: 'بناطيل',
    CAPS: 'كابات'
  }[category] || category || 'بدون تصنيف');
};

const errorMessage = error => {
  const message = error instanceof Error ? error.message : '';
  const known = {
    'Invalid email or password': 'رمز دخول الأدمن غير صحيح.',
    'Admin authentication required': 'انتهت صلاحية الدخول. سجّل الدخول مرة أخرى.',
    'Product not found': 'المنتج لم يعد موجودًا.',
    'Order not found': 'الطلب غير موجود.',
    'Enter the backend admin token.': 'أدخل رمز دخول الأدمن.',
    'Enter a valid non-negative product price.': 'أدخل سعرًا صحيحًا، صفر أو أكثر.',
    'Product name is required.': 'اسم المنتج مطلوب.',
    'Stock quantity must be a non-negative whole number or left blank.': 'الكمية يجب أن تكون رقمًا صحيحًا موجبًا أو اتركها فارغة.',
    'The admin API returned incomplete dashboard data.': 'وصلت بيانات غير مكتملة من الخادم. حدّث الصفحة أو حاول مرة أخرى.'
  };
  return known[message] || `تعذر إتمام العملية${message ? `: ${message}` : '. حاول مرة أخرى.'}`;
};

function Icon({ children }) {
  return <span className="admin-icon" aria-hidden="true">{children}</span>;
}

function KpiCard({ label, value, icon, tone }) {
  return (
    <article className="admin-kpi">
      <div className={`admin-kpi-icon ${tone}`}><Icon>{icon}</Icon></div>
      <div className="admin-kpi-copy">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function Toast({ toast, onUndo, onDismiss }) {
  if (!toast) return null;
  return (
    <div className={`admin-toast ${toast.type === 'error' ? 'is-error' : 'is-success'}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <span>{toast.message}</span>
      {toast.undo && <button type="button" onClick={onUndo}>تراجع</button>}
      <button type="button" className="admin-toast-close" onClick={onDismiss} aria-label="إغلاق التنبيه">×</button>
    </div>
  );
}

function ConfirmInline({ count, onConfirm, onCancel, busy = false }) {
  return (
    <div className="admin-confirm" role="group" aria-label="تأكيد الحذف">
      <span>حذف {count === 1 ? 'المنتج؟' : `${count} منتجات؟`}</span>
      <button type="button" className="admin-button danger small" onClick={onConfirm} disabled={busy}>
        {busy ? 'جارٍ الحذف…' : 'حذف'}
      </button>
      <button type="button" className="admin-button secondary small" onClick={onCancel} disabled={busy}>إلغاء</button>
    </div>
  );
}

function BulkBar({ children, count, onClear, className = '' }) {
  if (!count) return null;
  return (
    <div className={`admin-bulkbar ${className}`}>
      <strong>محدد {count}</strong>
      <div className="admin-bulk-actions">{children}</div>
      <button type="button" className="admin-button quiet small" onClick={onClear}>إلغاء التحديد</button>
    </div>
  );
}

function ProductRow({ item, selected, onSelect, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete, deleting }) {
  const tracked = Number.isInteger(item.stockQuantity) && item.stockQuantity >= 0;
  const soldOut = item.inStock === false || (tracked && item.stockQuantity === 0);
  const lowStock = tracked && item.stockQuantity > 0 && item.stockQuantity <= 5;
  return (
    <article className={`admin-product-row ${selected ? 'is-selected' : ''}`}>
      <label className="admin-check-cell">
        <input type="checkbox" checked={selected} onChange={event => onSelect(item.id, event.target.checked)} aria-label={`تحديد ${item.name}`} />
      </label>
      <div className="admin-product-image">
        {item.image ? <img src={item.image} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Icon>▧</Icon>}
      </div>
      <div className="admin-product-name">
        <strong>{item.name || 'منتج بدون اسم'}</strong>
        <span className="admin-mobile-meta">{categoryLabel(item.category)}</span>
      </div>
      <div className="admin-category-cell">{categoryLabel(item.category)}</div>
      <div className="admin-stock-cell">
        <span className={`admin-stock ${soldOut ? 'is-out' : lowStock ? 'is-low' : tracked ? 'is-good' : 'is-untracked'}`}>
          {soldOut ? 'نفد' : !tracked ? 'غير متتبع' : lowStock ? `كمية قليلة · ${item.stockQuantity}` : item.stockQuantity}
        </span>
      </div>
      <div className="admin-price-cell">{formatMoney(item.price)}</div>
      <div className="admin-sales-cell">{Number(item.salesCount) > 0 ? `${item.salesCount} مبيع` : '—'}</div>
      <div className="admin-row-actions">
        {confirmDelete ? (
          <ConfirmInline
            count={1}
            onConfirm={() => onConfirmDelete(item)}
            onCancel={onCancelDelete}
            busy={deleting}
          />
        ) : (
          <>
            <button type="button" className="admin-button quiet small" onClick={() => onEdit(item)}>تعديل</button>
            <button type="button" className="admin-button danger-quiet small" onClick={() => onDelete(item)} disabled={deleting}>حذف</button>
          </>
        )}
      </div>
    </article>
  );
}

function OrderRow({ order, selected, onSelect, expanded, onToggle, onStatusChange, updating }) {
  const customer = order.customer && typeof order.customer === 'object' ? order.customer : {};
  const items = getOrderItems(order);
  const allowedStatuses = nextOrderStatuses[order.status] || [];
  const id = String(order.id || '');
  const platform = String(order.platform || order.channel || '').trim();
  return (
    <article className={`admin-order-card ${selected ? 'is-selected' : ''}`}>
      <div className="admin-order-row">
        <label className="admin-check-cell">
          <input type="checkbox" checked={selected} onChange={event => onSelect(id, event.target.checked)} aria-label={`تحديد الطلب ${id.slice(0, 8)}`} />
        </label>
        <button type="button" className="admin-order-summary" onClick={onToggle} aria-expanded={expanded}>
          <strong><bdi>#{id.slice(0, 8)}</bdi> <span>{customer.fullName || 'عميل'}</span></strong>
          <span className="admin-order-mobile-meta">{formatDate(order.createdAt)} · {items.length} منتجات</span>
        </button>
        <span className="admin-platform-tag">{platform || 'الموقع'}</span>
        <span className="admin-order-date">{formatDate(order.createdAt)}</span>
        <span className="admin-order-items">{items.length} منتجات</span>
        <strong className="admin-order-total">{formatMoney(getOrderTotal(order))}</strong>
        <span className={`admin-status ${statusClass(order.status)}`}>{statusLabels[order.status] || 'غير معروف'}</span>
        <label className="sr-only" htmlFor={`order-status-${id}`}>تحديث حالة الطلب</label>
        <select
          id={`order-status-${id}`}
          value={order.status || ''}
          disabled={updating || allowedStatuses.length === 0}
          onChange={event => onStatusChange(id, event.target.value)}
          className="admin-select admin-order-status-select"
        >
          <option value={order.status}>{updating ? 'جارٍ التحديث…' : statusLabels[order.status] || 'الحالة'}</option>
          {allowedStatuses.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
      </div>
      {expanded && (
        <div className="admin-order-details">
          <section>
            <h3>بيانات العميل</h3>
            <p><span>الاسم</span>{customer.fullName || 'غير مسجل'}</p>
            <p><span>الهاتف</span>{customer.phone ? <a href={`tel:${encodeURIComponent(customer.phone)}`} dir="ltr">{customer.phone}</a> : 'غير مسجل'}</p>
            <p><span>العنوان</span>{[customer.address, customer.city].filter(Boolean).join('، ') || 'غير مسجل'}</p>
            {customer.notes && <p><span>ملاحظات</span>{customer.notes}</p>}
            <p><span>رقم الطلب</span><bdi>{id}</bdi></p>
          </section>
          <section>
            <h3>الدفع والإجمالي</h3>
            <p><span>طريقة الدفع</span>{order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod || 'غير مسجل'}</p>
            <p><span>المنتجات</span>{formatMoney(order.subtotal ?? items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0))}</p>
            <p><span>الشحن</span>{order.shipping === null || order.shipping === undefined ? 'غير مسجل' : formatMoney(order.shipping)}</p>
            <p><span>الإجمالي</span>{formatMoney(getOrderTotal(order))}</p>
            <p><span>آخر تحديث</span>{order.updatedAt ? formatDate(order.updatedAt) : 'غير مسجل'}</p>
          </section>
          <section className="admin-order-lines">
            <h3>محتويات الطلب</h3>
            {items.length ? items.map((item, index) => (
              <p key={`${item.productId || item.id || item.name}-${index}`}>
                <span>{item.name || 'منتج'}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''} × {item.quantity || 0}</span>
                <strong>{formatMoney((Number(item.price) || 0) * (Number(item.quantity) || 0))}</strong>
              </p>
            )) : <p>لا توجد تفاصيل مسجلة للمنتجات.</p>}
          </section>
        </div>
      )}
    </article>
  );
}

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
  const [activeTab, setActiveTab] = useState('products');
  const [salesPeriod, setSalesPeriod] = useState('7');
  const [currentTime, setCurrentTime] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showAdvancedImage, setShowAdvancedImage] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [productQuery, setProductQuery] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStage, setOrderStage] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkOrderStatus, setBulkOrderStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const deleteTimer = useRef(null);
  const pendingDeleteRef = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success', undo = false) => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, type, undo });
    if (!undo) {
      toastTimer.current = window.setTimeout(() => setToast(null), 4200);
    }
  }, []);

  const loadData = useCallback(async (adminToken, isRefresh = false) => {
    if (!adminToken.trim()) {
      setError('أدخل رمز دخول الأدمن.');
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
      if (isRefresh) showToast('تم تحديث بيانات لوحة التحكم.');
    } catch (requestError) {
      setAuthenticated(false);
      setToken('');
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const finalizePendingDelete = useCallback(async () => {
    const batch = pendingDeleteRef.current;
    if (!batch) return true;
    window.clearTimeout(deleteTimer.current);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    setToast(null);
    const results = await Promise.allSettled(batch.items.map(item => deleteAdminProduct(token, item.id)));
    const failed = results.flatMap((result, index) => result.status === 'rejected' ? [batch.items[index]] : []);
    if (failed.length) {
      setProducts(previous => [...previous, ...failed].sort((a, b) => Number(a.id) - Number(b.id)));
      showToast(`تعذر حذف ${failed.length} منتج. ${errorMessage(results.find(result => result.status === 'rejected').reason)}`, 'error');
      return false;
    }
    showToast(`تم حذف ${batch.items.length} ${batch.items.length === 1 ? 'منتج' : 'منتجات'}.`);
    return true;
  }, [showToast, token]);

  const queueDelete = items => {
    if (pendingDeleteRef.current) {
      showToast('انتظر انتهاء الحذف الحالي أو تراجع عنه أولًا.', 'error');
      return;
    }
    const batch = { items };
    pendingDeleteRef.current = batch;
    setPendingDelete(batch);
    setProducts(previous => previous.filter(item => !items.some(deleted => String(deleted.id) === String(item.id))));
    setSelectedProductIds(previous => previous.filter(id => !items.some(item => String(item.id) === id)));
    setConfirmDelete(null);
    showToast(`تم حذف ${items.length} ${items.length === 1 ? 'منتج' : 'منتجات'}.`, 'success', true);
    deleteTimer.current = window.setTimeout(() => {
      void finalizePendingDelete();
    }, 5000);
  };

  const undoDelete = () => {
    const batch = pendingDeleteRef.current;
    if (!batch) return;
    window.clearTimeout(deleteTimer.current);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    setProducts(previous => [...previous, ...batch.items].sort((a, b) => Number(a.id) - Number(b.id)));
    showToast('تم التراجع عن الحذف.');
  };

  const validateProduct = () => {
    const nextErrors = {};
    if (!String(product.name || '').trim()) nextErrors.name = 'اسم المنتج مطلوب.';
    const price = Number(product.price);
    if (product.price === '' || !Number.isFinite(price) || price < 0) nextErrors.price = 'أدخل سعرًا صحيحًا، صفر أو أكثر.';
    const stock = product.stockQuantity;
    if (stock !== '' && (!Number.isSafeInteger(Number(stock)) || Number(stock) < 0)) {
      nextErrors.stockQuantity = 'أدخل كمية صحيحة موجبة أو اتركها فارغة.';
    }
    if (!String(product.category || '').trim()) nextErrors.category = 'اختر تصنيف المنتج.';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitProduct = async event => {
    event.preventDefault();
    if (!validateProduct()) return;
    setError('');
    setSavingProduct(true);
    try {
      const normalizedProduct = {
        ...product,
        name: String(product.name).trim(),
        price: Number(product.price),
        stockQuantity: product.stockQuantity === '' ? '' : Number(product.stockQuantity),
        category: String(product.category || '').trim().toUpperCase()
      };
      const saved = editingId
        ? await updateAdminProduct(token, editingId, normalizedProduct)
        : await createAdminProduct(token, normalizedProduct);
      setProducts(previous => editingId
        ? previous.map(item => String(item.id) === String(editingId) ? saved : item)
        : [...previous, saved]);
      setProduct(emptyProduct);
      setEditingId(null);
      setFormErrors({});
      setShowProductForm(false);
      showToast(editingId ? 'تم تحديث المنتج بنجاح.' : 'تمت إضافة المنتج بنجاح.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSavingProduct(false);
    }
  };

  const changeStatus = async (id, status) => {
    setError('');
    setUpdatingOrderId(id);
    try {
      const updated = await updateAdminOrder(token, id, status);
      setOrders(previous => previous.map(order => String(order.id) === String(id) ? updated : order));
      showToast(`تم تحديث حالة الطلب إلى ${statusLabels[status] || status}.`);
    } catch (requestError) {
      showToast(errorMessage(requestError), 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const applyBulkStatus = async () => {
    if (!bulkOrderStatus || !selectedOrderIds.length) return;
    setBulkUpdating(true);
    const selected = orders.filter(order => selectedOrderIds.includes(String(order.id)));
    const results = await Promise.allSettled(selected.map(order => updateAdminOrder(token, order.id, bulkOrderStatus)));
    const updated = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    const failedCount = results.length - updated.length;
    if (updated.length) {
      const updatedById = new Map(updated.map(order => [String(order.id), order]));
      setOrders(previous => previous.map(order => updatedById.get(String(order.id)) || order));
    }
    setSelectedOrderIds([]);
    setBulkOrderStatus('');
    setBulkUpdating(false);
    if (failedCount) {
      const failure = results.find(result => result.status === 'rejected');
      showToast(`تم تحديث ${updated.length} طلب، وتعذر تحديث ${failedCount}. ${errorMessage(failure.reason)}`, 'error');
    } else {
      showToast(`تم تحديث حالة ${updated.length} طلب.`);
    }
  };

  const closeAdmin = async () => {
    if (pendingDeleteRef.current && !(await finalizePendingDelete())) return;
    setToken('');
    setAuthenticated(false);
    onClose();
  };

  const logOut = async () => {
    if (pendingDeleteRef.current && !(await finalizePendingDelete())) return;
    setToken('');
    setAuthenticated(false);
    setProducts([]);
    setOrders([]);
    setUsers([]);
    setExpandedOrderId(null);
    setSelectedProductIds([]);
    setSelectedOrderIds([]);
    setError('');
    showToast('تم تسجيل الخروج.');
  };

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current);
    window.clearTimeout(deleteTimer.current);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== 'Escape') return;
      if (confirmDelete) setConfirmDelete(null);
      else if (showProductForm) {
        setShowProductForm(false);
        setEditingId(null);
        setProduct(emptyProduct);
        setFormErrors({});
      } else if (expandedOrderId) setExpandedOrderId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDelete, expandedOrderId, showProductForm]);

  const visibleProducts = useMemo(() => products.filter(item => {
    const matchesSearch = String(item.name || '').toLowerCase().includes(productQuery.trim().toLowerCase());
    const matchesCategory = productCategory === 'all' || String(item.category || '').trim().toLowerCase() === productCategory;
    return matchesSearch && matchesCategory;
  }), [productCategory, productQuery, products]);

  const productCategories = useMemo(() => [...new Set(products.map(item => String(item.category || '').trim().toUpperCase()).filter(Boolean))].sort(), [products]);

  const salesCounts = useMemo(() => {
    const counts = new Map();
    for (const order of orders) {
      for (const item of getOrderItems(order)) {
        const quantity = Number(item.quantity) || 0;
        const productId = item.productId ?? item.id ?? item.sourceId;
        if (productId !== null && productId !== undefined) {
          const key = String(productId);
          counts.set(key, (counts.get(key) || 0) + quantity);
        }
      }
    }
    return counts;
  }, [orders]);

  const productsWithSales = useMemo(() => products.map(item => ({
    ...item,
    salesCount: salesCounts.get(String(item.id)) || salesCounts.get(String(item.sourceId)) || 0
  })), [products, salesCounts]);

  const salesTotal = useMemo(() => {
    const cutoff = salesPeriod === 'all' || currentTime === null
      ? null
      : currentTime - Number(salesPeriod) * 24 * 60 * 60 * 1000;
    return orders.reduce((sum, order) => {
      const date = new Date(order.createdAt).getTime();
      if (!Number.isFinite(date) || (cutoff !== null && date < cutoff)) return sum;
      return sum + getOrderTotal(order);
    }, 0);
  }, [currentTime, orders, salesPeriod]);

  const topProduct = useMemo(() => {
    if (!productsWithSales.length) return null;
    const sold = [...productsWithSales].filter(item => item.salesCount > 0).sort((a, b) => b.salesCount - a.salesCount)[0];
    if (sold) return { ...sold, isSalesBased: true };
    return {
      ...[...productsWithSales].sort((a, b) => {
        const dateDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        return (Number.isFinite(dateDiff) && dateDiff !== 0) ? dateDiff : Number(b.id) - Number(a.id);
      })[0],
      isSalesBased: false
    };
  }, [productsWithSales]);

  const filteredOrders = useMemo(() => orders.filter(order => {
    const customer = order.customer && typeof order.customer === 'object' ? order.customer : {};
    const query = orderQuery.trim().toLowerCase();
    const matchesQuery = !query ||
      String(order.id || '').toLowerCase().includes(query) ||
      String(customer.fullName || '').toLowerCase().includes(query) ||
      String(customer.phone || '').toLowerCase().includes(query);
    return matchesQuery && (!orderStage || order.status === orderStage);
  }), [orderQuery, orderStage, orders]);

  const orderStageCounts = useMemo(() => Object.fromEntries(
    ['received', 'shipped', 'delivered'].map(status => [status, orders.filter(order => order.status === status).length])
  ), [orders]);

  const greeting = currentTime === null
    ? 'أهلًا'
    : new Date(currentTime).getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
  const today = currentTime === null
    ? ''
    : new Date(currentTime).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!authenticated) {
    return (
      <div className="admin-shell admin-login-shell" dir="rtl">
        <div className="admin-login-card">
          <div className="admin-brand-mark">M</div>
          <p className="admin-eyebrow">MOSCOW STORE</p>
          <h1>{loading ? 'جارٍ التحقق من الدخول' : 'دخول لوحة التحكم'}</h1>
          <p className="admin-login-hint">أدخل رمز الأدمن للمتابعة. يظل الرمز في الذاكرة فقط طوال فتح لوحة التحكم.</p>
          <form onSubmit={event => { event.preventDefault(); void loadData(token); }} className="admin-login-form">
            <label htmlFor="admin-token">رمز الدخول</label>
            <input id="admin-token" type="password" value={token} onChange={event => setToken(event.target.value)} placeholder="أدخل رمز الأدمن" autoComplete="off" spellCheck="false" required disabled={loading} autoFocus />
            {error && <p className="admin-inline-error" role="alert">{error}</p>}
            <button className="admin-button primary full" disabled={loading}>{loading ? 'جارٍ التحقق…' : 'دخول آمن'}</button>
          </form>
          <button type="button" className="admin-login-close" onClick={onClose}>العودة للمتجر</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" dir="rtl">
      <Toast toast={toast} onUndo={undoDelete} onDismiss={() => setToast(null)} />
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <h1>MOSCOW ADMIN</h1>
          <span>لوحة التحكم</span>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="admin-button secondary" onClick={() => void loadData(token, true)} disabled={loading} aria-label="تحديث البيانات">
            <Icon>↻</Icon><span>{loading ? 'جارٍ التحديث…' : 'تحديث'}</span>
          </button>
          <button type="button" className="admin-button quiet" onClick={() => void logOut()}>تسجيل الخروج</button>
          <button type="button" className="admin-button close" onClick={() => void closeAdmin()}>إغلاق ×</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-greeting">
          <div>
            <p className="admin-eyebrow">نظرة عامة على المتجر</p>
            <h2>{greeting} <span>بك في لوحة MOSCOW</span></h2>
            <p className="admin-muted">{today}</p>
          </div>
          <button type="button" className="admin-button primary" onClick={() => {
            setEditingId(null);
            setProduct(emptyProduct);
            setFormErrors({});
            setShowProductForm(value => !value);
            setActiveTab('products');
          }}>
            <Icon>＋</Icon> منتج جديد
          </button>
        </section>

        <section className="admin-kpi-grid" aria-label="ملخص المتجر">
          <KpiCard label="إجمالي المنتجات" value={products.length} icon="▦" tone="purple" />
          <KpiCard label="الطلبات المكتملة" value={orders.filter(order => order.status === 'delivered').length} icon="✓" tone="green" />
          <KpiCard label="الطلبات الملغاة" value={orders.filter(order => order.status === 'cancelled').length} icon="×" tone="red" />
          <KpiCard label="الطلبات الجديدة" value={orders.filter(order => order.status === 'received').length} icon="◷" tone="amber" />
        </section>

        <section className="admin-insights-grid">
          <article className="admin-card admin-sales-card">
            <div className="admin-card-heading">
              <div><p className="admin-eyebrow">ملخص المبيعات</p><h2>إجمالي المبيعات</h2></div>
              <span className="admin-card-icon">↗</span>
            </div>
            <strong className="admin-sales-total">{formatMoney(salesTotal)}</strong>
            <p className="admin-muted">محسوبة من الطلبات المسجلة في الفترة المحددة</p>
            <div className="admin-period-chips" aria-label="فترة المبيعات">
              {periods.map(period => (
                <button type="button" key={period.value} className={salesPeriod === period.value ? 'is-active' : ''} onClick={() => setSalesPeriod(period.value)}>
                  {period.label}
                </button>
              ))}
            </div>
          </article>
          <article className="admin-card admin-top-product">
            <div className="admin-card-heading">
              <div><p className="admin-eyebrow">الأكثر تميزًا</p><h2>أفضل منتج</h2></div>
              <span className="admin-card-icon">★</span>
            </div>
            {topProduct ? (
              <div className="admin-top-product-body">
                <div className="admin-top-product-image">
                  {topProduct.image ? <img src={topProduct.image} alt={topProduct.name} onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Icon>▧</Icon>}
                </div>
                <div><h3>{topProduct.name}</h3><p>{topProduct.isSalesBased ? `${topProduct.salesCount} وحدة مباعة` : 'الأحدث إضافة · لا تتوفر بيانات مبيعات تفصيلية'}</p></div>
              </div>
            ) : <p className="admin-muted">لا توجد منتجات بعد.</p>}
          </article>
        </section>

        <nav className="admin-tabs" aria-label="أقسام لوحة التحكم">
          {[
            ['products', 'المنتجات', products.length],
            ['orders', 'الطلبات', orders.length],
            ['users', 'العملاء', users.length]
          ].map(([tab, label, count]) => (
            <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
              {label}<span>{count}</span>
            </button>
          ))}
        </nav>

        {error && <p className="admin-global-error" role="alert">{error}</p>}
        {loading && <p className="admin-loading" role="status">جارٍ تحميل بيانات لوحة التحكم…</p>}

        {activeTab === 'products' && (
          <section className="admin-section">
            <div className="admin-section-heading">
              <div><p className="admin-eyebrow">إدارة المخزون</p><h2>المنتجات <span>{visibleProducts.length}</span></h2></div>
              <button type="button" className="admin-button secondary desktop-add" onClick={() => setShowProductForm(value => !value)}>
                {showProductForm ? 'إخفاء النموذج' : '＋ إضافة منتج'}
              </button>
            </div>

            {showProductForm && (
              <form className="admin-card admin-product-form" onSubmit={submitProduct} noValidate>
                <div className="admin-form-heading"><div><h3>{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3><p>الحقول ذات العلامة مطلوبة</p></div><button type="button" className="admin-icon-button" aria-label="إغلاق نموذج المنتج" onClick={() => { setShowProductForm(false); setEditingId(null); setProduct(emptyProduct); setFormErrors({}); }}>×</button></div>
                <div className="admin-form-grid">
                  <label className="admin-field">اسم المنتج *
                    <input value={product.name} onChange={event => { setProduct(previous => ({ ...previous, name: event.target.value })); setFormErrors(previous => ({ ...previous, name: '' })); }} placeholder="مثال: تيشيرت MOSCOW" maxLength={160} aria-invalid={Boolean(formErrors.name)} />
                    {formErrors.name && <span className="admin-field-error">{formErrors.name}</span>}
                  </label>
                  <label className="admin-field">سعر الوحدة (ج.م.) *
                    <input type="number" min="0" step="0.01" value={product.price} onChange={event => { setProduct(previous => ({ ...previous, price: event.target.value })); setFormErrors(previous => ({ ...previous, price: '' })); }} placeholder="0.00" aria-invalid={Boolean(formErrors.price)} />
                    {formErrors.price && <span className="admin-field-error">{formErrors.price}</span>}
                  </label>
                  <label className="admin-field">كمية المخزون
                    <input type="number" min="0" step="1" value={product.stockQuantity ?? ''} onChange={event => { setProduct(previous => ({ ...previous, stockQuantity: event.target.value })); setFormErrors(previous => ({ ...previous, stockQuantity: '' })); }} placeholder="اتركه فارغًا لغير متتبع" aria-invalid={Boolean(formErrors.stockQuantity)} />
                    {formErrors.stockQuantity && <span className="admin-field-error">{formErrors.stockQuantity}</span>}
                  </label>
                  <label className="admin-field">التصنيف *
                    <input value={product.category || ''} onChange={event => { setProduct(previous => ({ ...previous, category: event.target.value })); setFormErrors(previous => ({ ...previous, category: '' })); }} placeholder="مثل T-SHIRTS أو HOODIES" maxLength={80} aria-invalid={Boolean(formErrors.category)} list="admin-category-options" />
                    <datalist id="admin-category-options">{productCategories.map(category => <option key={category} value={category} />)}</datalist>
                    {formErrors.category && <span className="admin-field-error">{formErrors.category}</span>}
                  </label>
                  <div className="admin-image-preview">
                    {product.image ? <img src={product.image} alt="معاينة صورة المنتج" onError={event => { event.currentTarget.style.display = 'none'; }} /> : <Icon>▧</Icon>}
                    <span>معاينة الصورة</span>
                  </div>
                </div>
                <p className="admin-form-note">تحديد المخزون على 0 يضع المنتج كـ«نفد». اترك الكمية فارغة إذا لم تكن تتابع المخزون.</p>
                <button type="button" className="admin-link-button" aria-expanded={showAdvancedImage} onClick={() => setShowAdvancedImage(value => !value)}>
                  {showAdvancedImage ? 'إخفاء إعداد الصورة' : 'إعداد الصورة (متقدم)'}
                </button>
                {showAdvancedImage && (
                  <label className="admin-field admin-image-path">مسار الصورة
                    <input dir="ltr" value={product.image || ''} onChange={event => setProduct(previous => ({ ...previous, image: event.target.value }))} placeholder="/images/product.jpg" maxLength={500} />
                    <span className="admin-field-hint">خادم المتجر يقبل مسار صورة فقط حاليًا؛ ارفع الصورة إلى ملفات الموقع ثم أدخل مسارها هنا.</span>
                  </label>
                )}
                <div className="admin-form-actions">
                  <button disabled={savingProduct} className="admin-button primary">{savingProduct ? 'جارٍ الحفظ…' : editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
                  <button type="button" className="admin-button quiet" onClick={() => { setShowProductForm(false); setEditingId(null); setProduct(emptyProduct); setFormErrors({}); }}>إلغاء</button>
                </div>
              </form>
            )}

            <div className="admin-toolbar">
              <label className="admin-search"><Icon>⌕</Icon><span className="sr-only">بحث عن منتج بالاسم</span><input value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="ابحث عن منتج بالاسم…" /></label>
              <div className="admin-filter-chips" aria-label="فلترة التصنيف">
                <button type="button" className={productCategory === 'all' ? 'is-active' : ''} onClick={() => setProductCategory('all')}>الكل</button>
                {productCategories.map(category => (
                  <button type="button" key={category} className={productCategory === category.toLowerCase() ? 'is-active' : ''} onClick={() => setProductCategory(category.toLowerCase())}>{categoryLabel(category)}</button>
                ))}
              </div>
            </div>

            {selectedProductIds.length > 0 && (
              <BulkBar count={selectedProductIds.length} onClear={() => setSelectedProductIds([])} className="admin-product-bulk">
                {confirmDelete?.type === 'bulk' ? (
                  <ConfirmInline count={selectedProductIds.length} onConfirm={() => queueDelete(products.filter(item => selectedProductIds.includes(String(item.id))))} onCancel={() => setConfirmDelete(null)} />
                ) : (
                  <button type="button" className="admin-button danger small" onClick={() => setConfirmDelete({ type: 'bulk' })} disabled={Boolean(pendingDelete)}>حذف المحدد</button>
                )}
              </BulkBar>
            )}

            <div className="admin-product-list">
              <div className="admin-list-heading">
                <label className="admin-check-cell"><input type="checkbox" checked={visibleProducts.length > 0 && visibleProducts.every(item => selectedProductIds.includes(String(item.id)))} onChange={event => setSelectedProductIds(event.target.checked ? visibleProducts.map(item => String(item.id)) : [])} aria-label="تحديد كل المنتجات الظاهرة" /></label>
                <span>المنتج</span><span>التصنيف</span><span>المخزون</span><span>السعر</span><span>المبيعات</span><span>الإجراءات</span>
              </div>
              {visibleProducts.map(item => (
                <ProductRow
                  key={item.id}
                  item={productsWithSales.find(productWithSales => String(productWithSales.id) === String(item.id)) || item}
                  selected={selectedProductIds.includes(String(item.id))}
                  onSelect={(id, checked) => setSelectedProductIds(previous => checked ? [...new Set([...previous, String(id)])] : previous.filter(value => value !== String(id)))}
                  onEdit={selected => {
                    setProduct({ ...emptyProduct, ...selected, stockQuantity: selected.stockQuantity ?? '', inStock: selected.inStock !== false });
                    setEditingId(selected.id);
                    setFormErrors({});
                    setShowProductForm(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={selected => setConfirmDelete({ type: 'single', item: selected })}
                  confirmDelete={confirmDelete?.type === 'single' && String(confirmDelete.item.id) === String(item.id)}
                  onConfirmDelete={selected => queueDelete([selected])}
                  onCancelDelete={() => setConfirmDelete(null)}
                  deleting={Boolean(pendingDelete)}
                />
              ))}
              {visibleProducts.length === 0 && <p className="admin-empty">لا توجد منتجات مطابقة لبحثك.</p>}
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="admin-section">
            <div className="admin-section-heading">
              <div><p className="admin-eyebrow">متابعة المبيعات</p><h2>الطلبات <span>{filteredOrders.length}</span></h2></div>
            </div>
            <div className="admin-stage-filters" aria-label="تصفية حسب مرحلة الطلب">
              {['received', 'shipped', 'delivered'].map(status => (
                <button type="button" key={status} className={orderStage === status ? 'is-active' : ''} onClick={() => setOrderStage(current => current === status ? '' : status)}>
                  {statusLabels[status]} <span>{orderStageCounts[status]}</span>
                </button>
              ))}
            </div>
            <div className="admin-toolbar">
              <label className="admin-search"><Icon>⌕</Icon><span className="sr-only">بحث في الطلبات</span><input value={orderQuery} onChange={event => setOrderQuery(event.target.value)} placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف…" /></label>
            </div>
            {selectedOrderIds.length > 0 && (
              <BulkBar count={selectedOrderIds.length} onClear={() => setSelectedOrderIds([])} className="admin-order-bulk">
                <label className="sr-only" htmlFor="bulk-order-status">الحالة الجديدة</label>
                <select id="bulk-order-status" className="admin-select" value={bulkOrderStatus} onChange={event => setBulkOrderStatus(event.target.value)}>
                  <option value="">اختر الحالة</option>
                  {orderStatuses.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </select>
                <button type="button" className="admin-button primary small" onClick={() => void applyBulkStatus()} disabled={!bulkOrderStatus || bulkUpdating}>{bulkUpdating ? 'جارٍ التطبيق…' : 'تطبيق'}</button>
              </BulkBar>
            )}
            <div className="admin-order-list">
              <div className="admin-order-list-heading">
                <label className="admin-check-cell"><input type="checkbox" checked={filteredOrders.length > 0 && filteredOrders.every(order => selectedOrderIds.includes(String(order.id)))} onChange={event => setSelectedOrderIds(event.target.checked ? filteredOrders.map(order => String(order.id)) : [])} aria-label="تحديد كل الطلبات الظاهرة" /></label>
                <span>رقم الطلب / العميل</span><span>المصدر</span><span>التاريخ</span><span>العناصر</span><span>الإجمالي</span><span>الحالة</span><span>تحديث</span>
              </div>
              {filteredOrders.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  selected={selectedOrderIds.includes(String(order.id))}
                  onSelect={(id, checked) => setSelectedOrderIds(previous => checked ? [...new Set([...previous, id])] : previous.filter(value => value !== id))}
                  expanded={expandedOrderId === order.id}
                  onToggle={() => setExpandedOrderId(current => current === order.id ? null : order.id)}
                  onStatusChange={changeStatus}
                  updating={updatingOrderId === String(order.id)}
                />
              ))}
              {filteredOrders.length === 0 && <p className="admin-empty">لا توجد طلبات في هذه المرحلة.</p>}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="admin-section">
            <div className="admin-section-heading"><div><p className="admin-eyebrow">إدارة الحسابات</p><h2>العملاء <span>{users.length}</span></h2></div></div>
            <div className="admin-user-list">
              <div className="admin-user-heading"><span>البريد الإلكتروني</span><span>الصلاحية</span></div>
              {users.map(user => (
                <div className="admin-user-row" key={user.id}>
                  <span dir="ltr">{user.email}</span>
                  <span className="admin-role-badge">{user.role === 'admin' ? 'مدير' : user.role === 'customer' ? 'عميل' : user.role || 'غير محدد'}</span>
                </div>
              ))}
              {users.length === 0 && <p className="admin-empty">لا توجد حسابات مسجلة.</p>}
            </div>
          </section>
        )}
      </main>
      <footer className="admin-footer"><span>MOSCOW ADMIN</span><span>Set stock to 0 to mark sold out · اترك الكمية فارغة لغير المتتبع</span></footer>
    </div>
  );
}
