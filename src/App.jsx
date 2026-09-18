import React, { useState, useRef, useEffect } from 'react';
import CheckoutModal from './CheckoutModal';
import ProductCard from './components/ProductCard';
import FooterContent from './components/FooterContent';
import ProductDetailModal from './components/ProductDetailModal';
import AdminPanel from './components/AdminPanel';
import { products, bestSellers, typeCategories, counts, categoryIcons } from './data/products';
import { fetchProducts } from './api';

const getProductIdentity = (item) => {
  if (!item) return '';
  const image = String(item.image || '').toLowerCase();
  const imageMatch = image.match(/\/([^/]+?)(?:-detail\d+)?\.jpg$/);
  return imageMatch ? `image:${imageMatch[1]}` : `name:${String(item.name || '').trim().toLowerCase()}`;
};

// ==================== DATA (moved outside so components below can reference types if needed) ====================

// ==================== MAIN APP ====================
export default function App() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moscow-cart') || '[]');
    } catch {
      return [];
    }
  });
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moscow-wishlist') || '[]');
    } catch {
      return [];
    }
  });
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const scrollRef = useRef(null);
  const bestSellersScrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('T-SHIRTS');

  const [showAllModal, setShowAllModal] = useState(false);
  const [showMenModal, setShowMenModal] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showSizeError, setShowSizeError] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [cartMessage, setCartMessage] = useState('');

  const [menSubCategory, setMenSubCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [availability, setAvailability] = useState('ALL');
  const [minRating, setMinRating] = useState(0);

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountRef = useRef(null);

  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moscow-read-notifications') || '[]'); } catch { return []; }
  });

  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then(data => {
        if (active && Array.isArray(data)) setRemoteProducts(data);
      })
      .catch(() => {
        if (active) setProductsError('The catalog API is unavailable. Showing the local catalog.');
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('moscow-read-notifications', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    localStorage.setItem('moscow-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const catalog = [...products, ...bestSellers, ...Object.values(typeCategories).flat(), ...remoteProducts];
    const seen = new Set();
    const normalized = wishlist.reduce((result, wishlistValue) => {
      const matchedProduct = catalog.find(item =>
        String(item.id) === String(wishlistValue) ||
        String(item.name).trim().toLowerCase() === String(wishlistValue).trim().toLowerCase() ||
        getProductIdentity(item) === String(wishlistValue)
      );
      const identity = getProductIdentity(matchedProduct) || `id:${wishlistValue}`;
      if (!seen.has(identity)) {
        seen.add(identity);
        result.push(identity);
      }
      return result;
    }, []);
    if (normalized.length !== wishlist.length || normalized.some((value, index) => value !== wishlist[index])) {
      setWishlist(normalized);
    }
  }, [remoteProducts]);

  useEffect(() => {
    localStorage.setItem('moscow-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearchDropdown(false);
      if (accountRef.current && !accountRef.current.contains(event.target)) setShowAccountDropdown(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showProductDetail && selectedProduct) {
      setSelectedSize('');
      setSelectedColor(selectedProduct.availableColors?.[0] || '');
      setQuantity(1);
      setActiveImage(0);
      setShowSizeError(false);
    }
  }, [showProductDetail, selectedProduct]);

  const toggleWishlist = (id, e) => {
    if (e) e.stopPropagation();
    const wishlistItem = [...products, ...bestSellers, ...Object.values(typeCategories).flat(), ...remoteProducts]
      .find(item => String(item.id) === String(id));
    const itemName = wishlistItem?.name?.trim().toLowerCase();
    const itemIdentity = getProductIdentity(wishlistItem);
    const isSelected = wishlist.some(item =>
      String(item) === String(id) ||
      (itemName && String(item).toLowerCase() === itemName) ||
      String(item) === itemIdentity
    );
    if (isSelected) {
      setWishlist(wishlist.filter(item =>
        String(item) !== String(id) &&
        (!itemName || String(item).toLowerCase() !== itemName) &&
        String(item) !== itemIdentity
      ));
    } else {
      setWishlist([...wishlist, itemIdentity || id]);
    }
  };

  const openProductDetail = (item) => {
    setScrollPosition(window.scrollY);
    setSelectedProduct(item);
    setShowProductDetail(true);

    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  };

  const closeProductDetail = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    window.scrollTo(0, scrollPosition);

    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  const addToCartFromDetail = () => {
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    addToCart(selectedProduct, quantity, selectedSize, selectedColor);
    setCartMessage(`${quantity}x ${selectedProduct.name} added to cart`);
    closeProductDetail();
  };

  const addToCart = (item, qty = 1, size, color) => {
    if (item?.stopPropagation) {
      item.stopPropagation();
      return;
    }
    if (item) {
      const finalSize = size || item.size || 'One Size';
      const finalColor = color || item.color || '';
      const cartId = `${item.id}-${finalSize}-${finalColor}`;
      setCart(prev => {
        const existing = prev.find(entry => entry.cartId === cartId);
        if (existing) return prev.map(entry => entry.cartId === cartId ? { ...entry, quantity: entry.quantity + qty } : entry);
        return [...prev, { cartId, id: item.id, name: item.name, price: item.price, image: item.image, size: finalSize, color: finalColor, quantity: qty }];
      });
    }
    setCartMessage('Product added to cart');
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateCartQuantity = (cartId, change) => {
    setCart(prev => prev
      .map(item => item.cartId === cartId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)
      .filter(item => item.quantity > 0));
  };

  const removeCartItem = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  useEffect(() => {
    if (!cartMessage) return undefined;
    const timer = setTimeout(() => setCartMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [cartMessage]);

  const scrollLeft = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const allProductsCombined = React.useMemo(() => {
    const seen = new Set();
    const source = [...products, ...bestSellers, ...Object.values(typeCategories).flat(), ...remoteProducts];
    return source.filter(item => {
      const normalizedName = item.name.toLowerCase().trim();
      if (seen.has(normalizedName)) return false;
      seen.add(normalizedName);
      return true;
    });
  }, [remoteProducts]);

  const filteredSearchProducts = searchQuery.trim() === '' ? [] : allProductsCombined.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const wishlistProducts = allProductsCombined.filter(item =>
    wishlist.some(wishlistId =>
      String(wishlistId) === String(item.id) ||
      String(wishlistId).toLowerCase() === item.name.trim().toLowerCase() ||
      String(wishlistId) === getProductIdentity(item)
    )
  ).filter((item, index, list) =>
    list.findIndex(candidate => getProductIdentity(candidate) === getProductIdentity(item)) === index
  );

  const toggleSizeFilter = (size) => {
    if (selectedSizes.includes(size)) setSelectedSizes(selectedSizes.filter(s => s !== size));
    else setSelectedSizes([...selectedSizes, size]);
  };

  const toggleColorFilter = (color) => {
    if (selectedColors.includes(color)) setSelectedColors(selectedColors.filter(c => c !== color));
    else setSelectedColors([...selectedColors, color]);
  };

  const allMenProducts = Object.values(typeCategories).flat();

  const getFilteredMenProducts = () => {
    let result = menSubCategory === 'ALL' ? allMenProducts : (typeCategories[menSubCategory] || []);
    if (selectedSizes.length > 0) result = result.filter(item => item.size && selectedSizes.includes(item.size));
    if (selectedColors.length > 0) result = result.filter(item => item.color && selectedColors.includes(item.color));
    if (availability === 'IN_STOCK') result = result.filter(item => item.inStock === true);
    else if (availability === 'OUT_OF_STOCK') result = result.filter(item => item.inStock === false);
    if (minRating > 0) result = result.filter(item => (item.rating || 0) >= minRating);

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'best-sellers') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return result;
  };

  const handleTrackOrder = () => {
    if (trackOrderNumber.trim()) {
      const statuses = [
        { status: "تم استلام الطلب", date: "25 يناير 2026", completed: true },
        { status: "جاري التجهيز", date: "25 يناير 2026", completed: true },
        { status: "تم الشحن", date: "26 يناير 2026", completed: false },
        { status: "في طريقه إليك", date: "-", completed: false },
        { status: "تم التسليم", date: "-", completed: false }
      ];
      setOrderStatus(statuses);
    }
  };

  const notifications = React.useMemo(() => {
    const result = [];
    if (cartCount > 0) {
      result.push({ id: 'cart', message: `عندك ${cartCount} منتج في السلة`, time: 'الآن', type: 'cart' });
    }
    if (wishlist.length > 0) {
      result.push({ id: 'wishlist', message: `عندك ${wishlist.length} منتج في قائمة المفضلة`, time: 'الآن', type: 'stock' });
    }
    const lastOrder = localStorage.getItem('moscow-last-order');
    if (lastOrder) {
      result.push({ id: `order-${lastOrder}`, message: `تم تسجيل طلبك ${lastOrder} بنجاح`, time: 'آخر طلب', type: 'shipping' });
    }
    return result.map(notification => ({
      ...notification,
      read: readNotificationIds.includes(notification.id)
    }));
  }, [cartCount, wishlist.length, readNotificationIds]);
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const markAsRead = (id) => {
    setReadNotificationIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  return (
    <div className="bg-black text-white min-h-screen font-sans w-full overflow-x-hidden">
      {cartMessage && (
        <div
          className="fixed top-5 right-5 z-[80] max-w-[calc(100vw-2rem)] bg-green-600 text-white px-4 py-3 rounded-lg shadow-2xl text-sm font-bold"
          role="status"
          aria-live="polite"
        >
          ✓ {cartMessage}
        </div>
      )}
      <div className="bg-[#2d1244] text-xs py-2 border-b border-purple-900/40 w-full overflow-hidden whitespace-nowrap relative flex">
        <div className="inline-block animate-[marquee_20s_linear_infinite] uppercase font-bold tracking-widest text-purple-200 px-4">
          CASH ON DELIVERY ACROSS EGYPT — LIMITED DROPS &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; FREE SHIPPING ON ORDERS OVER 1500 LE &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; CASH ON DELIVERY ACROSS EGYPT — LIMITED DROPS
        </div>
        <div className="inline-block animate-[marquee2_20s_linear_infinite] uppercase font-bold tracking-widest text-purple-200 px-4 absolute top-2 left-full">
          CASH ON DELIVERY ACROSS EGYPT — LIMITED DROPS &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; FREE SHIPPING ON ORDERS OVER 1500 LE &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; CASH ON DELIVERY ACROSS EGYPT — LIMITED DROPS
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
          @keyframes marquee2 { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
          @keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        `}</style>
      </div>

      <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-purple-900/30">
        <div className="flex items-center gap-6 md:gap-10">
          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-1 cursor-pointer" aria-label="Toggle menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
          <div onClick={() => { setShowAllModal(false); setShowMenModal(false); closeProductDetail(); }} className="cursor-pointer">
            <span className="text-xl md:text-2xl font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider uppercase text-gray-300">
            <span onClick={() => { setShowMenModal(true); setMenSubCategory('ALL'); }} className="cursor-pointer hover:text-purple-400 transition-colors">MEN</span>
            <span className="cursor-pointer hover:text-purple-400 transition-colors">WOMEN</span>
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4 text-xs font-bold uppercase tracking-wider relative">
          <div className="relative" ref={searchRef}>
            <div onClick={() => { setShowSearchDropdown(!showSearchDropdown); setShowAccountDropdown(false); setShowNotifications(false); }} className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span className="hidden sm:inline">SEARCH</span>
            </div>
            {showSearchDropdown && (
              <div className="absolute right-0 mt-3 bg-[#0d0617] border border-purple-900 shadow-2xl p-4 z-50 rounded-md text-left" style={{ width: '340px', maxWidth: '90vw' }}>
                <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="w-full bg-[#12071f] border border-purple-800 text-white px-3.5 py-2.5 text-xs outline-none focus:border-purple-500 placeholder-gray-500 rounded" />
                {searchQuery.trim() !== '' && (
                  <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
                    {filteredSearchProducts.length > 0 ? (
                      filteredSearchProducts.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => { openProductDetail(item); setShowSearchDropdown(false); }}
                          className="flex items-center gap-3 bg-[#12071f]/80 p-2.5 rounded border border-purple-950 hover:border-purple-600 hover:bg-[#1a0a2e] hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(168,85,247,0.22)] transition-all duration-200 cursor-pointer"
                        >
                          <img src={item.image} alt={item.name} loading="lazy" className="w-11 h-11 object-cover rounded bg-gray-800" />
                          <div className="flex-grow">
                            <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                            <span className="text-purple-400 text-xs font-extrabold">LE {item.price}.00</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="bg-white text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:bg-purple-600 hover:text-white hover:scale-110 transition-all cursor-pointer" aria-label={`Add ${item.name} to cart`}>🛒</button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-5 text-xs text-gray-400">No products found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div onClick={() => setShowTrackOrderModal(true)} className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5 hidden md:flex">
            <span className="text-base">📦</span>
            <span className="hidden lg:inline">TRACK</span>
          </div>

          <div className="relative" ref={notificationsRef}>
            <div onClick={() => { setShowNotifications(!showNotifications); setShowSearchDropdown(false); setShowAccountDropdown(false); }} className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5 relative">
              <span className="text-base">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {showNotifications && (
              <div className="absolute right-0 mt-3 bg-[#0d0617] border border-purple-950 shadow-2xl z-50 rounded-md overflow-hidden text-white text-left" style={{ width: '320px', maxWidth: '90vw' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-purple-950 bg-[#10061d]">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase">Notifications</h3>
                  <button onClick={() => setReadNotificationIds(notifications.map(n => n.id))} className="text-[10px] text-purple-400 hover:text-purple-300">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 border-b border-purple-950/50 hover:bg-[#140822] cursor-pointer transition-colors ${!notif.read ? 'bg-[#1a0a2e]' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">
                          {notif.type === 'stock' ? '🔔' : notif.type === 'cart' ? '🛒' : notif.type === 'coupon' ? '🎁' : '📦'}
                        </span>
                        <div className="flex-grow">
                          <p className="text-xs text-gray-200">{notif.message}</p>
                          <span className="text-[10px] text-gray-500">{notif.time}</span>
                        </div>
                        {!notif.read && <span className="w-2 h-2 bg-purple-500 rounded-full"></span>}
                      </div>
                    </div>
                  )) : (
                    <p className="px-4 py-8 text-center text-xs text-gray-500">لا توجد إشعارات جديدة</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={accountRef}>
            <div onClick={() => { setShowAccountDropdown(!showAccountDropdown); setShowSearchDropdown(false); setShowNotifications(false); }} className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5">
              <span className="text-base">👤</span>
              <span className="hidden sm:inline">LOGIN</span>
            </div>
            {showAccountDropdown && (
              <div className="absolute right-0 mt-3 bg-[#0d0617] border border-purple-950 shadow-2xl z-50 rounded-md overflow-hidden text-white text-left" style={{ width: '280px', maxWidth: '92vw' }}>
                <div className="p-4 bg-[#10061d] border-b border-purple-950">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase">Quick Actions</h3>
                </div>
                <div className="divide-y divide-purple-950/60 bg-[#0d0617] text-xs font-bold uppercase tracking-wider">
                  <div onClick={() => { setShowAccountDropdown(false); }} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-gray-200 flex items-center gap-2">
                    <span>👤</span> My Account
                  </div>
                  <div onClick={() => { setShowAccountDropdown(false); setShowTrackOrderModal(true); }} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-gray-200 flex items-center gap-2">
                    <span>📦</span> Track Order
                  </div>
                  <div onClick={() => { setShowAccountDropdown(false); setShowWishlistModal(true); }} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-gray-200 flex items-center gap-2">
                    <span>❤️</span> Wishlist ({wishlist.length})
                  </div>
                  <div onClick={() => setShowAccountDropdown(false)} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-gray-200 flex items-center gap-2">
                    <span>🔄</span> Returns
                  </div>
                  <div onClick={() => setShowAccountDropdown(false)} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-gray-200 flex items-center gap-2">
                    <span>❓</span> Help & FAQ
                  </div>
                  <div onClick={() => setShowAccountDropdown(false)} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-red-400 flex items-center gap-2">
                    <span>🚪</span> Logout
                  </div>
                  <div onClick={() => { setShowAccountDropdown(false); setShowAdminPanel(true); }} className="px-4 py-3 hover:bg-[#140822] cursor-pointer text-purple-300 flex items-center gap-2">
                    <span>⚙️</span> Admin Panel
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5 hidden sm:flex"
            onClick={() => setShowWishlistModal(true)}
          >
            <span className="text-base">♡</span>
            <span className="hidden md:inline">WISHLIST ({wishlist.length})</span>
          </div>
          <div
            className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5 relative"
            onClick={() => setShowCartModal(true)}
          >
            <span className="text-base">🛒</span>
            <span className="hidden md:inline">CART ({cartCount})</span>
          </div>
        </div>
      </header>

      {showTrackOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0617] border border-purple-950 rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => { setShowTrackOrderModal(false); setOrderStatus(null); setTrackOrderNumber(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-black uppercase tracking-wider mb-6 text-purple-400">Track Your Order</h2>

            {!orderStatus ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Order Number</label>
                  <input
                    type="text"
                    value={trackOrderNumber}
                    onChange={(e) => setTrackOrderNumber(e.target.value)}
                    placeholder="Enter order number (e.g., #12345)"
                    className="w-full bg-[#12071f] border border-purple-900 text-white px-4 py-3 text-sm outline-none focus:border-purple-500 rounded"
                  />
                </div>
                <button
                  onClick={handleTrackOrder}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded text-sm uppercase tracking-wider"
                >
                  Track Order
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400 mb-1">Order {trackOrderNumber}</p>
                  <p className="text-sm font-bold text-purple-400">In Transit</p>
                </div>
                <div className="space-y-3">
                  {orderStatus.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step.completed ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                        {step.completed ? '✓' : idx + 1}
                      </div>
                      <div className="flex-grow">
                        <p className={`text-xs font-bold ${step.completed ? 'text-white' : 'text-gray-500'}`}>{step.status}</p>
                        <p className="text-[10px] text-gray-500">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[55] md:hidden">
          <button aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/75" />
          <aside className="relative h-full w-[84%] max-w-sm bg-[#0b0716] text-white shadow-2xl shadow-purple-950/40 overflow-y-auto animate-[slideInLeft_250ms_ease-out]">
            <div className="flex justify-between items-center px-8 py-7 border-b border-purple-900/50">
              <span className="text-xl font-black italic tracking-[0.22em] text-white">MOSCOW</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-3xl font-light leading-none text-purple-300 hover:text-white transition-colors p-1" aria-label="Close menu">×</button>
            </div>
            <nav className="px-8 pt-4">
              {[
                ['MEN ALL', () => { setShowMenModal(true); setMenSubCategory('ALL'); setMobileMenuOpen(false); }],
                ['WOMEN ALL', () => { setShowAllModal(true); setMobileMenuOpen(false); }],
                ['T-SHIRTS', () => { setShowAllModal(true); setActiveTab('T-SHIRTS'); setMobileMenuOpen(false); }],
                ['HOODIES', () => { setShowAllModal(true); setActiveTab('HOODIES'); setMobileMenuOpen(false); }],
                ['JACKETS', () => { setShowAllModal(true); setActiveTab('JACKETS'); setMobileMenuOpen(false); }],
                ['PANTS', () => { setShowAllModal(true); setActiveTab('PANTS'); setMobileMenuOpen(false); }],
                ['CAPS', () => { setShowAllModal(true); setActiveTab('CAPS'); setMobileMenuOpen(false); }],
              ].map(([label, action]) => (
                <button key={label} onClick={action} className="w-full text-left py-5 border-t border-purple-900/50 text-purple-100 text-2xl tracking-[0.18em] font-light hover:text-purple-400 transition-colors">
                  {label}
                </button>
              ))}
              <button onClick={() => { setMobileMenuOpen(false); setShowTrackOrderModal(true); }} className="w-full text-left py-5 border-t border-purple-900/50 text-xl tracking-[0.12em] font-light text-gray-300 hover:text-purple-400 transition-colors">
                TRACK ORDER
              </button>
              <button onClick={() => { setMobileMenuOpen(false); setShowWishlistModal(true); }} className="w-full text-left py-5 border-t border-purple-900/50 text-xl tracking-[0.12em] font-light text-gray-300 hover:text-purple-400 transition-colors">
                WISHLIST ({wishlist.length})
              </button>
              <div className="grid grid-cols-2 border-y border-purple-900/50 mt-2">
                <button onClick={() => { setMobileMenuOpen(false); setShowWishlistModal(true); }} className="text-left p-5 text-lg text-gray-300 border-r border-purple-900/50 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">Wishlist</button>
                <button onClick={() => { setMobileMenuOpen(false); setShowAccountDropdown(true); }} className="text-left p-5 text-lg text-gray-300 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">Log in</button>
              </div>
              <div className="flex gap-8 py-7 text-2xl text-purple-300">
                <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">◎</a>
                <a href="#" aria-label="Facebook" className="hover:text-white transition-colors font-bold">f</a>
              </div>
            </nav>
          </aside>
          <style>{`@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
        </div>
      )}

      <section className="relative h-[88vh] w-full flex flex-col justify-between items-center text-center pt-16 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/product1.jpg" alt="Moscow Anime Streetwear Summer Collection Hero Background" loading="lazy" className="w-full h-full object-cover object-center brightness-75 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30"></div>
        </div>
        <div></div>
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <div className="inline-block bg-[#2d1244]/90 border border-purple-500/60 px-4 py-1.5 text-[11px] uppercase tracking-widest text-purple-200 rounded-full shadow-lg">
            🔥 DROP LIVE NOW — LIMITED QUANTITIES AVAILABLE
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)]">
            HOT DAYS <br />
            <span className="text-transparent" style={{ WebkitTextStroke: '2px #c084fc', textShadow: '0 4px 20px rgba(168,85,247,0.5)' }}>COLD DROPS</span>
          </h1>
          <p className="text-gray-200 text-xs md:text-sm tracking-wide font-medium max-w-lg mx-auto drop-shadow-md">
            Heavyweight cotton, oversized cuts, and exclusive anime artwork. No restocks once sold out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
            <button onClick={() => { setShowMenModal(true); setMenSubCategory('ALL'); }} className="bg-[#581c87] hover:bg-[#6b21a8] text-white font-bold py-3.5 px-8 tracking-widest uppercase transition-all shadow-2xl border border-purple-500 text-xs cursor-pointer rounded">
              SHOP MEN'S DROP
            </button>
            <button onClick={() => setShowAllModal(true)} className="bg-transparent hover:bg-white/10 text-white font-bold py-3.5 px-8 tracking-widest uppercase transition-all border border-white/80 text-xs cursor-pointer rounded shadow-lg">
              SHOP ALL
            </button>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer mb-8" onClick={() => window.scrollBy({ top: 600, behavior: 'smooth' })}>
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-purple-300">SCROLL TO EXPLORE</span>
          <div className="w-5 h-8 border-2 border-purple-400/70 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-purple-400 rounded-full" style={{ animation: 'bounceSlow 1.5s infinite' }}></div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="flex justify-between items-end mb-6 border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[11px] text-purple-400 tracking-widest uppercase font-bold">01 — IN SEASON</span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide mt-0.5 text-white">SUMMER COLLECTION</h2>
          </div>
          <div className="flex items-center gap-6">
            <span onClick={() => setShowAllModal(true)} className="text-xs tracking-widest uppercase font-bold text-white cursor-pointer hover:text-purple-400 hidden sm:inline">SHOP SUMMER</span>
            <div className="flex gap-1.5">
              <button onClick={() => scrollLeft(scrollRef)} aria-label="Scroll left" className="bg-[#2d1244] hover:bg-purple-700 text-white w-8 h-8 flex items-center justify-center border border-purple-600 transition-colors text-xs cursor-pointer rounded">←</button>
              <button onClick={() => scrollRight(scrollRef)} aria-label="Scroll right" className="bg-[#2d1244] hover:bg-purple-700 text-white w-8 h-8 flex items-center justify-center border border-purple-600 transition-colors text-xs cursor-pointer rounded">→</button>
            </div>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((item) => (
            <div key={item.id} className="w-[260px] md:w-[280px] flex-shrink-0">
              <ProductCard item={item} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} openProductDetail={openProductDetail} />
            </div>
          ))}
        </div>
      </section>

      <section className="w-full bg-[#0d0617] border-y border-purple-950 py-16 px-8 my-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tight uppercase text-white">DROPS SELL OUT FAST</h2>
            <p className="text-gray-300 text-sm md:text-base font-normal leading-relaxed">Every design is a limited run. No restocks, no second chances — when it's gone, it's gone.</p>

            <div className="flex items-center gap-3 pt-2">
              <div className="bg-black/60 border border-purple-900 px-3 py-2 rounded text-center min-w-[60px]">
                <span className="text-lg font-black text-purple-300">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="block text-[9px] text-gray-400 uppercase">Hours</span>
              </div>
              <span className="text-purple-400 font-bold text-xl">:</span>
              <div className="bg-black/60 border border-purple-900 px-3 py-2 rounded text-center min-w-[60px]">
                <span className="text-lg font-black text-purple-300">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="block text-[9px] text-gray-400 uppercase">Mins</span>
              </div>
              <span className="text-purple-400 font-bold text-xl">:</span>
              <div className="bg-black/60 border border-purple-900 px-3 py-2 rounded text-center min-w-[60px]">
                <span className="text-lg font-black text-purple-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="block text-[9px] text-gray-400 uppercase">Secs</span>
              </div>
            </div>
          </div>

          <button onClick={() => setShowAllModal(true)} className="bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-extrabold py-4 px-10 tracking-widest uppercase text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(126,34,206,0.4)] hover:shadow-[0_0_30px_rgba(126,34,206,0.6)] rounded-lg transform hover:-translate-y-0.5">
            SHOP THE LATEST DROP
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[11px] text-purple-400 tracking-widest uppercase font-bold">02 — BROWSE</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider mt-1 text-white">
              SHOP BY <span className="text-purple-300">TYPE</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-10 overflow-x-auto border-b border-zinc-800 pb-4 mb-8">
          {Object.keys(typeCategories).map((category) => {
            const isActive = activeTab === category;
            return (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`flex items-center gap-2 text-base md:text-lg font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-all pb-1 border-b-2 ${
                  isActive ? 'text-white border-purple-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                <span>{categoryIcons[category]}</span>
                <span>{category}</span>
                <span className={`text-xs font-semibold ${isActive ? 'text-purple-400' : 'text-zinc-600'}`}>
                  {counts[category]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {typeCategories[activeTab].map((item) => (
            <ProductCard key={item.id} item={item} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} openProductDetail={openProductDetail} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 w-full border-t border-zinc-900">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-[11px] text-purple-400 tracking-widest uppercase font-bold">04 — MOST WANTED</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wider mt-1 text-white">BEST SELLERS</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-1.5">
              <button onClick={() => scrollLeft(bestSellersScrollRef)} aria-label="Scroll left" className="bg-[#2d1244] hover:bg-purple-700 text-white w-8 h-8 flex items-center justify-center border border-purple-600 transition-colors text-xs cursor-pointer rounded">←</button>
              <button onClick={() => scrollRight(bestSellersScrollRef)} aria-label="Scroll right" className="bg-[#2d1244] hover:bg-purple-700 text-white w-8 h-8 flex items-center justify-center border border-purple-600 transition-colors text-xs cursor-pointer rounded">→</button>
            </div>
          </div>
        </div>
        <div ref={bestSellersScrollRef} className="flex gap-5 overflow-x-auto scroll-smooth pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {bestSellers.map((item) => (
            <div key={item.id} className="w-[260px] md:w-[280px] flex-shrink-0">
              <ProductCard item={item} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} openProductDetail={openProductDetail} />
            </div>
          ))}
        </div>
      </section>

      {showMenModal && (
        <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
          <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">MEN'S DEPARTMENT — PROFESSIONAL E-COMMERCE VIEW</div>
          <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowMenModal(false)}>
              <span className="text-lg font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
              <span className="text-xs font-black tracking-[0.25em] uppercase text-white">/ MEN</span>
            </div>
            <button onClick={() => setMobileFilterOpen(true)} className="lg:hidden bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">️ Filters</button>
          </div>
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 space-y-8 flex-grow">
            <div className="space-y-4 border-b border-purple-950 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">MEN'S COLLECTION</h1>
                  <p className="text-gray-400 text-xs mt-1">Explore all subcategories, use advanced filters (Sizes, Colors, Stock, Rating), and sorting options.</p>
                </div>
                <div className="flex items-center gap-3 bg-[#12071f] border border-purple-900 px-4 py-2 rounded text-xs">
                  <span className="text-gray-400 font-bold uppercase">Sort by:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-white font-bold outline-none cursor-pointer uppercase">
                    <option value="newest" className="bg-[#12071f]">Newest</option>
                    <option value="price-low" className="bg-[#12071f]">Price: Low to High</option>
                    <option value="price-high" className="bg-[#12071f]">Price: High to Low</option>
                    <option value="best-sellers" className="bg-[#12071f]">Top Rated</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pt-2 pb-1" style={{ scrollbarWidth: 'none' }}>
                <button onClick={() => setMenSubCategory('ALL')} className={`px-4 py-2 rounded text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${menSubCategory === 'ALL' ? 'bg-purple-600 text-white' : 'bg-[#12071f] text-gray-300 hover:bg-purple-950'}`}>All Men ({allMenProducts.length})</button>
                {Object.keys(typeCategories).map((subCat) => (
                  <button key={subCat} onClick={() => setMenSubCategory(subCat)} className={`px-4 py-2 rounded text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${menSubCategory === subCat ? 'bg-purple-600 text-white' : 'bg-[#12071f] text-gray-300 hover:bg-purple-950'}`}>{subCat}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className={`lg:col-span-1 space-y-6 bg-[#0d0617] border border-purple-950 p-5 rounded-xl h-fit fixed inset-y-0 left-0 z-50 w-80 bg-black p-6 overflow-y-auto transition-transform duration-300 lg:static lg:w-auto lg:translate-x-0 lg:bg-[#0d0617] ${mobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center justify-between border-b border-purple-950 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-300">Filters</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedSizes([]); setSelectedColors([]); setAvailability('ALL'); setMinRating(0); }} className="text-[10px] text-gray-400 hover:text-white underline uppercase cursor-pointer">Reset All</button>
                    <button
                      onClick={() => setMobileFilterOpen(false)}
                      className="lg:hidden bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider"
                      aria-label="Close filters"
                    >
                      Close ✕
                    </button>
                  </div>
                </div>
                <div className="space-y-2 border-b border-purple-950 pb-4">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-300 uppercase">Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <button key={size} onClick={() => toggleSizeFilter(size)} className={`w-9 h-9 rounded text-xs font-bold transition-all cursor-pointer border ${selectedSizes.includes(size) ? 'bg-purple-600 text-white border-purple-500' : 'bg-[#140822] text-gray-300 border-purple-950 hover:border-purple-600'}`}>{size}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-b border-purple-950 pb-4">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-300 uppercase">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Black', 'White', 'Purple', 'Red', 'Green'].map((color) => (
                      <button key={color} onClick={() => toggleColorFilter(color)} className={`px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer border uppercase ${selectedColors.includes(color) ? 'bg-purple-600 text-white border-purple-400' : 'bg-[#140822] text-gray-300 border-purple-950 hover:border-purple-600'}`}>{color}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 border-b border-purple-950 pb-4">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-300 uppercase">Availability</h4>
                  <div className="space-y-1.5 text-xs text-gray-300">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="availability" checked={availability === 'ALL'} onChange={() => setAvailability('ALL')} className="accent-purple-600" /><span>All Items</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="availability" checked={availability === 'IN_STOCK'} onChange={() => setAvailability('IN_STOCK')} className="accent-purple-600" /><span>In Stock Only</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="availability" checked={availability === 'OUT_OF_STOCK'} onChange={() => setAvailability('OUT_OF_STOCK')} className="accent-purple-600" /><span>Out of Stock</span></label>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-300 uppercase">Minimum Rating</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 4.0, 4.5, 4.8].map((rate) => (
                      <button key={rate} onClick={() => setMinRating(rate)} className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${minRating === rate ? 'bg-amber-500 text-black border-amber-400' : 'bg-[#140822] text-gray-300 border-purple-950'}`}>{rate === 0 ? 'All' : `${rate}+ ★`}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="flex justify-between items-center mb-4 text-xs text-gray-400">
                  <span>Showing <strong className="text-white">{getFilteredMenProducts().length}</strong> products</span>
                </div>
                {getFilteredMenProducts().length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {getFilteredMenProducts().map((item, idx) => (<ProductCard key={`${item.id}-${idx}`} item={item} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} openProductDetail={openProductDetail} />))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-[#0d0617] border border-purple-950 rounded-xl">
                    <p className="text-sm text-gray-400 font-bold uppercase">No products match your selected filters</p>
                    <button onClick={() => { setSelectedSizes([]); setSelectedColors([]); setAvailability('ALL'); setMinRating(0); setMenSubCategory('ALL'); }} className="mt-4 bg-purple-600 text-white px-5 py-2 text-xs font-bold uppercase rounded cursor-pointer">Clear All Filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <FooterContent timeLeft={timeLeft} setShowAllModal={setShowAllModal} />
        </div>
      )}

      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
          <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">LIMITED DROPS — NO RESTOCKS</div>
          <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
            <div onClick={() => setShowAllModal(false)} className="cursor-pointer">
              <span className="text-xl font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
            </div>
            <button onClick={() => setShowAllModal(false)} className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase">Close X</button>
          </div>
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-10 mb-8">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">ALL PRODUCTS</h1>
            {productsLoading && <p className="text-sm text-purple-200" role="status">Loading products...</p>}
            {productsError && <p className="text-xs text-amber-300" role="alert">{productsError}</p>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto w-full px-6 md:px-12 pb-16">
            {allProductsCombined.length > 0 ? allProductsCombined.map((item, index) => (<ProductCard key={`${item.id}-${index}`} item={item} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} openProductDetail={openProductDetail} />)) : <p className="col-span-full py-20 text-center text-gray-400">No products available.</p>}
          </div>
          <FooterContent timeLeft={timeLeft} setShowAllModal={setShowAllModal} />
        </div>
      )}

      {showWishlistModal && (
        <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
          <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">
            YOUR WISHLIST
          </div>
          <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
              <span className="text-xs font-black tracking-[0.25em] uppercase text-white">/ WISHLIST</span>
            </div>
            <button
              onClick={() => setShowWishlistModal(false)}
              className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase"
            >
              Close ✕
            </button>
          </div>
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 flex-grow">
            {wishlist.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-4">Your wishlist is empty</p>
                <button
                  onClick={() => setShowWishlistModal(false)}
                  className="bg-purple-600 text-white px-6 py-3 rounded text-sm font-bold uppercase"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => wishlistProducts.forEach(item => addToCart(item))}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded text-xs font-bold uppercase"
                  >
                    Add All to Cart
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {wishlistProducts.map((item) => (
                    <div key={item.id} className="bg-[#0d0617] border border-purple-950 rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-purple-600 hover:shadow-[0_0_25px_rgba(168,85,247,0.28)]">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={item.image} alt={item.name} onError={(event) => { event.currentTarget.src = '/images/product1.jpg'; }} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-xs font-bold text-white mb-2">{item.name}</h3>
                        <p className="text-purple-400 font-bold text-sm mb-3">LE {item.price}.00</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { addToCart(item); toggleWishlist(item.id); }}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 hover:-translate-y-0.5 hover:shadow-lg text-white py-2 rounded text-xs font-bold transition-all duration-200"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => toggleWishlist(item.id)}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-lg leading-none"
                            aria-label={`Remove ${item.name} from wishlist`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
          <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">
            YOUR CART
          </div>
          <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
              <span className="text-xs font-black tracking-[0.25em] uppercase text-white">/ CART</span>
            </div>
            <button
              onClick={() => setShowCartModal(false)}
              className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase"
            >
              Close ✕
            </button>
          </div>
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 flex-grow">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="bg-purple-600 hover:bg-purple-500 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(168,85,247,0.45)] text-white px-6 py-3 rounded text-sm font-bold uppercase transition-all duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((item) => (
                    <div key={item.cartId} className="flex gap-4 items-center bg-[#0d0617] border border-purple-950 rounded-lg p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-600 hover:shadow-[0_0_22px_rgba(168,85,247,0.25)]">
                      <img src={item.image} alt={item.name} onError={(event) => { event.currentTarget.src = '/images/product1.jpg'; }} className="w-20 h-24 object-cover rounded bg-gray-900 shrink-0 transition-transform duration-300 hover:scale-105" />
                      <div className="flex-grow min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">Size: {item.size} {item.color ? `· ${item.color}` : ''}</p>
                        <p className="text-purple-400 font-bold text-sm mt-2">LE {item.price.toLocaleString()}.00</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQuantity(item.cartId, -1)} className="w-8 h-8 rounded border border-purple-800 text-white hover:bg-purple-700 hover:scale-110 transition-all" aria-label={`Decrease ${item.name} quantity`}>−</button>
                        <span className="w-6 text-center text-white font-bold">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.cartId, 1)} className="w-8 h-8 rounded border border-purple-800 text-white hover:bg-purple-700 hover:scale-110 transition-all" aria-label={`Increase ${item.name} quantity`}>+</button>
                      </div>
                      <button onClick={() => removeCartItem(item.cartId)} className="text-red-400 hover:text-red-300 hover:bg-red-950/40 hover:scale-110 rounded text-xl px-2 transition-all" aria-label={`Remove ${item.name}`}>×</button>
                    </div>
                  ))}
                </div>
                <div className="bg-[#0d0617] border border-purple-950 rounded-lg p-6 h-fit lg:sticky lg:top-24">
                  <h3 className="text-sm font-black uppercase tracking-widest text-purple-300 border-b border-purple-950 pb-3">Cart Summary</h3>
                  <div className="flex justify-between text-sm text-gray-300 mt-5">
                    <span>Items ({cartCount})</span>
                    <span>LE {cartSubtotal.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-white border-t border-purple-950 mt-4 pt-4">
                    <span>Total</span>
                    <span className="text-purple-400">LE {cartSubtotal.toLocaleString()}.00</span>
                  </div>
                  <button onClick={() => { setShowCartModal(false); setShowCheckoutModal(true); }} className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded text-sm font-bold uppercase">
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <a
        href="https://wa.me/201067546590"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 animate-[bounceSlow_2s_infinite]"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      <ProductDetailModal
        showProductDetail={showProductDetail}
        selectedProduct={selectedProduct}
        closeProductDetail={closeProductDetail}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        showSizeError={showSizeError}
        setShowSizeError={setShowSizeError}
        quantity={quantity}
        setQuantity={setQuantity}
        activeImage={activeImage}
        setActiveImage={setActiveImage}
        addToCartFromDetail={addToCartFromDetail}
        allProductsCombined={allProductsCombined}
        openProductDetail={openProductDetail}
        timeLeft={timeLeft}
        setShowAllModal={setShowAllModal}
      />

      {showCheckoutModal && (
        <CheckoutModal
          cart={cart}
          cartSubtotal={cartSubtotal}
          onClose={() => setShowCheckoutModal(false)}
          onOrderPlaced={(orderNumber) => {
            if (orderNumber) localStorage.setItem('moscow-last-order', orderNumber);
            setCart([]);
            setShowCheckoutModal(false);
          }}
        />
      )}

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}

      <FooterContent timeLeft={timeLeft} setShowAllModal={setShowAllModal} />
    </div>
  );
}
