import React from 'react';
import FooterContent from './FooterContent';

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
  const product = selectedProduct;
  const [openDetail, setOpenDetail] = React.useState(null);
  const productImages = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.detailImages) && product.detailImages.length > 0) {
      return product.detailImages.slice(0, 4);
    }

    const detailMatch = String(product.image || '').match(/^(.+)\/(product\d+)\.jpg$/i);
    if (detailMatch) {
      const [, directory, productName] = detailMatch;
      return [1, 2, 3, 4].map(index => `${directory}/${productName}-detail${index}.jpg`);
    }

    return [product.image, product.image, product.image, product.image];
  }, [product]);

  if (!showProductDetail || !product) return null;

  const isWishlisted = wishlist.some(value =>
    String(value) === String(product.id) ||
    String(value).toLowerCase() === product.name.trim().toLowerCase() ||
    String(value) === `image:${String(product.image || '').toLowerCase().match(/\/([^/]+?)(?:-detail\d+)?\.jpg$/)?.[1] || ''}`
  );
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  const sameCategoryProducts = allProductsCombined.filter(item =>
    item.id !== product.id &&
    product.category &&
    item.category?.toUpperCase() === product.category.toUpperCase()
  );
  const relatedProducts = [
    ...sameCategoryProducts,
    ...allProductsCombined.filter(item =>
      item.id !== product.id && !sameCategoryProducts.includes(item)
    )
  ].slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
      <div className="bg-[#4c2b86] text-center text-xs md:text-sm py-2 px-4 tracking-wide uppercase font-black text-white w-full">
        BUY ANY 2 T-SHIRTS FOR 1095 &nbsp; | &nbsp; BUY ANY 3 T-SHIRTS FOR 1445
      </div>

      <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
        <div className="cursor-pointer" onClick={closeProductDetail}>
          <span className="text-xl font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
        </div>
        <button
          onClick={closeProductDetail}
          className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase hover:bg-purple-400 transition-colors"
        >
          Close ✕
        </button>
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-0 md:px-10 lg:px-16 py-0 md:py-8 flex-grow">

        <nav className="hidden md:flex items-center gap-2 text-xs text-gray-400 mb-6">
          <span onClick={() => closeProductDetail()} className="hover:text-purple-400 cursor-pointer">Home</span>
          <span>/</span>
          <span className="hover:text-purple-400 cursor-pointer">Men</span>
          <span>/</span>
          <span className="text-purple-400">{product.category || 'Product'}</span>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(330px,0.85fr)] gap-0 md:gap-12 xl:gap-20">

          <div className="space-y-0 md:space-y-4 lg:min-w-0">
            <div className="relative aspect-[3/4] md:rounded-lg overflow-hidden border-b md:border border-purple-950 lg:aspect-[4/5]">
              {product.tag && (
                <span className="absolute top-4 left-4 z-10 bg-purple-600 text-xs font-bold px-3 py-1.5 uppercase tracking-widest text-white rounded shadow-lg">
                  {product.tag}
                </span>
              )}
              <img
                src={productImages[activeImage]}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.src = product.image;
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 p-3 md:p-0">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-purple-500' : 'border-purple-950 hover:border-purple-600'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(event) => { event.currentTarget.src = product.image; }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 px-4 py-6 md:px-0 md:py-0 lg:sticky lg:top-24 lg:self-start lg:pt-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">{product.category || 'T-SHIRT'}</p>
              <h1 className="text-3xl md:text-4xl lg:text-3xl font-black uppercase tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-400">
                  <span>★</span>
                  <span className="text-sm font-bold text-white">{product.rating}</span>
                </div>
                <span className="text-xs text-gray-400">(127 reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-white">LE {product.price.toLocaleString()}.00</span>
              {product.oldPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">LE {product.oldPrice.toLocaleString()}.00</span>
                  <span className="bg-red-500/20 text-red-400 text-sm font-black px-2 py-1 rounded border border-red-500/30">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed border-b border-purple-950 pb-5 lg:text-xs">
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
              <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setShowSizeError(false); }}
                    className={`min-w-[50px] h-12 rounded border-2 text-sm font-bold transition-all lg:flex-1 ${
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={addToCartFromDetail}
                className="flex-1 bg-[#4c2b86] hover:bg-purple-600 text-white font-black py-4 px-4 uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Add to Cart
              </button>
              <button
                onClick={(e) => toggleWishlist(product.id, e)}
                className="w-14 h-14 border-2 border-purple-950 hover:border-purple-500 flex items-center justify-center text-2xl transition-all hover:scale-110"
              >
                {isWishlisted ? "❤️" : "♡"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-0 pt-4 border-y border-purple-950">
              <div className="flex items-center gap-2 text-xs text-gray-300 py-3 border-b border-r border-purple-950 pr-2">
                <span className="text-purple-400 text-lg">🚚</span>
                <span>Free shipping over 1500 LE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300 py-3 border-b border-purple-950 pl-2">
                <span className="text-purple-400 text-lg">💵</span>
                <span>Cash on delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300 py-3 border-r border-purple-950 pr-2">
                <span className="text-purple-400 text-lg">🔄</span>
                <span>Easy exchanges</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300 py-3 pl-2">
                <span className="text-purple-400 text-lg">⚡</span>
                <span>Limited drop - no restocks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0 mt-8 md:mt-14 border-t border-purple-950">
          {[
            ['details', 'The details', product.description || 'Premium heavyweight cotton with an oversized fit and exclusive artwork.'],
            ['fit', 'Size & fit', 'Oversized fit. Choose your usual size for a relaxed look or size down for a closer fit.'],
            ['shipping', 'Shipping & delivery', 'Cash on delivery available. Orders are delivered within 2–5 business days.'],
            ['returns', 'Exchanges & replacements', 'Easy exchanges are available. Contact us if your item arrives damaged.'],
            ['care', 'Fabric & care', 'Wash inside out with similar colors. Do not bleach. Air dry when possible.']
          ].map(([id, title, content]) => (
            <div key={id} className="border-b border-purple-950">
              <button
                type="button"
                onClick={() => setOpenDetail(openDetail === id ? null : id)}
                className="w-full flex items-center justify-between py-5 text-left text-xs font-bold uppercase tracking-wider text-white"
              >
                <span>{title}</span>
                <span className="text-xl font-light">{openDetail === id ? '−' : '+'}</span>
              </button>
              {openDetail === id && <p className="pb-5 pr-8 text-sm leading-relaxed text-gray-400">{content}</p>}
            </div>
          ))}
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-purple-950">
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-8">More Like This</h2>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-5 snap-x snap-mandatory [scrollbar-width:thin]">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { openProductDetail(item); }}
                  className="cursor-pointer group shrink-0 w-[72vw] sm:w-[42vw] md:w-[250px] lg:w-[280px] snap-start"
                >
                  <div className="relative aspect-[3/4] bg-[#0d0617] rounded-lg overflow-hidden border border-purple-950 group-hover:border-purple-600 transition-all">
                    {item.oldPrice && (
                      <span className="absolute top-3 left-3 z-10 bg-[#d8bce8] text-black text-[10px] font-black px-2 py-1 uppercase tracking-wider">
                        Sale
                      </span>
                    )}
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="text-xs font-bold uppercase mt-3 group-hover:text-purple-400 transition-colors">{item.name}</h3>
                  <p className="text-sm text-purple-400 font-bold">LE {item.price}.00</p>
                  {item.oldPrice && <p className="text-xs text-gray-500 line-through">LE {item.oldPrice}.00</p>}
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{item.size || 'S'} &nbsp; {item.category || 'T-SHIRTS'}</p>
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


export default ProductDetailModal;
