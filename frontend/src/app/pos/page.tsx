"use client";

import React, { useState, useEffect } from 'react';
import { useCartStore, Product } from '@/store/useCartStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Minus, Trash2, ShoppingCart, Coffee, Search, Pizza, User } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function PosPage() {
  const { items, customerName, setCustomerName, addItem, removeItem, updateQuantity, getSubtotal, getTax, getTotal, clearCart, discountAmount, setDiscountAmount, discountType, setDiscountType, getCalculatedDiscount, appliedCoupon, setAppliedCoupon, setTaxEnabled, taxEnabled } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
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

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['pos-orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders');
      return res.data;
    },
    refetchInterval: 5000 // auto refresh setiap 5 detik
  });

  const pendingOrders = orders?.filter((o: any) => o.paymentMethod === 'MIDTRANS' && o.paymentStatus === 'pending' && o.status === 'TODO') || [];

  useEffect(() => {
    setIsMounted(true);
    // Memuat script Snap.js secara dinamis khusus di halaman POS untuk mencegah error postMessage Next.js
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = "SB-Mid-client-3c-KuTSEjRrpPILS";

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
        showToast(`Kupon dibatalkan: minimal belanja Rp ${formatRupiah(appliedCoupon.minPurchase)} tidak terpenuhi.`, 'warning');
      } else {
        let amt = appliedCoupon.type === 'NOMINAL' ? appliedCoupon.value : (sub * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount && amt > appliedCoupon.maxDiscount) amt = appliedCoupon.maxDiscount;
        if (amt > sub) amt = sub;
        setAppliedCoupon(appliedCoupon, amt);
      }
    }
  }, [items]);

  const categories = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan'];
  
  // Fetch real data from Next.js API Routes (SQLite Dummy Backend)
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products');
      return res.data;
    }
  });
  
  // Filter by Category AND Search Query
  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'Semua' || p.category === activeCategory;
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
      showToast('Kupon berhasil diterapkan!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || "Gagal memvalidasi kupon", 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setShowCheckout(true);
  };

  const processPayment = async () => {
    try {
      setIsProcessing(true);
      const res = await axios.post('/api/orders', {
        customerName: customerName,
        totalAmount: getTotal(),
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

      if (paymentMethod === 'MIDTRANS') {
        if (res.data.snapToken) {
           // Tampilkan Midtrans Snap Popup tanpa menutup checkout modal dulu (mencegah DOM unmount yang bikin error)
           (window as any).snap.pay(res.data.snapToken, {
             onSuccess: function(result: any){
               setShowCheckout(false);
               showToast("Pembayaran Midtrans Berhasil! Pesanan dikirim ke KDS.", 'success');
               setTimeout(() => { 
                 window.print(); 
                 clearCart();
               }, 500);
             },
             onPending: function(result: any){
               setShowCheckout(false);
               showToast("Pesanan dibuat. Menunggu pembayaran Anda...", 'warning');
               clearCart();
             },
             onError: function(result: any){
               showToast("Pembayaran gagal.", 'error');
               // Tidak menutup modal checkout agar kasir bisa coba lagi
             },
             onClose: function(){
               showToast("Jendela pembayaran ditutup.", 'warning');
               // Tidak menutup modal checkout agar kasir bisa coba lagi/ganti metode bayar
             }
           });
           return;
        } else {
           showToast("Gagal membuat transaksi Midtrans. Cek API Key di backend.", 'error');
           return;
        }
      }

      // Untuk pembayaran CASH, langsung tutup modal
      setShowCheckout(false);

      showToast("Pembayaran Berhasil! Pesanan dikirim ke KDS.", 'success');
      // Trigger print receipt
      setTimeout(() => {
        window.print();
        clearCart();
      }, 500);
    } catch (error) {
      showToast("Terjadi kesalahan saat menyimpan pesanan.", 'error');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === 'Makanan') return <Pizza className="w-5 h-5 text-brand-cream" />;
    return <Coffee className="w-5 h-5 text-brand-cream" />;
  };

  return (
    <>
    {/* Custom Toast Notification */}
    {toast && (
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-top-4 flex items-center gap-3 print:hidden transition-all
        ${toast.type === 'success' ? 'bg-brand-sage/95 text-brand-dark border-brand-sage' : 
          toast.type === 'error' ? 'bg-red-500/95 text-white border-red-400' : 
          'bg-orange-500/95 text-white border-orange-400'}`}
      >
        <span className="text-xl">
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
        </span>
        <p className="font-medium">{toast.message}</p>
      </div>
    )}

    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] print:hidden">
      
      {/* KIRI: Grid Menu Produk */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Header Kiri: Search & Kategori Filter */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-brand-sage" />
              </div>
              <input
                type="text"
                placeholder="Cari menu produk..."
                className="w-full bg-black/20 border border-white/5 text-brand-cream rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {pendingOrders.length > 0 && (
              <button 
                onClick={() => setShowPendingOrders(true)}
                className="bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500/40 px-6 rounded-xl font-bold transition-all"
              >
                {pendingOrders.length} Pesanan Tertunda
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-medium transition whitespace-nowrap text-sm ${
                  activeCategory === cat 
                    ? 'bg-brand-sage text-brand-cream shadow-md' 
                    : 'bg-black/20 text-brand-sage border border-white/5 hover:bg-black/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-brand-sage/50 mt-10">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Produk tidak ditemukan</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              variant="olive" 
              className="flex flex-col justify-between h-44 active:scale-95 transition-transform group relative"
              onClick={() => addItem(product)}
            >
              {typeof product.availableCount === 'number' && product.availableCount <= 0 && (
                <div className="absolute inset-0 bg-red-900/40 rounded-2xl z-10 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-red-400">
                    Habis / Stok Kurang
                  </div>
                </div>
              )}
              <div className="relative z-0">
                <div className="w-10 h-10 bg-black/20 group-hover:bg-brand-olive rounded-full flex items-center justify-center mb-4 transition-colors">
                  {getCategoryIcon(product.category)}
                </div>
                <h3 className="font-medium text-brand-cream text-[15px] leading-tight line-clamp-2">{product.name}</h3>
              </div>
              <p className="font-display font-semibold text-brand-warm mt-2 text-lg">{formatRupiah(product.price)}</p>
            </Card>
            ))
          )}
        </div>
      </div>

      {/* KANAN: Keranjang / Cart */}
      <Card className="w-full lg:w-[400px] flex flex-col shrink-0 h-full border-brand-warm/20 bg-gradient-to-b from-black/40 to-black/20 p-0 overflow-hidden">
        <div className="flex flex-col p-5 border-b border-white/10 shrink-0 bg-black/20 gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-brand-warm w-6 h-6" />
            <h2 className="font-display text-xl font-semibold text-brand-cream">Pesanan Aktif</h2>
            <span className="ml-auto bg-brand-warm text-brand-cream text-xs font-bold px-2 py-1 rounded-md">{items.length} item</span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-brand-sage" />
            </div>
            <input
              type="text"
              placeholder="Nama Customer (Opsional)"
              className="w-full bg-black/40 border border-white/10 text-brand-cream text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-warm transition"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>

        {/* Daftar Item Cart */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-sage/40">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm font-medium">Keranjang belum terisi</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="flex flex-col gap-2 p-3 bg-black/40 hover:bg-black/60 transition-colors rounded-xl border border-white/5 relative">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-brand-cream text-sm leading-tight">{item.name}</p>
                    {typeof item.availableCount === 'number' && item.quantity > item.availableCount && (
                      <div className="flex flex-col mt-1.5 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                        <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                          Stok Bahan Baku Kurang
                        </span>
                        {item.missingMaterials && item.missingMaterials.length > 0 && (
                          <span className="text-[10px] text-red-400/80 mt-1 pl-2 border-l border-red-500/30">Butuh: {item.missingMaterials.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-brand-warm text-sm whitespace-nowrap mt-0.5">{formatRupiah(item.price * item.quantity)}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <button onClick={() => removeItem(item.cartItemId)} className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3 bg-black/40 rounded-lg px-2 py-1 border border-white/5">
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="text-brand-sage hover:text-brand-cream p-1">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-brand-cream font-medium w-4 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="text-brand-sage hover:text-brand-cream p-1">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Kupon */}
        <div className="px-5 mb-2 shrink-0">
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Masukkan Kode Kupon"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-brand-cream focus:outline-none focus:border-brand-warm uppercase"
              value={couponInput}
              onChange={e => setCouponInput(e.target.value.toUpperCase())}
            />
            <button 
              onClick={handleValidateCoupon}
              disabled={isValidatingCoupon || !couponInput || items.length === 0}
              className="bg-brand-sage hover:bg-brand-sage/80 disabled:opacity-50 text-brand-dark px-4 rounded-xl text-sm font-bold transition-colors"
            >
              Cek
            </button>
          </div>
        </div>

        {/* Input Diskon Manual */}
        <div className="px-5 mb-2 shrink-0">
          <div className={`flex justify-between items-center bg-black/40 border border-white/10 rounded-xl p-2 pl-4 transition-colors ${appliedCoupon ? 'opacity-50 pointer-events-none' : 'focus-within:border-brand-warm'}`}>
            <span className="text-sm font-medium text-brand-sage">
              {appliedCoupon ? `Kupon: ${appliedCoupon.code}` : 'Diskon Manual'}
            </span>
            
            {!appliedCoupon && (
              <div className="flex items-center gap-2 w-2/3">
                <div className="flex bg-black/50 rounded-lg p-0.5 shrink-0 border border-white/5">
                  <button 
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${discountType === 'nominal' ? 'bg-brand-sage text-brand-cream' : 'text-brand-sage/60 hover:text-brand-cream'}`}
                    onClick={() => setDiscountType('nominal')}
                  >Rp</button>
                  <button 
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${discountType === 'percentage' ? 'bg-brand-sage text-brand-cream' : 'text-brand-sage/60 hover:text-brand-cream'}`}
                    onClick={() => setDiscountType('percentage')}
                  >%</button>
                </div>
                <input 
                  type="text"
                  placeholder="0"
                  className="bg-transparent text-right text-brand-cream font-display font-bold focus:outline-none w-full min-w-0"
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
                className="text-xs text-red-400 font-bold hover:underline"
              >Hapus</button>
            )}
          </div>
        </div>

        {/* Ringkasan Biaya */}
        <div className="p-5 border-t border-white/10 shrink-0 bg-black/20">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-brand-sage">
              <span>Subtotal</span>
              <span className="font-medium text-brand-cream">{formatRupiah(getSubtotal())}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-400">
                <span>Diskon {appliedCoupon ? `[${appliedCoupon.code}]` : (discountType === 'percentage' ? `(${discountAmount}%)` : '')}</span>
                <span className="font-medium">-{formatRupiah(getCalculatedDiscount())}</span>
              </div>
            )}
            {taxEnabled && (
              <div className="flex justify-between text-sm text-brand-sage">
                <span>Pajak (11%)</span>
                <span className="font-medium text-brand-cream">{formatRupiah(getTax())}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-end pb-4 border-b border-white/5 mb-4">
            <span className="text-brand-sage font-medium">Total Bayar</span>
            <span className="text-3xl font-display font-bold text-brand-warm leading-none">{formatRupiah(getTotal())}</span>
          </div>
          
          <Button 
            variant="primary" 
            fullWidth 
            className="text-lg py-4 shadow-[0_0_20px_rgba(75,90,58,0.3)] disabled:opacity-30 disabled:shadow-none"
            disabled={items.length === 0}
            onClick={handleCheckout}
          >
            Selesaikan Pesanan
          </Button>
        </div>
      </Card>

      {/* Modal Pesanan Tertunda */}
      {showPendingOrders && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-2xl bg-[#1A1A1A]/95 border-brand-warm/30 shadow-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-brand-cream">Pesanan Menunggu Pembayaran</h2>
              <button onClick={() => setShowPendingOrders(false)} className="text-red-400 font-bold px-3 py-1 bg-red-500/20 rounded-lg hover:bg-red-500/30">Tutup</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {pendingOrders.map((order: any) => (
                <div key={order.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-brand-warm font-bold">{order.orderNumber || order.id}</span>
                      <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded">MIDTRANS</span>
                    </div>
                    <div className="text-brand-sage text-sm">{order.customerName || 'Guest'} • {new Date(order.createdAt).toLocaleTimeString('id-ID')}</div>
                    <div className="text-brand-cream font-bold mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.totalAmount)}</div>
                  </div>
                  <Button 
                    variant="primary" 
                    className="bg-brand-olive shadow-[0_0_15px_rgba(75,90,58,0.4)]"
                    onClick={() => {
                      if (order.snapToken) {
                        setShowPendingOrders(false);
                        (window as any).snap.pay(order.snapToken, {
                          onSuccess: function(){
                            showToast("Pembayaran Berhasil! Pesanan dikirim ke KDS.", 'success');
                            setLastOrderNumber(order.orderNumber || order.id);
                            setLastQueueNumber(order.queueNumber || '-');
                            setTimeout(() => window.print(), 500);
                            refetchOrders();
                          },
                          onPending: function(){
                            showToast("Pembayaran masih tertunda...", 'warning');
                            refetchOrders();
                          },
                          onError: function(){
                            showToast("Pembayaran gagal.", 'error');
                            refetchOrders();
                          },
                          onClose: function(){
                            showToast("Jendela pembayaran ditutup.", 'warning');
                            refetchOrders();
                          }
                        });
                      } else {
                        showToast("Token Midtrans tidak ditemukan.", 'error');
                      }
                    }}
                  >
                    Lanjut Bayar
                  </Button>
                </div>
              ))}
              
              {pendingOrders.length === 0 && (
                <div className="text-center text-brand-sage py-8">Tidak ada pesanan tertunda.</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Checkout (Glassmorphism Overlay) */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-md bg-[#1A1A1A]/90 border-brand-warm/30 shadow-2xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-brand-cream mb-2">Pilih Pembayaran</h2>
              <p className="text-brand-sage text-sm">Total tagihan yang harus dibayar</p>
              <p className="text-4xl font-display font-bold text-brand-warm mt-2">{formatRupiah(getTotal())}</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <Button 
                variant={paymentMethod === 'CASH' ? 'primary' : 'outline'} 
                fullWidth 
                className={`justify-start py-4 font-semibold ${paymentMethod === 'CASH' ? 'bg-brand-olive border-brand-olive text-brand-cream' : 'hover:border-brand-warm hover:text-brand-warm'}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                💵 Tunai (Cash)
              </Button>
              <Button 
                variant={paymentMethod === 'MIDTRANS' ? 'primary' : 'outline'} 
                fullWidth 
                className={`justify-start py-4 font-semibold ${paymentMethod === 'MIDTRANS' ? 'bg-brand-olive border-brand-olive text-brand-cream' : 'hover:border-brand-warm hover:text-brand-warm'}`}
                onClick={() => setPaymentMethod('MIDTRANS')}
              >
                💳 Bayar via Midtrans (QRIS/Transfer/Kartu)
              </Button>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCheckout(false)}>Kembali</Button>
              <Button variant="primary" className="flex-1 bg-brand-olive" onClick={processPayment}>Proses Bayar</Button>
            </div>
          </Card>
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
        <p>Kasir : Admin</p>
        <p>Waktu : {isMounted ? new Date().toLocaleString('id-ID') : ''}</p>
        {lastOrderNumber && <p>No. Order: {lastOrderNumber}</p>}
        {lastQueueNumber && <p className="font-bold text-[14px] mt-1 mb-1">No. Antrian: {lastQueueNumber}</p>}
        {customerName && <p>Nama  : {customerName}</p>}
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        {items.map(item => (
          <div key={item.cartItemId} className="mb-1">
            <div className="font-bold">{item.name}</div>
            <div className="flex justify-between">
              <span>{item.quantity} x {item.price}</span>
              <span>{item.quantity * item.price}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        <div className="flex justify-between"><span>Subtotal</span><span>{getSubtotal()}</span></div>
        {discountAmount > 0 && <div className="flex justify-between"><span>Diskon {appliedCoupon ? `[${appliedCoupon.code}]` : (discountType === 'percentage' ? `(${discountAmount}%)` : '')}</span><span>-{getCalculatedDiscount()}</span></div>}
        {taxEnabled && <div className="flex justify-between"><span>PB1 (11%)</span><span>{getTax()}</span></div>}
      </div>
      
      <div className="border-b border-black border-dashed mb-2"></div>
      
      <div className="mb-2">
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>{getTotal()}</span>
        </div>
      </div>
      
      <div className="text-center mt-4 mb-2">
        <p className="font-bold text-[14px]">*** LUNAS ***</p>
        <p className="mt-1">Pembayaran : {paymentMethod === 'CASH' ? 'Tunai' : 'Midtrans'}</p>
        <p className="italic mt-2">Terima kasih atas<br/>kunjungan Anda!</p>
      </div>
    </div>
    </>
  );
}
