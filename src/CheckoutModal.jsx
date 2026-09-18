import React, { useState } from 'react';
import { createOrder } from './api';

const STEPS = ['Shipping', 'Payment', 'Review'];

const inputClass = "w-full bg-[#12071f] border border-purple-900 text-white px-4 py-3 text-sm outline-none focus:border-purple-500 placeholder-gray-500 rounded transition-colors";
const errorInputClass = "w-full bg-[#12071f] border border-red-500/70 text-white px-4 py-3 text-sm outline-none focus:border-red-500 placeholder-gray-500 rounded transition-colors";
const labelClass = "block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5";

export default function CheckoutModal({ cart, cartSubtotal, onClose, onOrderPlaced }) {
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [errors, setErrors] = useState({});

  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const shippingCost = cartSubtotal === 0 || cartSubtotal >= 1500 ? 0 : 60;
  const total = cartSubtotal + shippingCost;

  const updateField = (field, value) => {
    setShipping(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateShipping = () => {
    const e = {};
    if (!shipping.fullName.trim()) e.fullName = 'Please enter your full name';
    else if (shipping.fullName.trim().length < 3) e.fullName = 'Name must be at least 3 characters';
    if (!shipping.phone.trim()) e.phone = 'Please enter a phone number';
    else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(shipping.phone.trim())) e.phone = 'Enter a valid Egyptian phone number (e.g. 010xxxxxxxx)';
    if (!shipping.address.trim()) e.address = 'Please enter your street address';
    else if (shipping.address.trim().length < 5) e.address = 'Please enter a more complete address';
    if (!shipping.city.trim()) e.city = 'Please enter your city';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateShipping()) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const placeOrder = async () => {
    setPlacing(true);
    setOrderError('');
    try {
      const result = await createOrder({
        customer: shipping,
        paymentMethod,
        items: cart,
        subtotal: cartSubtotal,
        total
      });
      const fakeOrderNumber = '#' + Math.floor(100000 + Math.random() * 900000);
      setOrderNumber(result.orderId ? `#${result.orderId.slice(0, 8).toUpperCase()}` : fakeOrderNumber);
      setStep(4);
      onOrderPlaced(result.orderId ? `#${result.orderId.slice(0, 8).toUpperCase()}` : fakeOrderNumber);
    } catch (error) {
      setOrderError(`We couldn't place your order. ${error.message} Please try again.`);
    } finally {
      setPlacing(false);
    }
  };

  const isConfirmation = step === 4;

  return (
    <div className="fixed inset-0 z-[60] bg-black backdrop-blur-md flex flex-col overflow-y-auto">
      <div className="bg-[#581c87] text-center text-xs py-2 px-4 tracking-widest uppercase font-bold text-white w-full">
        {isConfirmation ? 'ORDER CONFIRMED' : 'SECURE CHECKOUT'}
      </div>

      <div className="flex items-center justify-between px-6 md:px-8 py-4 bg-black border-b border-purple-900/40 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black italic tracking-[0.22em] text-white leading-none">MOSCOW</span>
          <span className="text-xs font-black tracking-[0.25em] uppercase text-white">/ CHECKOUT</span>
        </div>
        <button
          onClick={onClose}
          className="bg-white text-black px-4 py-1.5 rounded text-xs font-black uppercase hover:bg-purple-400 transition-colors"
        >
          Close ✕
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full px-6 md:px-12 py-10 flex-grow">

        {!isConfirmation && (
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isDone ? 'bg-purple-600 text-white' : isActive ? 'bg-purple-600 text-white ring-2 ring-purple-400/60' : 'bg-[#140822] text-gray-500 border border-purple-950'
                    }`}>
                      {isDone ? '✓' : stepNum}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:inline ${isActive ? 'text-white' : isDone ? 'text-purple-300' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                  {stepNum < STEPS.length && <div className={`w-6 sm:w-12 h-0.5 ${step > stepNum ? 'bg-purple-600' : 'bg-purple-950'}`}></div>}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* STEP 1 - SHIPPING */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <h2 className="text-xl font-black uppercase tracking-wide text-white mb-4">Shipping Information</h2>

              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={shipping.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="e.g. Ahmed Mostafa"
                  className={errors.fullName ? errorInputClass : inputClass}
                />
                {errors.fullName && <p className="text-red-400 text-[11px] mt-1.5">⚠️ {errors.fullName}</p>}
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="010xxxxxxxx"
                  className={errors.phone ? errorInputClass : inputClass}
                />
                {errors.phone && <p className="text-red-400 text-[11px] mt-1.5">⚠️ {errors.phone}</p>}
              </div>

              <div>
                <label className={labelClass}>Street Address</label>
                <input
                  type="text"
                  value={shipping.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Building, street, area"
                  className={errors.address ? errorInputClass : inputClass}
                />
                {errors.address && <p className="text-red-400 text-[11px] mt-1.5">⚠️ {errors.address}</p>}
              </div>

              <div>
                <label className={labelClass}>City / Governorate</label>
                <input
                  type="text"
                  value={shipping.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Cairo, Alexandria..."
                  className={errors.city ? errorInputClass : inputClass}
                />
                {errors.city && <p className="text-red-400 text-[11px] mt-1.5">⚠️ {errors.city}</p>}
              </div>

              <div>
                <label className={labelClass}>Order Notes (optional)</label>
                <textarea
                  value={shipping.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Delivery instructions, landmark, etc."
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </div>

              <button
                onClick={goNext}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-lg uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Continue to Payment
              </button>
            </div>

            <OrderSummarySidebar cart={cart} cartSubtotal={cartSubtotal} shippingCost={shippingCost} total={total} cartCount={cartCount} />
          </div>
        )}

        {/* STEP 2 - PAYMENT */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-black uppercase tracking-wide text-white mb-4">Payment Method</h2>

              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-purple-500 bg-purple-950/30' : 'border-purple-950 bg-[#0d0617] hover:border-purple-800'}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-purple-600 mt-1"
                />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Pay with cash when your order arrives. Available across Egypt.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-not-allowed opacity-60 ${paymentMethod === 'card' ? 'border-purple-500 bg-purple-950/30' : 'border-purple-950 bg-[#0d0617]'}`}>
                <input
                  type="radio"
                  name="payment"
                  disabled
                  checked={paymentMethod === 'card'}
                  className="accent-purple-600 mt-1"
                />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Credit / Debit Card</span>
                    <span className="text-[9px] bg-purple-900 text-purple-300 px-2 py-0.5 rounded uppercase font-bold tracking-wide">Coming Soon</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Online card payment isn't available yet.</p>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={goBack}
                  className="flex-1 border-2 border-purple-900 hover:border-purple-600 text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm transition-all"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-lg uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-purple-500/50"
                >
                  Review Order
                </button>
              </div>
            </div>

            <OrderSummarySidebar cart={cart} cartSubtotal={cartSubtotal} shippingCost={shippingCost} total={total} cartCount={cartCount} />
          </div>
        )}

        {/* STEP 3 - REVIEW */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-black uppercase tracking-wide text-white mb-2">Review Your Order</h2>

              <div className="bg-[#0d0617] border border-purple-950 rounded-lg p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">Shipping To</h3>
                <p className="text-sm text-white font-bold">{shipping.fullName}</p>
                <p className="text-xs text-gray-400">{shipping.phone}</p>
                <p className="text-xs text-gray-400">{shipping.address}, {shipping.city}</p>
                {shipping.notes && <p className="text-xs text-gray-500 italic mt-1">Note: {shipping.notes}</p>}
                <button onClick={() => setStep(1)} className="text-[11px] text-purple-400 hover:text-purple-300 underline mt-2">Edit shipping info</button>
              </div>

              <div className="bg-[#0d0617] border border-purple-950 rounded-lg p-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">Payment Method</h3>
                <p className="text-sm text-white font-bold flex items-center gap-2">
                  <span>💵</span> Cash on Delivery
                </p>
                <button onClick={() => setStep(2)} className="text-[11px] text-purple-400 hover:text-purple-300 underline mt-2">Change payment method</button>
              </div>

              <div className="bg-[#0d0617] border border-purple-950 rounded-lg p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-3">Items ({cartCount})</h3>
                <div className="space-y-3">
                  {cart.map((c) => (
                    <div key={c.cartId} className="flex items-center gap-3">
                      <div className="w-14 h-16 rounded-md overflow-hidden bg-gray-900 flex-shrink-0">
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-white line-clamp-1">{c.name}</p>
                        <p className="text-[11px] text-gray-400">{c.size ? `Size: ${c.size} · ` : ''}Qty: {c.quantity}</p>
                      </div>
                      <span className="text-purple-400 font-bold text-xs">LE {(c.price * c.quantity).toLocaleString()}.00</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={goBack}
                  className="flex-1 border-2 border-purple-900 hover:border-purple-600 text-white font-bold py-4 rounded-lg uppercase tracking-widest text-sm transition-all"
                >
                  Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-4 rounded-lg uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-purple-500/50"
                >
                  {placing ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
              {orderError && <p className="text-red-400 text-xs mt-3" role="alert">⚠️ {orderError}</p>}
            </div>

            <OrderSummarySidebar cart={cart} cartSubtotal={cartSubtotal} shippingCost={shippingCost} total={total} cartCount={cartCount} />
          </div>
        )}

        {/* STEP 4 - CONFIRMATION */}
        {isConfirmation && (
          <div className="max-w-lg mx-auto text-center py-10 space-y-6">
            <div className="w-20 h-20 rounded-full bg-purple-600/20 border-2 border-purple-500 flex items-center justify-center mx-auto">
              <span className="text-4xl">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-white">Order Placed!</h2>
              <p className="text-gray-400 text-sm mt-2">Thanks for your order. We'll text you a confirmation shortly.</p>
            </div>
            <div className="bg-[#0d0617] border border-purple-950 rounded-lg p-6 text-left space-y-3">
              <div className="flex justify-between items-center border-b border-purple-950 pb-3">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">Order Number</span>
                <span className="text-purple-400 font-black">{orderNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Payment</span>
                <span className="text-white font-bold">Cash on Delivery</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Shipping to</span>
                <span className="text-white font-bold text-right">{shipping.city}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-purple-950 pt-3">
                <span className="font-bold uppercase text-white">Total Paid on Delivery</span>
                <span className="text-purple-400 font-black">LE {total.toLocaleString()}.00</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-lg uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-purple-500/50"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderSummarySidebar({ cart, cartSubtotal, shippingCost, total, cartCount }) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-[#0d0617] border border-purple-950 rounded-lg p-6 space-y-4 sticky top-24">
        <h3 className="text-sm font-black uppercase tracking-widest text-purple-300 border-b border-purple-950 pb-3">Order Summary</h3>

        <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
          {cart.map((c) => (
            <div key={c.cartId} className="flex items-center gap-3">
              <div className="relative w-12 h-14 rounded-md overflow-hidden bg-gray-900 flex-shrink-0">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{c.quantity}</span>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[11px] font-bold text-white line-clamp-1">{c.name}</p>
                {c.size && <p className="text-[10px] text-gray-500">Size: {c.size}</p>}
              </div>
              <span className="text-purple-400 font-bold text-[11px] shrink-0">LE {(c.price * c.quantity).toLocaleString()}.00</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-xs text-gray-300 border-t border-purple-950 pt-4">
          <div className="flex justify-between">
            <span>Subtotal ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
            <span className="text-white font-bold">LE {cartSubtotal.toLocaleString()}.00</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-white font-bold">{shippingCost === 0 ? 'FREE' : `LE ${shippingCost}.00`}</span>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-purple-950 pt-4">
          <span className="text-sm font-bold uppercase text-white">Total</span>
          <span className="text-xl font-black text-purple-400">LE {total.toLocaleString()}.00</span>
        </div>
      </div>
    </div>
  );
}