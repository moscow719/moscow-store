import React from 'react';

const renderRatingStars = (rating = 4.5) => (
  <div className="flex items-center gap-1 text-[10px] text-amber-400">
    <span>★</span>
    <span className="text-gray-300 font-bold">{rating.toFixed(1)}</span>
  </div>
);

const getWishlistIdentity = (item) => {
  const image = String(item.image || '').toLowerCase();
  const match = image.match(/\/([^/]+?)(?:-detail\d+)?\.jpg$/);
  return match ? `image:${match[1]}` : `name:${item.name.trim().toLowerCase()}`;
};

// ==================== ProductCard (moved OUTSIDE App) ====================
const ProductCard = React.memo(({ item, wishlist, toggleWishlist, addToCart, openProductDetail }) => {
  const isWishlisted = wishlist.some(value =>
    String(value) === String(item.id) ||
    String(value).toLowerCase() === item.name.trim().toLowerCase() ||
    String(value) === getWishlistIdentity(item)
  );
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
          onError={(event) => { event.currentTarget.src = '/images/product1.jpg'; }}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-md p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-gray-300 uppercase hidden sm:inline">Quick View</span>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
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
});


export default ProductCard;
