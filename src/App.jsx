import React, { useState, useRef, useEffect } from 'react';

// ==================== DATA (moved outside so components below can reference types if needed) ====================

const renderRatingStars = (rating = 4.5) => (
  <div className="flex items-center gap-1 text-[10px] text-amber-400">
    <span>★</span>
    <span className="text-gray-300 font-bold">{rating.toFixed(1)}</span>
  </div>
);

// ==================== ProductCard (moved OUTSIDE App) ====================
const ProductCard = ({ item, wishlist, toggleWishlist, addToCart, openProductDetail }) => {
  const isWishlisted = wishlist.includes(item.id);
  const discount = item.oldPrice ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0;

  return (
    <div
      onClick={() => openProductDetail(item)}
      className="bg-[#0d0617] border border-purple-950 flex flex-col group relative transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:-translate-y-1 hover:border-purple-600 rounded-lg overflow-hidden cursor-pointer"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-900">
        {item.tag && (
          <span className="absolute top-2 left-2 z-10 bg-purple-600 text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest text-white rounded shadow-lg">{item.tag}</span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id, e); }}
          aria-label="Add to wishlist"
          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer backdrop-blur-sm"
        >
          <span className={`text-lg transition-colors ${isWishlisted ? "text-red-500" : "text-white"}`}>
            {isWishlisted ? "❤️" : "♡"}
          </span>
        </button>

        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-md p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-gray-300 uppercase hidden sm:inline">Quick View</span>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(e); }}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
          >
            <span>🛒</span> Quick Add
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow space-y-2">
        <div>
          {renderRatingStars(item.rating)}
          <h3 className="text-xs font-bold uppercase tracking-wider text-white line-clamp-1 mt-1 group-hover:text-purple-300 transition-colors">{item.name}</h3>

          {item.availableColors && (
            <div className="flex items-center gap-2 mt-2">
              {item.availableColors.map((col, idx) => (
                <span
                  key={idx}
                  className="w-4 h-4 rounded-full border border-white/20 ring-1 ring-transparent hover:ring-purple-400 transition-all cursor-pointer"
                  style={{ backgroundColor: col }}
                  title={col}
                ></span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-purple-400 font-extrabold text-sm">LE {item.price.toLocaleString()}.00</span>
            {item.oldPrice && (
              <>
                <span className="text-gray-500 text-[11px] line-through decoration-red-500/70">LE {item.oldPrice.toLocaleString()}.00</span>
                <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/30">-{discount}%</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== FooterContent (moved OUTSIDE App) ====================
const FooterContent = ({ timeLeft, setShowAllModal }) => (
  <footer className="bg-[#05020a] border-t border-purple-900/40 text-white pt-14 pb-8 px-6 md:px-12 w-full">
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#12071f] border border-purple-950 p-4 rounded-xl">
        <div className="flex items-center gap-3 border-r border-purple-950/80 pr-2">
          <svg className="w-7 h-7 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <div className="text-[11px] uppercase font-bold tracking-wider text-gray-300">CASH ON DELIVERY</div>
        </div>
        <div className="flex items-center gap-3 border-r border-purple-950/80 pr-2">
          <svg className="w-7 h-7 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
          <div className="text-[11px] uppercase font-bold tracking-wider text-gray-300">2-5 DAY DELIVERY</div>
        </div>
        <div className="flex items-center gap-3 border-r border-purple-950/80 pr-2">
          <svg className="w-7 h-7 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <div className="text-[11px] uppercase font-bold tracking-wider text-gray-300">EASY EXCHANGES</div>
        </div>
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div className="text-[11px] uppercase font-bold tracking-wider text-gray-300">FREE REPLACEMENT</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#12071f] border border-purple-900/60 p-8 rounded-2xl">
        <div className="space-y-3">
          <span className="text-purple-400 text-xs font-extrabold uppercase tracking-widest">⚡ NEXT DROP COUNTDOWN</span>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">GET THE DROP FIRST</h3>
          <p className="text-gray-400 text-xs md:text-sm">Restock alerts, early access and fan-only discounts before anyone else.</p>

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

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your email for VIP access..."
              className="bg-black/80 border border-purple-900/80 text-white px-4 py-3.5 text-xs flex-grow outline-none focus:border-purple-500 placeholder-gray-500 rounded"
            />
            <button className="bg-[#581c87] hover:bg-purple-700 text-white font-black px-6 py-3.5 text-xs uppercase tracking-widest flex items-center justify-center cursor-pointer transition-colors rounded shadow-lg">
              SUBSCRIBE →
            </button>
          </div>
          <p className="text-[10px] text-gray-500">By subscribing you agree to receive promotional drops. Unsubscribe anytime.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pt-6 border-t border-purple-950">
        <div className="space-y-4 md:col-span-1">
          <div className="text-2xl font-black italic tracking-widest text-white">MOSCOW</div>
          <p className="text-gray-400 text-xs leading-relaxed">Anime streetwear built for people who actually watch the show. Heavyweight fabric, limited runs, shipped across Egypt.</p>
          <div className="flex items-center gap-4 text-lg text-gray-300 pt-2">
            <span className="hover:text-purple-400 cursor-pointer transition-colors"></span>
            <span className="hover:text-purple-400 cursor-pointer transition-colors"></span>
            <span className="hover:text-purple-400 cursor-pointer transition-colors"></span>
            <span className="hover:text-purple-400 cursor-pointer transition-colors">⭕</span>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-[11px] font-extrabold tracking-widest text-purple-400 uppercase">SHOP</h4>
          <ul className="space-y-2 text-xs font-medium text-gray-300">
            <li onClick={() => { setShowAllModal(true); window.scrollTo(0,0); }} className="hover:text-white cursor-pointer transition-colors">Shop All</li>
            <li className="hover:text-white cursor-pointer transition-colors">Shop by Anime</li>
            <li className="hover:text-white cursor-pointer transition-colors">Shop by Type</li>
            <li className="hover:text-white cursor-pointer transition-colors">Our Collections</li>
            <li className="hover:text-white cursor-pointer transition-colors">Accessories</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-[11px] font-extrabold tracking-widest text-purple-400 uppercase">CUSTOMER CARE</h4>
          <ul className="space-y-2 text-xs font-medium text-gray-300">
            <li className="hover:text-white cursor-pointer transition-colors">Customer Reviews</li>
            <li className="hover:text-white cursor-pointer transition-colors">About us</li>
            <li className="hover:text-white cursor-pointer transition-colors">Contact us</li>
            <li className="hover:text-white cursor-pointer transition-colors">FAQs</li>
            <li className="hover:text-white font-bold cursor-pointer pt-1 transition-colors">+20 106 7546590</li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-[11px] font-extrabold tracking-widest text-purple-400 uppercase">OUR POLICY</h4>
          <ul className="space-y-2 text-xs font-medium text-gray-300">
            <li className="hover:text-white cursor-pointer transition-colors">Return & Exchange</li>
            <li className="hover:text-white cursor-pointer transition-colors">Shipping & Delivery</li>
            <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
            <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-purple-950 pt-6 text-center text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
        © 2026 MOSCOW. All Rights Reserved.
      </div>
    </div>
  </footer>
);

// ==================== ProductDetailModal (moved OUTSIDE App) ====================
const ProductDetailModal = ({
  showProductDetail,
  selectedProduct,
  closeProductDetail,
  wishlist,
  toggleWishlist,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  showSizeError,
  setShowSizeError,
  quantity,
  setQuantity,
  activeImage,
  setActiveImage,
  addToCartFromDetail,
  allProductsCombined,
  openProductDetail,
  timeLeft,
  setShowAllModal,
}) => {
  if (!showProductDetail || !selectedProduct) return null;

  const product = selectedProduct;
  const isWishlisted = wishlist.includes(product.id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  const productImages = [
    product.image,
    product.image,
    product.image,
    product.image
  ];

  const relatedProducts = allProductsCombined
    .filter(item => item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
      <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">
        {product.tag || 'LIMITED EDITION'} — {product.inStock ? 'IN STOCK' : 'SOLD OUT'}
      </div>

      <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
        <div className="text-xl font-black tracking-[0.25em] uppercase text-white cursor-pointer" onClick={closeProductDetail}>
          MOSCOW
        </div>
        <button
          onClick={closeProductDetail}
          className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase hover:bg-purple-400 transition-colors"
        >
          Close ✕
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 flex-grow">

        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <span onClick={() => closeProductDetail()} className="hover:text-purple-400 cursor-pointer">Home</span>
          <span>/</span>
          <span className="hover:text-purple-400 cursor-pointer">Men</span>
          <span>/</span>
          <span className="text-purple-400">{product.category || 'Product'}</span>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-[#0d0617] rounded-lg overflow-hidden border border-purple-950">
              {product.tag && (
                <span className="absolute top-4 left-4 z-10 bg-purple-600 text-xs font-bold px-3 py-1.5 uppercase tracking-widest text-white rounded shadow-lg">
                  {product.tag}
                </span>
              )}
              <img
                src={productImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-purple-500' : 'border-purple-950 hover:border-purple-600'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-400">
                  <span>★</span>
                  <span className="text-sm font-bold text-white">{product.rating}</span>
                </div>
                <span className="text-xs text-gray-400">(127 reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-purple-400">LE {product.price.toLocaleString()}.00</span>
              {product.oldPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">LE {product.oldPrice.toLocaleString()}.00</span>
                  <span className="bg-red-500/20 text-red-400 text-sm font-black px-2 py-1 rounded border border-red-500/30">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              {product.description || "Premium heavyweight cotton oversized tee featuring exclusive anime artwork. Limited edition drop - no restocks once sold out."}
            </p>

            {product.availableColors && product.availableColors.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3">
                  Color: <span className="text-purple-400">{selectedColor || 'Select a color'}</span>
                </h3>
                <div className="flex gap-3">
                  {product.availableColors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-purple-500 ring-2 ring-purple-500/50'
                          : 'border-gray-600 hover:border-purple-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">
                  Size: <span className="text-purple-400">{selectedSize || 'Select a size'}</span>
                </h3>
                <button className="text-xs text-purple-400 hover:text-purple-300 underline">Size Guide</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setShowSizeError(false); }}
                    className={`min-w-[50px] h-12 rounded border-2 text-sm font-bold transition-all ${
                      selectedSize === size
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : showSizeError
                        ? 'border-red-500 text-gray-300 hover:border-purple-400'
                        : 'border-purple-950 text-gray-300 hover:border-purple-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {showSizeError && (
                <p className="text-red-400 text-xs mt-2">⚠️ Please select a size</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3">Quantity</h3>
              <div className="flex items-center gap-3 bg-[#0d0617] border border-purple-950 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 text-lg font-bold hover:text-purple-400 transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 text-lg font-bold hover:text-purple-400 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={addToCartFromDetail}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-4 px-8 rounded-lg uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Add to Cart
              </button>
              <button
                onClick={(e) => toggleWishlist(product.id, e)}
                className="w-14 h-14 border-2 border-purple-950 hover:border-purple-500 rounded-lg flex items-center justify-center text-2xl transition-all hover:scale-110"
              >
                {isWishlisted ? "❤️" : "♡"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-purple-950">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg"></span>
                <span>Free shipping over 1500 LE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg">💵</span>
                <span>Cash on delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg"></span>
                <span>Easy exchanges</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg"></span>
                <span>Limited drop - no restocks</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-purple-950">
            <h2 className="text-2xl font-black uppercase tracking-wider mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { openProductDetail(item); }}
                  className="cursor-pointer group"
                >
                  <div className="aspect-[3/4] bg-[#0d0617] rounded-lg overflow-hidden border border-purple-950 group-hover:border-purple-600 transition-all">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase mt-3 group-hover:text-purple-400 transition-colors">{item.name}</h3>
                  <p className="text-sm text-purple-400 font-bold">LE {item.price}.00</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FooterContent timeLeft={timeLeft} setShowAllModal={setShowAllModal} />
    </div>
  );
};

// ==================== MAIN APP ====================
export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
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

  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "منتج في الـ Wishlist رجع في المخزون!", time: "منذ ساعتين", read: false, type: "stock" },
    { id: 2, message: "عندك كوبون خصم 10% - استخدم كود: WELCOME10", time: "منذ 5 ساعات", read: false, type: "coupon" },
    { id: 3, message: "طلبك #12345 اتشحن!", time: "منذ يوم", read: true, type: "shipping" },
  ]);

  const [language, setLanguage] = useState('AR');
  const [currency, setCurrency] = useState('LE');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

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
      if (language === 'AR' && !document.querySelector('.language-menu')?.contains(event.target)) setShowLanguageMenu(false);
      if (currency === 'LE' && !document.querySelector('.currency-menu')?.contains(event.target)) setShowCurrencyMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [language, currency]);

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
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
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
    setCartCount(prev => prev + quantity);
    alert(`Added ${quantity}x ${selectedProduct.name} (Size: ${selectedSize}) to cart!`);
    closeProductDetail();
  };

  const products = [
    { id: 1, name: "SUMMER COLLECTION TEE", price: 700, oldPrice: null, image: "/images/product1.jpg", tag: "HOT", size: "M", color: "Black", inStock: true, rating: 4.5, availableColors: ["#000", "#fff", "#7e22ce"], description: "Premium heavyweight cotton oversized tee with exclusive summer artwork. Limited edition drop - no restocks once sold out." },
    { id: 2, name: "ULTIMATE BERSERK TEE", price: 750, oldPrice: 1450, image: "/images/product2.jpg", tag: "SALE", size: "L", color: "White", inStock: true, rating: 5.0, availableColors: ["#fff", "#000"], description: "Inspired by the legendary Berserk manga. Heavyweight cotton with detailed anime artwork. A must-have for true fans." },
    { id: 3, name: "LUFFY - STRAW HAT", price: 750, oldPrice: 1250, image: "/images/product3.jpg", tag: "SALE", size: "XL", color: "Red", inStock: false, rating: 4.2, availableColors: ["#dc2626", "#000"], description: "One Piece inspired design featuring Luffy's iconic straw hat. Oversized fit with premium fabric." },
    { id: 4, name: "ZORO ASHU MODE", price: 680, oldPrice: 1450, image: "/images/product4.jpg", tag: "SALE", size: "M", color: "Green", inStock: true, rating: 4.8, availableColors: ["#16a34a", "#000"], description: "Zoro's Ashura mode design in striking green. Limited run with exclusive artwork and premium cotton." },
    { id: 5, name: "DARK STREET OVERSIZED", price: 800, oldPrice: null, image: "/images/product5.jpg", tag: "NEW", size: "XXL", color: "Black", inStock: true, rating: 4.6, availableColors: ["#000", "#7e22ce"], description: "Dark aesthetic streetwear with oversized fit. Perfect for those who appreciate minimal yet bold designs." },
    { id: 6, name: "ANIME VINTAGE TEE", price: 720, oldPrice: 1100, image: "/images/product6.jpg", tag: "SALE", size: "L", color: "Purple", inStock: true, rating: 4.1, availableColors: ["#7e22ce", "#fff"], description: "Vintage anime aesthetic with retro color palette. Soft cotton blend for maximum comfort." },
    { id: 7, name: "SHADOW HUNTER HOODIE", price: 1150, oldPrice: 1600, image: "/images/product7.jpg", tag: "POPULAR", size: "XL", color: "Black", inStock: true, rating: 4.9, availableColors: ["#000", "#dc2626"], description: "Premium hoodie inspired by Shadow Hunter anime. Heavyweight fabric with detailed embroidery." },
    { id: 8, name: "TOKYO REVENGE DROP", price: 790, oldPrice: null, image: "/images/product8.jpg", tag: "LIMITED", size: "S", color: "White", inStock: false, rating: 3.9, availableColors: ["#fff", "#000"], description: "Limited edition Tokyo Revengers collaboration. Only 100 pieces made worldwide." },
    { id: 9, name: "NINJA STREETWEAR", price: 850, oldPrice: 1300, image: "/images/product9.jpg", tag: "SALE", size: "M", color: "Black", inStock: true, rating: 4.4, availableColors: ["#000", "#16a34a"], description: "Naruto-inspired streetwear with modern twist. Oversized fit with premium cotton blend." },
    { id: 10, name: "CYBERPUNK GRAPHIC TEE", price: 740, oldPrice: null, image: "/images/product10.jpg", tag: "NEW", size: "L", color: "Purple", inStock: true, rating: 4.7, availableColors: ["#7e22ce", "#000"], description: "Futuristic cyberpunk design with neon accents. Perfect for tech and anime enthusiasts." },
  ];

  const bestSellers = [
    { id: "b1", name: "ULTIMATE BERSERK TEE", price: 750, oldPrice: 1450, image: "/images/product1.jpg", sizes: ["M", "L", "XL", "XXL"], color: "Black", inStock: true, rating: 5.0, tag: "BESTSELLER", availableColors: ["#000", "#fff"], description: "Our #1 bestseller. Berserk-inspired design with premium heavyweight cotton." },
    { id: "b2", name: "BERSERK ARMOR", price: 750, oldPrice: 1950, image: "/images/product2.jpg", sizes: ["M", "L", "XL", "XXL"], color: "White", inStock: true, rating: 4.9, tag: "BESTSELLER", availableColors: ["#fff", "#7e22ce"], description: "Iconic Berserk armor design. Limited edition with exclusive artwork." },
    { id: "b3", name: "HISOKA TEE", price: 680, oldPrice: 750, image: "/images/product3.jpg", sizes: ["S", "M", "L", "XL", "XXL"], color: "Purple", inStock: true, rating: 4.7, tag: "SALE", availableColors: ["#7e22ce", "#000"], description: "Hunter x Hunter Hisoka design. Vibrant purple with detailed artwork." },
    { id: "b4", name: "IGRIS LEGENDARY", price: 795, oldPrice: 1150, image: "/images/product4.jpg", sizes: ["M", "L", "XL", "XXL"], color: "Black", inStock: true, rating: 4.8, tag: "BESTSELLER", availableColors: ["#000", "#dc2626"], description: "Solo Leveling Igris design. Dark and powerful aesthetic." },
    { id: "b5", name: "PHANTOM TROUPE SPIDERS", price: 680, oldPrice: null, image: "/images/product5.jpg", sizes: ["M", "L", "XL", "XXL"], color: "Red", inStock: false, rating: 4.3, tag: "NEW", availableColors: ["#dc2626", "#000"], description: "Hunter x Hunter Phantom Troupe spider tattoo design. Bold and iconic." },
  ];

  const typeCategories = {
    "T-SHIRTS": [
      { id: "t1", name: "Ultimate Berserk tee", price: 750, oldPrice: 1450, image: "/images/product1.jpg", size: "M", category: "T-SHIRTS", color: "Black", inStock: true, rating: 5.0, tag: "BESTSELLER", availableColors: ["#000", "#fff"], description: "Berserk-inspired design with premium heavyweight cotton." },
      { id: "t2", name: "LUFFY - STRAW HAT", price: 750, oldPrice: 1250, image: "/images/product2.jpg", size: "L", category: "T-SHIRTS", color: "White", inStock: true, rating: 4.5, tag: "SALE", availableColors: ["#fff", "#000"], description: "One Piece Luffy design. Oversized fit with premium fabric." },
      { id: "t3", name: "Zoro Ashura Mode", price: 680, oldPrice: 1450, image: "/images/product3.jpg", size: "XL", category: "T-SHIRTS", color: "Green", inStock: true, rating: 4.8, tag: "HOT", availableColors: ["#16a34a", "#7e22ce"], description: "Zoro's Ashura mode design in striking green." },
      { id: "t4", name: "Berserk ARMOR", price: 750, oldPrice: 1950, image: "/images/product4.jpg", size: "M", category: "T-SHIRTS", color: "Black", inStock: false, rating: 4.2, tag: "SALE", availableColors: ["#000", "#fff"], description: "Iconic Berserk armor design. Limited edition." },
      { id: "t5", name: "Phantom Troupe Spiders", price: 975, oldPrice: null, image: "/images/product5.jpg", size: "XXL", category: "T-SHIRTS", color: "Purple", inStock: true, rating: 4.6, tag: "NEW", availableColors: ["#7e22ce", "#000"], description: "Phantom Troupe spider tattoo design. Bold and iconic." },
    ],
    "HOODIES": [
      { id: "h1", name: "Shadow Hunter Hoodie", price: 1150, oldPrice: 1600, image: "/images/Hoodies1.jpg", size: "L", category: "HOODIES", color: "Black", inStock: true, rating: 4.9, tag: "BESTSELLER", availableColors: ["#000", "#fff"], description: "Premium hoodie inspired by Shadow Hunter anime." },
      { id: "h2", name: "Tokyo Revenge Drop", price: 1100, oldPrice: 1500, image: "/images/Hoodies2.jpg", size: "XL", category: "HOODIES", color: "White", inStock: true, rating: 4.4, tag: "SALE", availableColors: ["#fff", "#000"], description: "Tokyo Revengers collaboration hoodie." },
      { id: "h3", name: "Akatsuki Legend Hoodie", price: 1200, oldPrice: 1700, image: "/images/Hoodies3.jpg", size: "M", category: "HOODIES", color: "Red", inStock: true, rating: 4.7, tag: "NEW", availableColors: ["#dc2626", "#000"], description: "Naruto Akatsuki design. Premium heavyweight hoodie." },
      { id: "h4", name: "Chibi Squad Hoodie", price: 1050, oldPrice: 1400, image: "/images/Hoodies4.jpg", size: "S", category: "HOODIES", color: "Purple", inStock: false, rating: 4.1, tag: "HOT", availableColors: ["#7e22ce", "#fff"], description: "Cute chibi anime characters design." },
    ],
    "JACKETS": [
      { id: "j1", name: "Cyberpunk Utility Jacket", price: 1450, oldPrice: 1900, image: "/images/Jackets1.jpg", size: "XL", category: "JACKETS", color: "Black", inStock: true, rating: 4.8, tag: "BESTSELLER", availableColors: ["#000", "#16a34a"], description: "Futuristic cyberpunk utility jacket with multiple pockets." },
      { id: "j2", name: "Streetwear Bomber Jacket", price: 1350, oldPrice: 1800, image: "/images/Jackets2.jpg", size: "L", category: "JACKETS", color: "Green", inStock: true, rating: 4.5, tag: "SALE", availableColors: ["#16a34a", "#000"], description: "Classic bomber jacket with modern streetwear twist." },
      { id: "j3", name: "Demon Slayer Haori", price: 1250, oldPrice: 1650, image: "/images/Jackets3.jpg", size: "M", category: "JACKETS", color: "White", inStock: true, rating: 4.6, tag: "NEW", availableColors: ["#fff", "#7e22ce"], description: "Demon Slayer inspired haori jacket." },
    ],
    "PANTS": [
      { id: "p1", name: "Cargo Tech Pants", price: 950, oldPrice: 1300, image: "/images/Pants1.jpg", size: "L", category: "PANTS", color: "Black", inStock: true, rating: 4.7, tag: "BESTSELLER", availableColors: ["#000", "#fff"], description: "Tech cargo pants with multiple utility pockets." },
      { id: "p2", name: "Oversized Street Joggers", price: 850, oldPrice: 1150, image: "/images/Pants2.jpg", size: "M", category: "PANTS", color: "Purple", inStock: true, rating: 4.3, tag: "SALE", availableColors: ["#7e22ce", "#000"], description: "Oversized joggers perfect for streetwear style." },
      { id: "p3", name: "Dark Aesthetic Trousers", price: 900, oldPrice: 1250, image: "/images/Pants3.jpg", size: "XL", category: "PANTS", color: "Black", inStock: false, rating: 4.0, tag: "NEW", availableColors: ["#000"], description: "Dark aesthetic trousers with clean lines." },
    ],
    "CAPS": [
      { id: "c1", name: "Berserk Cap Black", price: 220, oldPrice: 450, image: "/images/Caps3.jpg", size: "M", category: "CAPS", color: "Black", inStock: true, rating: 4.6, tag: "SALE", availableColors: ["#000", "#fff"], description: "Berserk logo cap. Adjustable fit." },
      { id: "c2", name: "Sukuna Curse Cap", price: 220, oldPrice: 400, image: "/images/Caps8.jpg", size: "M", category: "CAPS", color: "Red", inStock: true, rating: 4.4, tag: "HOT", availableColors: ["#dc2626", "#000"], description: "Jujutsu Kaisen Sukuna curse mark design." },
      { id: "c3", name: "Straw Hat Minimal Cap", price: 250, oldPrice: 500, image: "/images/Caps1.jpg", size: "M", category: "CAPS", color: "White", inStock: true, rating: 4.8, tag: "BESTSELLER", availableColors: ["#fff", "#000"], description: "Minimal straw hat design inspired by One Piece." },
    ]
  };

  const counts = { "T-SHIRTS": 91, "HOODIES": 36, "JACKETS": 11, "PANTS": 16, "CAPS": 9 };
  const categoryIcons = { "T-SHIRTS": "👕", "HOODIES": "", "JACKETS": "🧥", "PANTS": "", "CAPS": "🧢" };

  const addToCart = (e) => {
    if (e) e.stopPropagation();
    setCartCount(prev => prev + 1);
  };

  const scrollLeft = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (ref) => {
    if (ref.current) ref.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const allProductsCombined = React.useMemo(() => {
    const seen = new Set();
    return [...products, ...bestSellers, ...Object.values(typeCategories).flat()].filter(item => {
      const normalizedName = item.name.toLowerCase().trim();
      if (seen.has(normalizedName)) return false;
      seen.add(normalizedName);
      return true;
    });
  }, []);

  const filteredSearchProducts = searchQuery.trim() === '' ? [] : allProductsCombined.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="bg-black text-white min-h-screen font-sans w-full overflow-x-hidden">
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
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white text-xl p-1 cursor-pointer" aria-label="Toggle menu"></button>
          </div>
          <div onClick={() => { setShowAllModal(false); setShowMenModal(false); closeProductDetail(); }} className="text-xl md:text-2xl font-black tracking-[0.25em] uppercase text-white cursor-pointer">MOSCOW</div>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wider uppercase text-gray-300">
            <span onClick={() => { setShowMenModal(true); setMenSubCategory('ALL'); }} className="cursor-pointer hover:text-purple-400 transition-colors">MEN</span>
            <span className="cursor-pointer hover:text-purple-400 transition-colors">WOMEN</span>
            <span className="cursor-pointer hover:text-purple-400 transition-colors">KIDS</span>
            <span className="cursor-pointer hover:text-purple-400 transition-colors">BEAUTY</span>
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4 text-xs font-bold uppercase tracking-wider relative">
          <div className="relative" ref={searchRef}>
            <div onClick={() => { setShowSearchDropdown(!showSearchDropdown); setShowAccountDropdown(false); setShowNotifications(false); }} className="cursor-pointer hover:text-purple-400 flex items-center gap-1.5">
              <span className="text-base"></span>
              <span className="hidden sm:inline">SEARCH</span>
            </div>
            {showSearchDropdown && (
              <div className="absolute right-0 mt-3 bg-[#0d0617] border border-purple-900 shadow-2xl p-4 z-50 rounded-md text-left" style={{ width: '340px', maxWidth: '90vw' }}>
                <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="w-full bg-[#12071f] border border-purple-800 text-white px-3.5 py-2.5 text-xs outline-none focus:border-purple-500 placeholder-gray-500 rounded" />
                {searchQuery.trim() !== '' && (
                  <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5" style={{ scrollbarWidth: 'thin' }}>
                    {filteredSearchProducts.length > 0 ? (
                      filteredSearchProducts.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-[#12071f]/80 p-2.5 rounded border border-purple-950 hover:border-purple-600 transition-colors">
                          <img src={item.image} alt={item.name} loading="lazy" className="w-11 h-11 object-cover rounded bg-gray-800" />
                          <div className="flex-grow">
                            <h4 className="text-xs font-bold text-white line-clamp-1">{item.name}</h4>
                            <span className="text-purple-400 text-xs font-extrabold">LE {item.price}.00</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(e); }} className="bg-white text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:bg-purple-600 hover:text-white cursor-pointer">🛒</button>
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
                  <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} className="text-[10px] text-purple-400 hover:text-purple-300">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 border-b border-purple-950/50 hover:bg-[#140822] cursor-pointer transition-colors ${!notif.read ? 'bg-[#1a0a2e]' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">
                          {notif.type === 'stock' ? '🔔' : notif.type === 'coupon' ? '🎁' : ''}
                        </span>
                        <div className="flex-grow">
                          <p className="text-xs text-gray-200">{notif.message}</p>
                          <span className="text-[10px] text-gray-500">{notif.time}</span>
                        </div>
                        {!notif.read && <span className="w-2 h-2 bg-purple-500 rounded-full"></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setShowLanguageMenu(!showLanguageMenu); setShowCurrencyMenu(false); }}
                className="cursor-pointer hover:text-purple-400 flex items-center gap-1 text-[10px]"
              >
                <span>🌐</span>
                <span>{language}</span>
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 bg-[#0d0617] border border-purple-950 rounded shadow-xl z-50 min-w-[80px]">
                  <button onClick={() => { setLanguage('AR'); setShowLanguageMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#140822] hover:text-purple-400">AR</button>
                  <button onClick={() => { setLanguage('EN'); setShowLanguageMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#140822] hover:text-purple-400">EN</button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { setShowCurrencyMenu(!showCurrencyMenu); setShowLanguageMenu(false); }}
                className="cursor-pointer hover:text-purple-400 flex items-center gap-1 text-[10px]"
              >
                <span>💰</span>
                <span>{currency}</span>
              </button>
              {showCurrencyMenu && (
                <div className="absolute right-0 mt-2 bg-[#0d0617] border border-purple-950 rounded shadow-xl z-50 min-w-[80px]">
                  <button onClick={() => { setCurrency('LE'); setShowCurrencyMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#140822] hover:text-purple-400">LE</button>
                  <button onClick={() => { setCurrency('USD'); setShowCurrencyMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[#140822] hover:text-purple-400">USD</button>
                </div>
              )}
            </div>
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
                    <span></span> My Account
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
                    <span></span> Logout
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
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col p-6 space-y-6 md:hidden">
          <div className="flex justify-between items-center border-b border-purple-900 pb-4">
            <span className="text-xl font-black tracking-widest">MOSCOW</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold p-2">✕</button>
          </div>
          <div className="flex flex-col space-y-4 text-base font-extrabold uppercase">
            <span onClick={() => { setShowMenModal(true); setMenSubCategory('ALL'); setMobileMenuOpen(false); }} className="cursor-pointer text-purple-400">Men's Collection</span>
            <span className="cursor-pointer hover:text-purple-400">Women</span>
            <span className="cursor-pointer hover:text-purple-400">Kids</span>
            <span className="cursor-pointer hover:text-purple-400">Beauty</span>
            <span onClick={() => { setShowAllModal(true); setMobileMenuOpen(false); }} className="cursor-pointer hover:text-purple-400">Shop All Products</span>
          </div>
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
            <div className="text-xl font-black tracking-[0.25em] uppercase text-white cursor-pointer" onClick={() => setShowMenModal(false)}>MOSCOW / MEN</div>
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
                    <button onClick={() => setMobileFilterOpen(false)} className="lg:hidden text-white font-bold text-sm p-1"></button>
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
            <div onClick={() => setShowAllModal(false)} className="text-xl font-black tracking-[0.25em] uppercase text-white cursor-pointer">MOSCOW</div>
            <button onClick={() => setShowAllModal(false)} className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase">Close X</button>
          </div>
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-10 mb-8">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">ALL PRODUCTS</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto w-full px-6 md:px-12 pb-16">
            {allProductsCombined.map((item, index) => (<ProductCard key={`${item.id}-${index}`} item={item} wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} openProductDetail={openProductDetail} />))}
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
            <div className="text-xl font-black tracking-[0.25em] uppercase text-white">MOSCOW / WISHLIST</div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allProductsCombined
                  .filter(item => wishlist.includes(item.id))
                  .map((item) => (
                    <div key={item.id} className="bg-[#0d0617] border border-purple-950 rounded-lg overflow-hidden">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-xs font-bold text-white mb-2">{item.name}</h3>
                        <p className="text-purple-400 font-bold text-sm mb-3">LE {item.price}.00</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { addToCart(); toggleWishlist(item.id); }}
                            className="flex-1 bg-purple-600 text-white py-2 rounded text-xs font-bold"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => toggleWishlist(item.id)}
                            className="bg-red-600 text-white px-3 py-2 rounded text-xs"
                          >
                            
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
            <div className="text-xl font-black tracking-[0.25em] uppercase text-white">MOSCOW / CART</div>
            <button
              onClick={() => setShowCartModal(false)}
              className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase"
            >
              Close ✕
            </button>
          </div>
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 flex-grow">
            {cartCount === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="bg-purple-600 text-white px-6 py-3 rounded text-sm font-bold uppercase"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-white text-2xl mb-4">You have {cartCount} item(s) in your cart</p>
                <button className="bg-purple-600 text-white px-8 py-4 rounded text-sm font-bold uppercase">
                  Proceed to Checkout
                </button>
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

      <FooterContent timeLeft={timeLeft} setShowAllModal={setShowAllModal} />
    </div>
  );
}