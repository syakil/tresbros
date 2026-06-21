import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Modal, useWindowDimensions } from 'react-native';
import { useCartStore, Product } from '../store/useCartStore';
import { ShoppingCart, Search, Coffee, Pizza, Plus, Minus, Trash2, User, Tag, ReceiptText } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { WebView } from 'react-native-webview';

import { API_URL } from '../lib/api';

export function Pos() {
  const navigation = useNavigation<any>();
  const { items, customerName, setCustomerName, addItem, removeItem, updateQuantity, getSubtotal, getTax, getTotal, clearCart, discountAmount, setDiscountAmount, discountType, setDiscountType, getCalculatedDiscount, appliedCoupon, setAppliedCoupon, setTaxEnabled, taxEnabled } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [couponInput, setCouponInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  // Ubah tipe paymentMethod agar support MIDTRANS
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MIDTRANS'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isDesktop = width >= 1024; // lg breakpoint in Tailwind
  const [isCartOpen, setIsCartOpen] = useState(false);

  const categories = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan'];

  useEffect(() => {
    if (appliedCoupon) {
      const sub = getSubtotal();
      if (sub < appliedCoupon.minPurchase) {
        setAppliedCoupon(null, 0);
        Alert.alert('Kupon Dibatalkan', `Minimal belanja Rp ${formatRupiah(appliedCoupon.minPurchase)} tidak terpenuhi.`);
      } else {
        let amt = appliedCoupon.type === 'NOMINAL' ? appliedCoupon.value : (sub * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount && amt > appliedCoupon.maxDiscount) amt = appliedCoupon.maxDiscount;
        if (amt > sub) amt = sub;
        setAppliedCoupon(appliedCoupon, amt);
      }
    }
  }, [items]);

  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [showPendingOrders, setShowPendingOrders] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/products`);
        setProducts(res.data);
        
        try {
          const taxRes = await axios.get(`${API_URL}/settings/TAX_ENABLED`);
          setTaxEnabled(taxRes.data.value === 'true');
        } catch(e) {
          console.log('Tax setting not found, defaulting to true');
        }

      } catch (error) {
        console.error("Failed to fetch products:", error);
        Alert.alert("Error", "Gagal memuat produk dari server. Pastikan server Next.js jalan dan IP benar.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      const pending = res.data.filter((o: any) => o.paymentMethod === 'MIDTRANS' && o.paymentStatus === 'pending' && o.status === 'TODO');
      setPendingOrders(pending);
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'Semua' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const getCategoryIcon = (cat: string, size = 20, color = "#F3EDE1") => {
    if (cat === 'Makanan') return <Pizza size={size} color={color} />;
    return <Coffee size={size} color={color} />;
  };

  const handleValidateCoupon = async () => {
    if (!couponInput) return;
    setIsValidatingCoupon(true);
    try {
      const res = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponInput,
        subtotal: getSubtotal()
      });
      setAppliedCoupon(res.data.coupon, res.data.calculatedDiscount);
      setCouponInput('');
      Alert.alert("Sukses", "Kupon berhasil diterapkan!");
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.error || "Gagal memvalidasi kupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setShowCheckout(true);
  };

  const processPayment = async (method: 'CASH' | 'MIDTRANS' = paymentMethod) => {
    try {
      setIsProcessing(true);
      const res = await axios.post(`${API_URL}/orders`, {
        customerName: customerName,
        totalAmount: getTotal(),
        couponCode: appliedCoupon?.code || null,
        discountAmount: getCalculatedDiscount(),
        paymentMethod: method,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      });
      
      clearCart();
      setShowCheckout(false);
      setIsCartOpen(false);

      if (method === 'MIDTRANS' && res.data.paymentUrl) {
        setPaymentUrl(res.data.paymentUrl);
      } else {
        Alert.alert("Sukses", "Pembayaran Berhasil! Pesanan dikirim ke KDS.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function for Cart Items Content (reused in desktop right panel and mobile modal)
  const renderCartItems = () => (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center mt-10 opacity-50">
          <ShoppingCart size={48} color="#7D8F6A" className="mb-4" />
          <Text className="text-brand-sage font-medium">Belum ada pesanan</Text>
          <Text className="text-brand-sage/60 text-xs mt-1">Pilih menu untuk mulai menambahkan</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.cartItemId} className="bg-white/5 border border-white/5 rounded-2xl p-3 mb-3">
            <View className="flex-row justify-between items-start">
              <Text className="flex-1 text-brand-cream text-sm font-medium mr-2" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-brand-warm text-sm font-bold">
                {formatRupiah(item.price * item.quantity)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mt-3">
              <TouchableOpacity onPress={() => removeItem(item.cartItemId)} className="p-1.5 bg-red-500/10 rounded-lg">
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>

              <View className="flex-row items-center bg-black/40 rounded-xl border border-white/5 p-1">
                <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-8 h-8 items-center justify-center rounded-lg">
                  <Minus size={16} color="#7D8F6A" />
                </TouchableOpacity>
                <Text className="text-brand-cream font-bold w-6 text-center">{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="w-8 h-8 bg-brand-warm/20 items-center justify-center rounded-lg">
                  <Plus size={16} color="#D4A373" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderCheckoutFooter = () => (
    <View className="p-4 bg-black/40 border-t border-white/5">
      <View className="flex-row justify-between mb-2">
        <Text className="text-brand-sage text-sm">Subtotal</Text>
        <Text className="text-brand-cream font-medium">{formatRupiah(getSubtotal())}</Text>
      </View>
      
      {discountAmount > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-red-400 text-sm">Diskon {appliedCoupon ? `[${appliedCoupon.code}]` : (discountType === 'percentage' ? `(${discountAmount}%)` : '')}</Text>
          <Text className="text-red-400 font-medium">-{formatRupiah(getCalculatedDiscount())}</Text>
        </View>
      )}

      {taxEnabled && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-brand-sage text-sm">Pajak (11%)</Text>
          <Text className="text-brand-cream font-medium">{formatRupiah(getTax())}</Text>
        </View>
      )}
      
      <View className="border-t border-white/10 border-dashed my-2" />

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-brand-cream font-bold text-lg">Total Bayar</Text>
        <Text className="text-brand-warm font-bold text-2xl">{formatRupiah(getTotal())}</Text>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity 
          disabled={items.length === 0 || isProcessing}
          onPress={() => processPayment('MIDTRANS')}
          className={`flex-1 py-4 border border-brand-warm/30 rounded-2xl items-center flex-row justify-center ${items.length === 0 ? 'opacity-50' : 'active:bg-brand-warm/10'}`}
        >
          <Text className="text-brand-warm font-bold ml-2">QRIS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          disabled={items.length === 0 || isProcessing}
          onPress={() => processPayment('CASH')}
          className={`flex-1 py-4 bg-brand-warm rounded-2xl items-center flex-row justify-center ${items.length === 0 ? 'opacity-50' : 'active:scale-95'}`}
        >
          <Text className="text-brand-dark font-bold ml-2">Tunai</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
    <View className="flex-1 flex-col lg:flex-row bg-brand-dark">
      {/* Top Bar (Mobile Only) */}
      {!isDesktop && (
        <View className="flex-row items-center justify-between px-4 py-3 bg-brand-dark z-20 border-b border-white/5">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-brand-warm/20 items-center justify-center border border-brand-warm/30">
              <Coffee size={20} color="#D4A373" />
            </View>
            <View>
              <Text className="font-bold text-lg text-brand-cream leading-tight">Tresbros</Text>
              <Text className="text-xs text-brand-sage/70">Kasir Utama</Text>
            </View>
          </View>
        </View>
      )}

      {/* KIRI: Grid Menu Produk */}
      <View className="flex-1 flex-col p-4 border-r border-white/5 pb-24">
        
        {/* Header Kiri: Search & Kategori */}
        <View className="mb-4 space-y-3">
          {pendingOrders.length > 0 && (
            <TouchableOpacity 
              onPress={() => setShowPendingOrders(true)}
              className="bg-orange-500/20 border border-orange-500/50 p-3 rounded-xl flex-row justify-center items-center mb-3"
            >
              <Text className="text-orange-400 font-bold">{pendingOrders.length} Pesanan Tertunda (Midtrans)</Text>
            </TouchableOpacity>
          )}
          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <Search size={20} color="#7D8F6A" />
            <TextInput
              placeholder="Cari menu produk..."
              placeholderTextColor="#7D8F6A"
              className="flex-1 text-brand-cream ml-3 h-10 py-0"
              underlineColorAndroid="transparent"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className={`px-5 py-2 mr-3 rounded-xl justify-center items-center ${
                  activeCategory === cat ? 'bg-brand-warm shadow-md' : 'bg-white/5 border border-white/5'
                }`}
              >
                <Text className={`font-bold text-sm ${activeCategory === cat ? 'text-brand-dark' : 'text-brand-sage'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Grid Produk */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-brand-sage">Memuat produk...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id.toString()}
            numColumns={isLandscape && !isDesktop ? 3 : 2}
            key={isLandscape && !isDesktop ? 'landscape' : 'portrait'}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => addItem(item)}
                className={`bg-brand-olive/5 border border-brand-olive/20 rounded-2xl p-4 justify-between shadow-sm active:bg-brand-olive/10 ${isLandscape && !isDesktop ? 'w-[31%]' : 'w-[48%]'}`}
              >
                <View className="w-10 h-10 bg-black/30 rounded-full items-center justify-center mb-4">
                  {getCategoryIcon(item.category, 20, "#FAEDCD")}
                </View>
                <Text className="font-medium text-brand-cream text-[15px] leading-tight" numberOfLines={2}>
                  {item.name}
                </Text>
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="font-bold text-brand-warm text-lg">
                    {formatRupiah(item.price)}
                  </Text>
                  <View className="w-7 h-7 rounded-full bg-brand-warm/10 items-center justify-center border border-brand-warm/30">
                    <Plus size={16} color="#D4A373" />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center mt-20">
                <Search size={48} color="#7D8F6A" opacity={0.3} className="mb-4" />
                <Text className="text-brand-sage">Produk tidak ditemukan</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Floating Bottom Bar (Mobile Only) */}
      {!isDesktop && (
        <View className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-30 bg-black/60 border-t border-white/10 rounded-t-[32px]">
          <TouchableOpacity 
            onPress={() => setIsCartOpen(true)}
            className="w-full flex-row items-center justify-between bg-brand-warm p-4 rounded-2xl active:scale-[0.98]"
          >
            <View className="flex-row items-center gap-3">
              <View className="relative">
                <ShoppingCart size={24} color="#1c140d" />
                {items.length > 0 && (
                  <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 items-center justify-center rounded-full border-2 border-brand-warm">
                    <Text className="text-white text-[10px] font-bold">{items.length}</Text>
                  </View>
                )}
              </View>
              <View>
                <Text className="text-xs font-bold text-brand-dark opacity-80">Total Pesanan</Text>
                <Text className="font-bold text-lg text-brand-dark leading-none mt-0.5">{formatRupiah(getSubtotal())}</Text>
              </View>
            </View>
            <View className="bg-brand-dark/10 px-4 py-2 rounded-xl">
              <Text className="font-bold uppercase tracking-wider text-sm text-brand-dark">Lanjut &rarr;</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* KANAN: Keranjang / Cart (Desktop Only) */}
      {isDesktop && (
        <View className="w-[340px] bg-black/20 flex-col">
          <View className="p-4 border-b border-white/10 bg-black/20 gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <ShoppingCart size={24} color="#A16B3D" />
                <Text className="font-bold text-lg text-brand-cream ml-2">Pesanan Aktif</Text>
              </View>
              <View className="bg-brand-warm px-2 py-1 rounded-md">
                <Text className="text-brand-cream font-bold text-xs">{items.length} item</Text>
              </View>
            </View>

            <View className="flex-row items-center bg-black/40 border border-white/10 rounded-lg px-3 py-1">
              <User size={16} color="#7D8F6A" />
              <TextInput
                placeholder="Nama Customer (Opsional)"
                placeholderTextColor="#7D8F6A"
                className="flex-1 text-brand-cream text-sm ml-2 h-10 py-0"
                underlineColorAndroid="transparent"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
          </View>
          
          {renderCartItems()}
          {renderCheckoutFooter()}
        </View>
      )}
    </View>

    {/* Cart Bottom Sheet Modal (Mobile Only) */}
    <Modal visible={isCartOpen && !isDesktop} transparent animationType="slide">
      <View className="flex-1 flex-col justify-end">
        {/* Overlay */}
        <TouchableOpacity 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} 
          onPress={() => setIsCartOpen(false)} 
          activeOpacity={1}
        />
        
        {/* Sheet Content */}
        <View className={`bg-brand-dark border-t border-white/10 rounded-t-[32px] w-full overflow-hidden ${isLandscape ? 'flex-row h-[95%]' : 'flex-col h-[85%]'}`}>
          
          {/* Left Side (Header & Items) */}
          <View className="flex-1 flex-col pt-4">
            {/* Header */}
            <View className="px-6 pb-4 flex-row items-center justify-between border-b border-white/5">
              <View>
                <Text className="font-bold text-xl text-brand-cream">Keranjang Anda</Text>
                <Text className="text-xs text-brand-sage/60 mt-1">Order Baru</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity onPress={clearCart} className="bg-white/5 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-sm font-medium text-red-400 ml-1">Kosongkan</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsCartOpen(false)} className="bg-white/10 p-2 rounded-lg ml-2">
                  <Text className="text-white font-bold text-sm">X</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Nama & Kupon in Modal */}
            <View className="px-4 py-3 border-b border-white/5 gap-3">
              <View className="flex-row items-center bg-black/40 border border-white/10 rounded-lg px-3 py-1">
                <User size={16} color="#7D8F6A" />
                <TextInput
                  placeholder="Nama Customer (Opsional)"
                  placeholderTextColor="#7D8F6A"
                  className="flex-1 text-brand-cream text-sm ml-2 h-10 py-0"
                  underlineColorAndroid="transparent"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>
            </View>

            {/* Items */}
            {renderCartItems()}
          </View>

          {/* Right/Bottom Side (Footer Checkout) */}
          <View className={`${isLandscape ? 'w-[320px] border-l border-white/5' : ''}`}>
            {renderCheckoutFooter()}
          </View>
        </View>
      </View>
    </Modal>

      {/* Modal Checkout */}
      <Modal visible={showCheckout} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View className="bg-[#1A1A1A] w-[400px] rounded-2xl p-6 border border-brand-warm/30 shadow-2xl">
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold text-brand-cream mb-2">Pilih Pembayaran</Text>
              <Text className="text-brand-sage text-sm">Total tagihan yang harus dibayar</Text>
              <Text className="text-4xl font-bold text-brand-warm mt-2">{formatRupiah(getTotal())}</Text>
            </View>

            <View className="space-y-3 mb-8">
              <TouchableOpacity 
                className={`py-4 px-4 rounded-xl flex-row items-center justify-between border ${paymentMethod === 'CASH' ? 'bg-brand-olive border-brand-olive' : 'border-white/10'}`}
                onPress={() => setPaymentMethod('CASH')}
              >
                <Text className={`font-bold text-lg ${paymentMethod === 'CASH' ? 'text-brand-cream' : 'text-white/50'}`}>💵 Tunai (Cash)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`py-4 px-4 rounded-xl flex-row items-center justify-between border ${paymentMethod === 'MIDTRANS' ? 'bg-brand-olive border-brand-olive' : 'border-white/10'}`}
                onPress={() => setPaymentMethod('MIDTRANS')}
              >
                <Text className={`font-bold text-lg ${paymentMethod === 'MIDTRANS' ? 'text-brand-cream' : 'text-white/50'}`}>💳 Bayar via Midtrans (QRIS/Transfer/Kartu)</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3 pt-4 border-t border-white/10">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl border border-white/10 items-center justify-center"
                onPress={() => setShowCheckout(false)}
              >
                <Text className="text-brand-cream font-medium">Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-brand-olive items-center justify-center opacity-100"
                onPress={processPayment}
                disabled={isProcessing}
              >
                <Text className="text-brand-cream font-bold">{isProcessing ? 'Memproses...' : 'Proses Bayar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Pesanan Tertunda */}
      <Modal visible={showPendingOrders} transparent animationType="slide">
        <View className="flex-1 bg-black/80 pt-10 pb-6 px-4">
          <View className="flex-1 bg-[#1A1A1A]/95 rounded-2xl overflow-hidden shadow-2xl p-4 border border-white/10">
            <View className="flex-row justify-between items-center mb-4 border-b border-white/10 pb-3">
              <Text className="text-brand-cream font-bold text-lg">Pesanan Menunggu Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowPendingOrders(false)} className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/50">
                <Text className="text-red-400 font-bold text-sm">Tutup</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="flex-1 space-y-3" showsVerticalScrollIndicator={false}>
              {pendingOrders.map((order: any) => (
                <View key={order.id} className="bg-black/40 border border-white/10 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Text className="font-mono text-brand-warm font-bold">{order.orderNumber || order.id}</Text>
                    <View className="bg-orange-500/20 px-2 py-0.5 rounded">
                      <Text className="text-orange-400 text-xs font-bold">MIDTRANS</Text>
                    </View>
                  </View>
                  <Text className="text-brand-sage text-sm mb-1">{order.customerName || 'Guest'}</Text>
                  <Text className="text-brand-cream font-bold text-lg mb-3">
                    Rp {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
                  </Text>
                  <TouchableOpacity 
                    className="bg-brand-olive py-3 rounded-lg items-center"
                    onPress={() => {
                      if (order.paymentUrl) {
                        setShowPendingOrders(false);
                        setPaymentUrl(order.paymentUrl);
                      } else {
                        Alert.alert("Error", "URL Pembayaran Midtrans tidak ditemukan.");
                      }
                    }}
                  >
                    <Text className="text-brand-cream font-bold">Lanjut Bayar</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {pendingOrders.length === 0 && (
                <View className="py-10 items-center justify-center">
                  <Text className="text-brand-sage text-center">Tidak ada pesanan tertunda.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Midtrans WebView */}
      <Modal visible={!!paymentUrl} transparent animationType="slide">
        <View className="flex-1 bg-black/80 pt-10 pb-6 px-4">
          <View className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl">
            <View className="flex-row justify-between items-center bg-[#3A2B1F] p-4">
              <Text className="text-[#F3EDE1] font-bold text-lg">Pembayaran Midtrans</Text>
              <TouchableOpacity onPress={() => setPaymentUrl(null)} className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/50">
                <Text className="text-red-400 font-bold text-sm">Tutup</Text>
              </TouchableOpacity>
            </View>
            {paymentUrl && (
              <WebView 
                source={{ uri: paymentUrl }}
                startInLoadingState={true}
                className="flex-1"
                onNavigationStateChange={(navState) => {
                  // Cek apakah URL sudah mengandung indikator berhasil/selesai dari Midtrans
                  if (navState.url.includes('status_code=200') || navState.url.includes('transaction_status=settlement')) {
                    Alert.alert("Sukses", "Pembayaran Midtrans Berhasil!");
                    setPaymentUrl(null);
                    fetchPendingOrders(); // Refresh daftar transaksi tertunda
                  }
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
