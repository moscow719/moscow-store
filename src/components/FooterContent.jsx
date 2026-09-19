import React, { useEffect, useState } from 'react';

const reviews = [
  { name: 'Omar', rating: 4.8, count: '3k+', text: 'الخامة ممتازة والمقاس مظبوط جدًا. الطلب وصل بسرعة والتغليف كان محترم.', product: 'SUMMER COLLECTION TEE' },
  { name: 'Ahmed', rating: 5.0, count: '2k+', text: 'الجودة أحسن مما توقعت، والـ fit واسع ومريح. أكيد هطلب تاني.', product: 'ULTIMATE BERSERK TEE' },
  { name: 'Mariam', rating: 4.9, count: '1.8k+', text: 'التصميم شكله أجمل في الحقيقة والصور مطابقة للمنتج تمامًا.', product: 'MOSCOW NEW DROP' },
  { name: 'Youssef', rating: 4.7, count: '1.5k+', text: 'خدمة العملاء سريعة والشحن وصل في معاده. تجربة ممتازة.', product: 'SHADOW HUNTER HOODIE' },
  { name: 'Nour', rating: 5.0, count: '1.2k+', text: 'الخامة تقيلة ونظيفة جدًا، والسعر مناسب مقارنة بالجودة.', product: 'MOSCOW STREETWEAR' },
];

// ==================== FooterContent (moved OUTSIDE App) ====================
const FooterContent = ({ timeLeft, setShowAllModal }) => {
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview(current => (current + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const review = reviews[activeReview];

  return (
  <footer className="bg-[#05020a] border-t border-purple-900/40 text-white pt-14 pb-8 px-6 md:px-12 w-full">
    <div className="max-w-7xl mx-auto space-y-12">
      <section className="relative bg-[#12071f] border border-purple-900/60 rounded-2xl px-6 py-10 md:px-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(126,34,206,0.18),transparent_60%)] pointer-events-none" />
        <div className="relative min-h-[230px] flex flex-col items-center justify-center">
          <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">CUSTOMER REVIEWS</span>
          <div className="flex items-center gap-1 mt-4 text-amber-400 text-lg" aria-label={`${review.rating} out of 5 stars`}>
            {'★★★★★'.split('').map((star, index) => <span key={index} className={index < Math.round(review.rating) ? '' : 'text-gray-700'}>{star}</span>)}
            <span className="text-white text-xs font-bold ml-2">{review.rating.toFixed(1)} | {review.count} REVIEWS</span>
          </div>
          <p key={activeReview} className="max-w-2xl text-gray-200 text-sm md:text-base leading-8 mt-5 animate-[reviewFade_500ms_ease-in-out]">
            “{review.text}”
          </p>
          <div className="mt-4">
            <p className="text-white font-black">{review.name}</p>
            <p className="text-purple-400 text-[10px] uppercase tracking-widest mt-1">{review.product}</p>
          </div>
          <div className="flex gap-2 mt-6">
            {reviews.map((item, index) => (
              <button key={item.name} onClick={() => setActiveReview(index)} aria-label={`Show review by ${item.name}`} className={`h-1.5 rounded-full transition-all ${index === activeReview ? 'w-8 bg-purple-400' : 'w-1.5 bg-purple-900 hover:bg-purple-600'}`} />
            ))}
          </div>
        </div>
        <style>{`@keyframes reviewFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </section>
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
          <span className="text-2xl font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
          <p className="text-gray-400 text-xs leading-relaxed">Anime streetwear built for people who actually watch the show. Heavyweight fabric, limited runs, shipped across Egypt.</p>
          <div className="flex items-center gap-4 text-gray-300 pt-2">
            <a href="#" aria-label="Instagram" className="hover:text-purple-400 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2"/><path strokeWidth="2" d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><path strokeWidth="2" strokeLinecap="round" d="M17.5 6.5h.01"/></svg>
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-purple-400 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.47 1.47-3.84 3.72-3.84 1.08 0 2.2.19 2.2.19v2.43h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.72l-.44 2.89h-2.28v6.98A10 10 0 0022 12z"/></svg>
            </a>
            <a href="#" aria-label="TikTok" className="hover:text-purple-400 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 2h-3v13.5a2.5 2.5 0 11-2.5-2.5c.17 0 .34.02.5.05V9.98a5.5 5.5 0 105.5 5.52V8.2a7.44 7.44 0 004.5 1.53v-3a4.44 4.44 0 01-4-4.4 4.5 4.5 0 010-.33z"/></svg>
            </a>
            <a href="https://wa.me/201067893951" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-purple-400 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26C2.166 6.443 6.6 2.008 12.05 2.008c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
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
};


export default FooterContent;
