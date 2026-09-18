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
  ].slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black backdrop-blur-md flex flex-col overflow-y-auto">
      <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">
        {product.tag || 'LIMITED EDITION'} — {product.inStock ? 'IN STOCK' : 'SOLD OUT'}
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
                onError={(event) => {
                  event.currentTarget.src = product.image;
                }}
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
                <span className="text-purple-400 text-lg">🚚</span>
                <span>Free shipping over 1500 LE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg">💵</span>
                <span>Cash on delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg">🔄</span>
                <span>Easy exchanges</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400 text-lg">⚡</span>
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


export default ProductDetailModal;
