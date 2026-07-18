"use client";

import React, { useState, useEffect } from 'react';
import { useCartStore, Product } from '@/store/useCartStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Minus, Trash2, ShoppingCart, Coffee, Search, Pizza, User, Tag, X, ChevronDown, Check } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function PosPage() {
  const { items, customerName, customerId, setCustomer, addItem, removeItem, updateQuantity, getSubtotal, getTax, getTotal, clearCart, discountAmount, setDiscountAmount, discountType, setDiscountType, getCalculatedDiscount, appliedCoupon, setAppliedCoupon, setTaxEnabled, taxEnabled, updateNotes } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MIDTRANS'>('CASH');
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'warning' } | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState<string>('');
  const [lastQueueNumber, setLastQueueNumber] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState<boolean>(false);
  const [roundingType, setRoundingType] = useState<'NONE' | 'DOWN_100' | 'UP_100' | 'DOWN_500' | 'UP_500' | 'DOWN_1000' | 'UP_1000'>('NONE');
  const [cashAmountReceived, setCashAmountReceived] = useState<number | ''>('');
  const [printReceiptData, setPrintReceiptData] = useState<{ total: number; rounding: number; grandTotal: number; cashReceived: number; change: number; paymentMethod: string } | null>(null);
  const [showRoundingDropdown, setShowRoundingDropdown] = useState(false);
  
  // Add Customer Quick Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', customerType: 'REGULAR', defaultDiscountPercent: 0 });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  
  // Custom dropdown state
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const getRoundedTotal = (total: number) => {
    switch (roundingType) {
      case 'DOWN_100': return Math.floor(total / 100) * 100;
      case 'UP_100': return Math.ceil(total / 100) * 100;
      case 'DOWN_500': return Math.floor(total / 500) * 500;
      case 'UP_500': return Math.ceil(total / 500) * 500;
      case 'DOWN_1000': return Math.floor(total / 1000) * 1000;
      case 'UP_1000': return Math.ceil(total / 1000) * 1000;
      default: return total;
    }
  };

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['pos-orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders');
      return res.data;
    },
    refetchInterval: 5000 // auto refresh setiap 5 detik
  });

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['pos-customers'],
    queryFn: async () => {
      const res = await axios.get('/api/customers');
      return res.data;
    }
  });

  const pendingOrders = orders?.filter((o: any) => o.paymentMethod === 'MIDTRANS' && o.paymentStatus === 'pending' && o.status === 'TODO') || [];

  useEffect(() => {
    setIsMounted(true);
    // Memuat script Snap.js secara dinamis khusus di halaman POS untuk mencegah error postMessage Next.js
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "YOUR_MIDTRANS_CLIENT_KEY";

    let script = document.querySelector(`script[src="${snapScriptUrl}"]`) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement("script");
      script.src = snapScriptUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
    
    // Fetch global tax setting
    axios.get('/api/settings/TAX_ENABLED')
      .then(res => setTaxEnabled(res.data.value === 'true'))
      .catch(err => console.log('Tax setting not found, defaulting to true'));

  }, []);

  const showToast = (message: string, type: 'error' | 'success' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auto kalkulasi ulang diskon kupon jika subtotal berubah
  useEffect(() => {
    if (appliedCoupon) {
      const sub = getSubtotal();
      if (sub < appliedCoupon.minPurchase) {
        setAppliedCoupon(null, 0);
        showToast(`Coupon cancelled: minimum purchase of Rp ${formatRupiah(appliedCoupon.minPurchase)} not met.`, 'warning');
      } else {
        let amt = appliedCoupon.type === 'NOMINAL' ? appliedCoupon.value : (sub * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount && amt > appliedCoupon.maxDiscount) amt = appliedCoupon.maxDiscount;
        if (amt > sub) amt = sub;
        setAppliedCoupon(appliedCoupon, amt);
      }
    }
  }, [items]);

  const categories = ['All', 'Coffee', 'Non-Coffee', 'Food'];
  
  // Fetch real data from Next.js API Routes (SQLite Dummy Backend)
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products');
      return res.data;
    }
  });
  
  // Filter by Category AND Search Query
  const addonProducts = products.filter(p => p.category === 'Add-on' || p.category === 'Topping');

  const calculateAddonExtraPrice = (notesStr: string) => {
    let extra = 0;
    if (!notesStr) return extra;
    const activeTags = notesStr.split(',').map(n => n.trim()).filter(Boolean);
    activeTags.forEach(tag => {
      const addon = addonProducts.find(p => p.name.toLowerCase() === tag.toLowerCase());
      if (addon) {
        extra += addon.price;
      }
    });
    return extra;
  };

  const filteredProducts = products.filter(p => {
    const isAddonOrTopping = p.category === 'Add-on' || p.category === 'Topping';
    const matchCategory = 
      (activeCategory === 'All' && !isAddonOrTopping) || 
      p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleValidateCoupon = async () => {
    if (!couponInput) return;
    setIsValidatingCoupon(true);
    try {
      const res = await axios.post('/api/coupons/validate', {
        code: couponInput,
        subtotal: getSubtotal()
      });
      setAppliedCoupon(res.data.coupon, res.data.calculatedDiscount);
      setCouponInput('');
      showToast('Coupon successfully applied!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to validate coupon", 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setRoundingType('NONE');
    setCashAmountReceived('');
    setPrintReceiptData(null);
    setShowRoundingDropdown(false);
    setShowCheckout(true);
  };

  const processPayment = async () => {
    try {
      setIsProcessing(true);
      const roundedTotal = getRoundedTotal(getTotal());
      const rawTotal = getTotal();
      const finalTotalAmount = paymentMethod === 'CASH' ? roundedTotal : rawTotal;

      let cashierName = 'Admin';
      try {
        const userCookie = document.cookie.split('; ').find(row => row.startsWith('tresbros_user='));
        if (userCookie) {
          const user = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          cashierName = user.fullName || user.username || 'Admin';
        }
      } catch (e) {}

      const res = await axios.post('/api/orders', {
        cashierName: cashierName,
        customerName: customerName,
        customerId: customerId,
        totalAmount: finalTotalAmount,
        couponCode: appliedCoupon?.code || null,
        discountAmount: getCalculatedDiscount(),
        paymentMethod: paymentMethod,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      });
      setLastOrderNumber(res.data.orderNumber);
      setLastQueueNumber(res.data.queueNumber);

      const diff = roundedTotal - rawTotal;
      const received = paymentMethod === 'CASH' ? Number(cashAmountReceived || roundedTotal) : 0;
      const changeAmount = paymentMethod === 'CASH' ? (received - roundedTotal) : 0;

      setPrintReceiptData({
        total: rawTotal,
        rounding: diff,
        grandTotal: roundedTotal,
        cashReceived: received,
        change: changeAmount,
        paymentMethod: paymentMethod
      });

      if (paymentMethod === 'MIDTRANS') {
        if (res.data.snapToken) {
           // Tampilkan Midtrans Snap Popup tanpa menutup checkout modal dulu (mencegah DOM unmount yang bikin error)
           (window as any).snap.pay(res.data.snapToken, {
             onSuccess: function(result: any){
               setShowCheckout(false);
               showToast("Midtrans Payment Successful! Order sent to KDS.", 'success');
               setTimeout(() => { 
                 window.print(); 
                 clearCart();
               }, 500);
             },
             onPending: function(result: any){
               setShowCheckout(false);
               showToast("Order created. Waiting for your payment...", 'warning');
               clearCart();
             },
             onError: function(result: any){
               showToast("Payment failed.", 'error');
               // Tidak menutup modal checkout agar kasir bisa coba lagi
             },
             onClose: function(){
               showToast("Payment window closed.", 'warning');
               // Tidak menutup modal checkout agar kasir bisa coba lagi/ganti metode bayar
             }
           });
           return;
        } else {
           showToast("Failed to create Midtrans transaction. Check API Key in backend.", 'error');
           return;
        }
      }

      // Untuk pembayaran CASH, langsung tutup modal
      setShowCheckout(false);

      showToast("Payment Successful! Order sent to KDS.", 'success');
      // Trigger print receipt
      setTimeout(() => {
        window.print();
        clearCart();
      }, 500);
    } catch (error: any) {
      const errResponse = error.response?.data;
      const errMsg = typeof errResponse === 'string' ? errResponse : (errResponse?.error || "An error occurred while saving the order.");
      showToast(errMsg, 'error');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === 'Food') return <Pizza className="w-5 h-5 text-zinc-600" />;
    return <Coffee className="w-5 h-5 text-zinc-600" />;
  };

  return (
    <>
    {/* Custom Toast Notification */}
    {toast && (
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 flex items-center gap-3 print:hidden transition-all
        ${toast.type === 'success' ? 'bg-white text-zinc-900 border-emerald-200' : 
          toast.type === 'error' ? 'bg-white text-zinc-900 border-red-200' : 
          'bg-white text-zinc-900 border-orange-200'}`}
      >
        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-sm
          ${toast.type === 'success' ? 'bg-emerald-500' : 
            toast.type === 'error' ? 'bg-red-500' : 
            'bg-orange-500'}`}
        >
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '!'}
        </span>
        <p className="font-medium text-sm">{toast.message}</p>
      </div>
    )}

    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-8rem)] print:hidden">
      
      {/* KIRI: Grid Menu Produk */}
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden min-h-[50vh] lg:min-h-0">
        
        {/* Header Kiri: Search & Kategori Filter */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {pendingOrders.length > 0 && (
              <button 
                onClick={() => setShowPendingOrders(true)}
                className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 px-6 rounded-xl font-semibold transition-all text-sm flex items-center gap-2 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                {pendingOrders.length} Pending Orders
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-medium transition whitespace-nowrap text-sm border ${
                  activeCategory === cat 
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' 
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 pb-10 custom-scrollbar-light">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-zinc-400 mt-10">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-zinc-300" />
              </div>
              <p className="font-medium">Products not found</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="flex flex-col justify-between h-44 active:scale-95 hover:border-blue-300 hover:shadow-md transition-all group relative p-5 bg-white cursor-pointer"
              onClick={() => addItem(product)}
            >
              {typeof product.availableCount === 'number' && product.availableCount <= 0 && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl z-10 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm border border-red-200">
                    Out of Stock / Low Stock
                  </div>
                </div>
              )}
              <div className="relative z-0">
                <div className="w-10 h-10 bg-zinc-100 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  {getCategoryIcon(product.category)}
                </div>
                <h3 className="font-medium text-zinc-900 text-[15px] leading-tight line-clamp-2">{product.name}</h3>
              </div>
              <p className="font-display font-bold text-blue-600 mt-2 text-lg">{formatRupiah(product.price)}</p>
            </Card>
            ))
          )}
        </div>
      </div>

      {/* KANAN: Keranjang / Cart */}
      <div className="w-full lg:w-[420px] flex flex-col shrink-0 h-[600px] lg:h-full bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="flex flex-col p-5 border-b border-zinc-200 shrink-0 bg-zinc-50/50 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-bold text-zinc-900">Active Orders</h2>
            <span className="ml-auto bg-zinc-200 text-zinc-700 text-xs font-bold px-2.5 py-1 rounded-full">{items.length} items</span>
          </div>

          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm text-left flex items-center justify-between"
                >
                  <span className="truncate">
                    {!customerId 
                      ? "Guest / Pelanggan Umum" 
                      : customers.find((c: any) => c.id === customerId)?.name || "Guest / Pelanggan Umum"
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 absolute right-3 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCustomerDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCustomerDropdown(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 shadow-xl rounded-2xl z-20 overflow-hidden py-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar-light">
                      <button
                        onClick={() => {
                          setCustomer('', undefined, 0);
                          setShowCustomerDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition flex items-center justify-between ${!customerId ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-zinc-700'}`}
                      >
                        Guest / Pelanggan Umum
                        {!customerId && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                      
                      {customers.map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setCustomer(c.name, c.id, c.defaultDiscountPercent);
                            if (c.defaultDiscountPercent > 0) {
                              showToast(`Diskon Reseller ${c.defaultDiscountPercent}% diterapkan!`, 'success');
                            }
                            setShowCustomerDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition flex items-center justify-between ${customerId === c.id ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-zinc-700'}`}
                        >
                          <div className="flex flex-col">
                            <span>{c.name}</span>
                            {c.customerType === 'RESELLER' && (
                              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">Reseller</span>
                            )}
                          </div>
                          {customerId === c.id && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setNewCustomerForm({ name: '', phone: '', customerType: 'REGULAR', defaultDiscountPercent: 0 });
                setShowAddCustomerModal(true);
              }}
              className="px-3 bg-zinc-100 hover:bg-blue-50 text-zinc-600 hover:text-blue-600 rounded-xl transition flex items-center justify-center shrink-0 border border-zinc-200 shadow-sm"
              title="Tambah Pelanggan Baru"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Daftar Item Cart */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50/30 custom-scrollbar-light">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="flex flex-col gap-2 p-3.5 bg-white hover:border-blue-200 transition-colors rounded-xl border border-zinc-200 shadow-sm relative group">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-zinc-900 text-sm leading-tight">{item.name}</p>
                    <p className="font-medium text-blue-600 text-sm whitespace-nowrap mt-1">{formatRupiah(item.price * item.quantity)}</p>
                    
                    {typeof item.availableCount === 'number' && item.quantity > item.availableCount && (
                      <div className="flex flex-col mt-2 bg-red-50 border border-red-100 p-2 rounded-lg">
                        <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                          Insufficient Materials
                        </span>
                        {item.missingMaterials && item.missingMaterials.length > 0 && (
                          <span className="text-[10px] text-red-500 mt-1 pl-2 border-l-2 border-red-200">Need: {item.missingMaterials.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick custom notes/tags */}
                <div className="flex flex-col gap-1.5 mt-1 border-t border-zinc-100 pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Keterangan / Custom:</span>
                  <div className="flex flex-wrap gap-1">
                    {/* Preparation notes (Non-price) */}
                    {[
                      { label: "Less Sugar", val: "Less Sugar" },
                      { label: "No Sugar", val: "No Sugar" },
                      { label: "Less Ice", val: "Less Ice" }
                    ].map((tag) => {
                      const isActive = item.notes?.split(',').map(n => n.trim()).includes(tag.val);
                      return (
                        <button
                          key={tag.val}
                          type="button"
                          onClick={() => {
                            let list = item.notes ? item.notes.split(',').map(n => n.trim()).filter(Boolean) : [];
                            
                            // Mutual exclusivity check: Less Sugar vs No Sugar
                            if (tag.val === 'Less Sugar') {
                              list = list.filter(n => n !== 'No Sugar');
                            } else if (tag.val === 'No Sugar') {
                              list = list.filter(n => n !== 'Less Sugar');
                            }

                            if (list.includes(tag.val)) {
                              list = list.filter(n => n !== tag.val);
                            } else {
                              list.push(tag.val);
                            }
                            const nextNotes = list.join(', ');
                            const extraPrice = calculateAddonExtraPrice(nextNotes);
                            updateNotes(item.cartItemId, nextNotes, extraPrice);
                          }}
                          className={`text-[10px] px-2 py-1 rounded-md font-semibold transition ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}

                    {/* Dynamic Add-ons & Toppings */}
                    {addonProducts.map((addon) => {
                      const isActive = item.notes?.split(',').map(n => n.trim()).includes(addon.name);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            let list = item.notes ? item.notes.split(',').map(n => n.trim()).filter(Boolean) : [];
                            
                            if (list.includes(addon.name)) {
                              list = list.filter(n => n !== addon.name);
                            } else {
                              list.push(addon.name);
                            }
                            const nextNotes = list.join(', ');
                            const extraPrice = calculateAddonExtraPrice(nextNotes);
                            updateNotes(item.cartItemId, nextNotes, extraPrice);
                          }}
                          className={`text-[10px] px-2 py-1 rounded-md font-semibold transition ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {addon.name} (+Rp {addon.price.toLocaleString('id-ID')})
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom manual notes input */}
                  <input
                    type="text"
                    placeholder="Custom notes (e.g. less sweet, extra hot...)"
                    className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition mt-1"
                    value={item.notes || ''}
                    onChange={(e) => {
                      const nextNotes = e.target.value;
                      const extraPrice = calculateAddonExtraPrice(nextNotes);
                      updateNotes(item.cartItemId, nextNotes, extraPrice);
                    }}
                  />
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-100">
                  <button onClick={() => removeItem(item.cartItemId)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3 bg-zinc-100 rounded-lg px-2 py-1 border border-zinc-200">
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="text-zinc-500 hover:text-zinc-900 p-1">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-zinc-900 font-semibold w-5 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="text-zinc-500 hover:text-zinc-900 p-1">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions & Summary */}
        <div className="mt-auto bg-white border-t border-zinc-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
          
          <div className="px-5 pt-5 pb-3">
            {/* Input Kupon */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-zinc-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Coupon Code"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-blue-500 focus:bg-white uppercase transition-colors"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                />
              </div>
              <button 
                onClick={handleValidateCoupon}
                disabled={isValidatingCoupon || !couponInput || items.length === 0}
                className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white px-5 rounded-xl text-sm font-semibold transition-colors"
              >
                Check
              </button>
            </div>

            {/* Input Diskon Manual */}
            <div className={`flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 pl-4 transition-colors ${appliedCoupon ? 'opacity-70 pointer-events-none bg-zinc-100' : 'focus-within:border-blue-500 focus-within:bg-white'}`}>
              <span className="text-sm font-semibold text-zinc-600">
                {appliedCoupon ? `Coupon: ${appliedCoupon.code}` : 'Manual Discount'}
              </span>
              
              {!appliedCoupon && (
                <div className="flex items-center gap-2 w-1/2">
                  <div className="flex bg-zinc-200/50 rounded-lg p-0.5 shrink-0 border border-zinc-200">
                    <button 
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${discountType === 'nominal' ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-900'}`}
                      onClick={() => setDiscountType('nominal')}
                    >Rp</button>
                    <button 
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${discountType === 'percentage' ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-900'}`}
                      onClick={() => setDiscountType('percentage')}
                    >%</button>
                  </div>
                  <input 
                    type="text"
                    placeholder="0"
                    className="bg-transparent text-right text-zinc-900 font-display font-bold focus:outline-none w-full min-w-0"
                    value={discountType === 'nominal' ? (discountAmount ? new Intl.NumberFormat('id-ID').format(discountAmount) : '') : (discountAmount || '')}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      let val = rawValue ? parseInt(rawValue, 10) : 0;
                      if (discountType === 'percentage' && val > 100) val = 100;
                      setDiscountAmount(val);
                    }}
                  />
                </div>
              )}
              
              {appliedCoupon && (
                <button 
                  onClick={() => setAppliedCoupon(null, 0)}
                  className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md"
                >Remove</button>
              )}
            </div>
          </div>

          {/* Ringkasan Biaya */}
          <div className="px-5 pb-5">
            <div className="space-y-2 mb-4 bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <div className="flex justify-between text-sm text-zinc-500 font-medium">
                <span>Subtotal</span>
                <span className="text-zinc-900">{formatRupiah(getSubtotal())}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-500 font-medium">
                  <span>Discount {appliedCoupon ? `[${appliedCoupon.code}]` : (discountType === 'percentage' ? `(${discountAmount}%)` : '')}</span>
                  <span>-{formatRupiah(getCalculatedDiscount())}</span>
                </div>
              )}
              {taxEnabled && (
                <div className="flex justify-between text-sm text-zinc-500 font-medium">
                  <span>Tax (11%)</span>
                  <span className="text-zinc-900">{formatRupiah(getTax())}</span>
                </div>
              )}
              <div className="pt-3 mt-3 border-t border-zinc-200 flex justify-between items-end">
                <span className="text-zinc-900 font-bold">Total Payment</span>
                <span className="text-3xl font-display font-bold text-blue-600 leading-none tracking-tight">{formatRupiah(getTotal())}</span>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              fullWidth 
              className="py-4 text-base font-bold shadow-md shadow-blue-500/20 disabled:shadow-none"
              disabled={items.length === 0}
              onClick={handleCheckout}
            >
              Complete Order
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Pesanan Tertunda */}
      {showPendingOrders && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl bg-white border-zinc-200 shadow-2xl p-0 max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100">
              <h2 className="text-xl font-display font-bold text-zinc-900">Orders Waiting for Payment</h2>
              <button onClick={() => setShowPendingOrders(false)} className="text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 custom-scrollbar-light">
              {pendingOrders.map((order: any) => (
                <div key={order.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-zinc-900 font-bold text-lg">{order.orderNumber || order.id}</span>
                      <span className="bg-orange-50 text-orange-600 border border-orange-200 text-xs px-2.5 py-1 rounded-md font-semibold">MIDTRANS</span>
                    </div>
                    <div className="text-zinc-500 text-sm font-medium">{order.customerName || 'Guest'} • {new Date(order.createdAt).toLocaleTimeString('id-ID')}</div>
                    <div className="text-blue-600 font-bold mt-2 text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.totalAmount)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setOrderToCancel(order)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        if (order.snapToken) {
                          setShowPendingOrders(false);
                          (window as any).snap.pay(order.snapToken, {
                            onSuccess: function(){
                              showToast("Payment Successful! Order sent to KDS.", 'success');
                              setLastOrderNumber(order.orderNumber || order.id);
                              setLastQueueNumber(order.queueNumber || '-');
                              setTimeout(() => window.print(), 500);
                              refetchOrders();
                            },
                            onPending: function(){
                              showToast("Payment still pending...", 'warning');
                              refetchOrders();
                            },
                            onError: function(){
                              showToast("Payment failed.", 'error');
                              refetchOrders();
                            },
                            onClose: function(){
                              showToast("Payment window closed.", 'warning');
                              refetchOrders();
                            }
                          });
                        } else {
                          showToast("Midtrans token not found.", 'error');
                        }
                      }}
                    >
                      Continue Payment
                    </Button>
                  </div>
                </div>
              ))}
              
              {pendingOrders.length === 0 && (
                <div className="text-center text-zinc-500 font-medium py-12 bg-white rounded-xl border border-zinc-200 border-dashed">No pending orders.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Checkout (Glassmorphism Overlay) */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl p-0 rounded-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header: fixed */}
            <div className="text-center p-6 border-b border-zinc-100 shrink-0">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-display font-bold text-zinc-900">Select Payment</h2>
              <p className="text-3xl font-display font-black text-blue-600 mt-2 tracking-tight">{formatRupiah(getTotal())}</p>
            </div>
            
            {/* Middle Section: Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar-light">
              <div className="space-y-3">
                <button 
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-zinc-50'}`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-xl">💵</span> Cash
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CASH' ? 'border-blue-600' : 'border-zinc-300'}`}>
                    {paymentMethod === 'CASH' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                  </div>
                </button>
                
                <button 
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'MIDTRANS' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-zinc-50'}`}
                  onClick={() => setPaymentMethod('MIDTRANS')}
                >
                  <div className="flex items-center gap-3 font-semibold text-left">
                    <span className="text-xl">💳</span> 
                    <span>
                      Midtrans <br/>
                      <span className="text-xs font-normal opacity-80">(QRIS / Transfer / Card)</span>
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'MIDTRANS' ? 'border-blue-600' : 'border-zinc-300'}`}>
                    {paymentMethod === 'MIDTRANS' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                  </div>
                </button>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="border-t border-zinc-100 pt-5 space-y-4 text-left">
                  {/* Rounding Dropdown (Custom UI) */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Pembulatan</label>
                    <button
                      type="button"
                      onClick={() => setShowRoundingDropdown(!showRoundingDropdown)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        {roundingType === 'NONE' && "Tanpa Pembulatan"}
                        {roundingType === 'DOWN_100' && "Bulatkan Bawah Rp 100"}
                        {roundingType === 'UP_100' && "Bulatkan Atas Rp 100"}
                        {roundingType === 'DOWN_500' && "Bulatkan Bawah Rp 500"}
                        {roundingType === 'UP_500' && "Bulatkan Atas Rp 500"}
                        {roundingType === 'DOWN_1000' && "Bulatkan Bawah Rp 1.000"}
                        {roundingType === 'UP_1000' && "Bulatkan Atas Rp 1.000"}
                      </span>
                      <span className="text-zinc-400 text-xs">▼</span>
                    </button>

                    {showRoundingDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowRoundingDropdown(false)} />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto custom-scrollbar-light">
                          {[
                            { value: 'NONE', label: "Tanpa Pembulatan" },
                            { value: 'DOWN_100', label: "Bulatkan Bawah Rp 100" },
                            { value: 'UP_100', label: "Bulatkan Atas Rp 105" }, // Wait, matched labels
                            { value: 'UP_105', label: "Bulatkan Atas Rp 100" }, // Keep label correct
                          ].map((opt) => {
                            // Map values dynamically to display properly
                            let displayVal = opt.value;
                            if (opt.value === 'UP_105') displayVal = 'UP_100';
                            if (opt.value === 'DOWN_100' || opt.value === 'NONE') displayVal = opt.value;
                            // Wait, let's keep list clean
                            return null;
                          })}
                          {[
                            { value: 'NONE', label: "Tanpa Pembulatan" },
                            { value: 'DOWN_100', label: "Bulatkan Bawah Rp 100" },
                            { value: 'UP_100', label: "Bulatkan Atas Rp 100" },
                            { value: 'DOWN_500', label: "Bulatkan Bawah Rp 500" },
                            { value: 'UP_500', label: "Bulatkan Atas Rp 500" },
                            { value: 'DOWN_1000', label: "Bulatkan Bawah Rp 1.000" },
                            { value: 'UP_1000', label: "Bulatkan Atas Rp 1.000" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setRoundingType(opt.value as any);
                                setShowRoundingDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-between cursor-pointer ${roundingType === opt.value ? 'bg-blue-50 text-blue-700 hover:bg-blue-50' : 'text-zinc-700'}`}
                            >
                              <span>{opt.label}</span>
                              {roundingType === opt.value && <span className="text-blue-600 font-bold text-xs">✓</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Final Total */}
                  <div className="flex justify-between items-center py-2.5 bg-zinc-50 px-4 rounded-xl border border-zinc-200">
                    <span className="text-sm font-medium text-zinc-500">Total Akhir</span>
                    <span className="text-lg font-bold text-zinc-900">{formatRupiah(getRoundedTotal(getTotal()))}</span>
                  </div>

                  {/* Nominal Bayar */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">Rp</span>
                      <Input 
                        type="number" 
                        value={cashAmountReceived}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCashAmountReceived(val === '' ? '' : Number(val));
                        }}
                        placeholder="Masukkan nominal bayar"
                        className="pl-10 pr-4 py-3 w-full border-zinc-200 rounded-xl focus:ring-blue-500"
                      />
                    </div>
                    {/* Quick Cash Suggestions */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button 
                        type="button"
                        onClick={() => setCashAmountReceived(getRoundedTotal(getTotal()))}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-all border border-blue-100 cursor-pointer"
                      >
                        Uang Pas
                      </button>
                      {[10000, 20000, 50000, 100000].map(val => {
                        const roundedTotal = getRoundedTotal(getTotal());
                        if (val > roundedTotal) {
                          return (
                            <button 
                              key={val}
                              type="button"
                              onClick={() => setCashAmountReceived(val)}
                              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold transition-all border border-zinc-200 cursor-pointer"
                            >
                              {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>

                  {/* Change or Warning */}
                  {cashAmountReceived !== '' && (
                    <div className="border-t border-zinc-100 pt-4">
                      {Number(cashAmountReceived) >= getRoundedTotal(getTotal()) ? (
                        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200">
                          <span className="text-sm font-medium">Kembalian</span>
                          <span className="text-xl font-bold">{formatRupiah(Number(cashAmountReceived) - getRoundedTotal(getTotal()))}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl text-rose-800 animate-pulse">
                          <span className="text-sm font-medium">Uang Kurang</span>
                          <span className="text-lg font-bold">{formatRupiah(getRoundedTotal(getTotal()) - Number(cashAmountReceived))}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer Buttons: fixed */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3 shrink-0">
              <Button variant="outline" className="flex-1 py-3" onClick={() => setShowCheckout(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl" 
                onClick={processPayment}
                disabled={isProcessing || (paymentMethod === 'CASH' && (cashAmountReceived === '' || Number(cashAmountReceived) < getRoundedTotal(getTotal())))}
              >
                Process Payment
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Konfirmasi Pembatalan Order (Custom Alert) */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl p-8 rounded-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500 animate-bounce" />
              </div>
              <h2 className="text-2xl font-display font-bold text-zinc-900 mb-2">Cancel Order?</h2>
              <p className="text-zinc-500 text-sm font-medium">
                Are you sure you want to cancel order <span className="font-mono font-bold text-zinc-900">{orderToCancel.orderNumber || orderToCancel.id}</span>?
              </p>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                This will permanently remove the pending transaction. Raw material stocks have not been deducted yet, so no stock rollback is required.
              </p>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-zinc-100">
              <Button 
                variant="outline" 
                className="flex-1 py-3" 
                onClick={() => setOrderToCancel(null)}
                disabled={isCancellingOrder}
              >
                Back
              </Button>
              <Button 
                variant="danger" 
                className="flex-1 py-3 font-semibold" 
                onClick={async () => {
                  try {
                    setIsCancellingOrder(true);
                    await axios.delete(`/api/orders/${orderToCancel.id}`);
                    showToast("Order cancelled successfully.", 'success');
                    setOrderToCancel(null);
                    refetchOrders();
                  } catch (err: any) {
                    showToast(err.response?.data?.error || "Failed to cancel order", 'error');
                  } finally {
                    setIsCancellingOrder(false);
                  }
                }}
                disabled={isCancellingOrder}
              >
                {isCancellingOrder ? "Processing..." : "Yes, Cancel"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Quick Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in duration-200">
            <button 
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 font-display">Tambah Pelanggan</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingCustomer(true);
              try {
                const res = await axios.post('/api/customers', newCustomerForm);
                await refetchCustomers();
                // Auto select newly created customer
                setCustomer(res.data.name, res.data.id, res.data.defaultDiscountPercent);
                if (res.data.defaultDiscountPercent > 0) {
                  showToast(`Pelanggan baru disimpan. Diskon ${res.data.defaultDiscountPercent}% diterapkan!`, 'success');
                } else {
                  showToast('Pelanggan berhasil ditambahkan', 'success');
                }
                setShowAddCustomerModal(false);
              } catch (err: any) {
                showToast('Gagal menyimpan pelanggan baru', 'error');
              } finally {
                setIsSavingCustomer(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={newCustomerForm.name}
                  onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">No. Telepon / WA (Opsional)</label>
                <input 
                  type="text" 
                  value={newCustomerForm.phone}
                  onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tipe Pelanggan</label>
                <select 
                  value={newCustomerForm.customerType}
                  onChange={e => setNewCustomerForm({...newCustomerForm, customerType: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition"
                >
                  <option value="REGULAR">Biasa (Regular)</option>
                  <option value="RESELLER">Reseller / Wholesale</option>
                </select>
              </div>

              {newCustomerForm.customerType === 'RESELLER' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <label className="block text-sm font-medium text-purple-900 mb-1">
                    Diskon Otomatis Reseller (%)
                  </label>
                  <input 
                    type="number" 
                    min="0" max="100" step="1"
                    required
                    value={newCustomerForm.defaultDiscountPercent}
                    onChange={e => setNewCustomerForm({...newCustomerForm, defaultDiscountPercent: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition" 
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl mt-2"
                disabled={isSavingCustomer}
              >
                {isSavingCustomer ? 'Menyimpan...' : 'Simpan & Pilih Pelanggan'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>

    {/* Struk Print Out (Hidden in browser, visible in print) */}
    <div className="hidden print:block w-[58mm] max-w-[58mm] bg-white text-black font-mono text-[12px] leading-tight p-0 m-0">
      <div className="text-center mb-4">
        <h1 className="font-bold text-[16px]">TRESBROS COFFEE</h1>
        <p>Jl. Contoh Bisnis No. 123</p>
        <p>Telp: 0812-3456-7890</p>
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        <p>Cashier : Admin</p>
        <p>Time : {isMounted ? new Date().toLocaleString('id-ID') : ''}</p>
        {lastOrderNumber && <p>Order No: {lastOrderNumber}</p>}
        {lastQueueNumber && <p className="font-bold text-[14px] mt-1 mb-1">Queue No: {lastQueueNumber}</p>}
        {customerName && <p>Name  : {customerName}</p>}
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        {items.map(item => (
          <div key={item.cartItemId} className="mb-1">
            <div className="font-bold">{item.name}</div>
            {item.notes && <div className="text-[10px] text-zinc-600 italic pl-2">- {item.notes}</div>}
            <div className="flex justify-between">
              <span>{item.quantity} x {formatRupiah(item.price)}</span>
              <span>{formatRupiah(item.quantity * item.price)}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(getSubtotal())}</span></div>
        {discountAmount > 0 && <div className="flex justify-between"><span>Discount {appliedCoupon ? `[${appliedCoupon.code}]` : (discountType === 'percentage' ? `(${discountAmount}%)` : '')}</span><span>-{formatRupiah(getCalculatedDiscount())}</span></div>}
        {taxEnabled && <div className="flex justify-between"><span>PB1 (11%)</span><span>{formatRupiah(getTax())}</span></div>}
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{printReceiptData ? formatRupiah(printReceiptData.total) : formatRupiah(getTotal())}</span>
        </div>
        {printReceiptData && printReceiptData.paymentMethod === 'CASH' && printReceiptData.rounding !== 0 && (
          <div className="flex justify-between text-[11px] mt-0.5">
            <span>Pembulatan</span>
            <span>{printReceiptData.rounding > 0 ? '+' : ''}{formatRupiah(printReceiptData.rounding)}</span>
          </div>
        )}
        {printReceiptData && printReceiptData.paymentMethod === 'CASH' && (
          <>
            <div className="flex justify-between font-bold text-[14px] mt-1 border-t border-black border-dashed pt-1">
              <span>GRAND TOTAL</span>
              <span>{formatRupiah(printReceiptData.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-[11px] mt-1">
              <span>Bayar (Cash)</span>
              <span>{formatRupiah(printReceiptData.cashReceived)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Kembalian</span>
              <span>{formatRupiah(printReceiptData.change)}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="text-center mt-4 mb-2">
        <p className="font-bold text-[14px]">*** PAID ***</p>
        <p className="mt-1">Payment : {paymentMethod === 'CASH' ? 'Cash' : 'Midtrans'}</p>
        <p className="italic mt-2">Thank you for<br/>your visit!</p>
      </div>
    </div>
    </>
  );
}
