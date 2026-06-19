import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert, Modal } from 'react-native';
import { useCartStore, Product } from '../store/useCartStore';
import { ShoppingCart, Search, Coffee, Pizza, Plus, Minus, Trash2, User, Tag, ReceiptText } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { WebView } from 'react-native-webview';

// Konfigurasi Axios ke API Next.js (Frontend Controller)
const API_URL = 'https://tres.syakil-dev.my.id/api';

export function Pos() {
  const navigation = useNavigation<any>();
  const { items, customerName, setCustomerName, addItem, removeItem, updateQuantity, getSubtotal, getTax, getTotal, clearCart, discountAmount, setDiscountAmount, discountType, setDiscountType, getCalculatedDiscount, appliedCoupon, setAppliedCoupon } = useCartStore();
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

  const processPayment = async () => {
    try {
      setIsProcessing(true);
      const res = await axios.post(`${API_URL}/orders`, {
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
      
      clearCart();
      setShowCheckout(false);

      if (paymentMethod === 'MIDTRANS' && res.data.paymentUrl) {
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

  return (
    <>
    <View className="flex-1 flex-row bg-brand-dark">
      {/* KIRI: Grid Menu Produk */}
      <View className="flex-1 flex-col p-4 border-r border-white/5">
        
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
          <View className="flex-row items-center bg-black/20 border border-white/5 rounded-xl px-4 py-2">
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
                className={`px-5 py-2 mr-3 rounded-full border border-white/5 justify-center items-center ${
                  activeCategory === cat ? 'bg-brand-sage' : 'bg-black/20'
                }`}
              >
                <Text className={`font-medium ${activeCategory === cat ? 'text-brand-dark' : 'text-brand-sage'}`}>
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
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => addItem(item)}
                className="w-[48%] bg-[#4B5A3A] rounded-2xl p-4 min-h-[140px] justify-between border border-white/5"
              >
                <View>
                  <View className="w-10 h-10 bg-black/20 rounded-full items-center justify-center mb-3">
                    {getCategoryIcon(item.category)}
                  </View>
                  <Text className="font-medium text-brand-cream text-sm leading-tight" numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
                <Text className="font-bold text-brand-warm mt-2 text-base">
                  {formatRupiah(item.price)}
                </Text>
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

      {/* KANAN: Keranjang / Cart */}
      <View className="w-[340px] bg-black/20 flex-col">
        {/* Header Cart */}
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

        {/* Daftar Item Cart */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View className="flex-1 items-center justify-center mt-20">
              <ShoppingCart size={48} color="#7D8F6A" opacity={0.2} className="mb-4" />
              <Text className="text-brand-sage text-sm">Keranjang belum terisi</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.cartItemId} className="bg-black/40 rounded-xl p-3 mb-3 border border-white/5">
                <View className="flex-row justify-between items-start">
                  <Text className="flex-1 text-brand-cream text-sm font-medium mr-2" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className="text-brand-warm text-sm font-bold">
                    {formatRupiah(item.price * item.quantity)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mt-3">
                  <TouchableOpacity 
                    onPress={() => removeItem(item.cartItemId)} 
                    className="p-1.5 bg-red-500/10 rounded-lg"
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>

                  <View className="flex-row items-center bg-black/40 rounded-lg border border-white/5 px-2 py-1">
                    <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="p-1">
                      <Minus size={16} color="#7D8F6A" />
                    </TouchableOpacity>
                    <Text className="text-brand-cream font-bold w-6 text-center">{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="p-1">
                      <Plus size={16} color="#7D8F6A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Kupon & Diskon Manual */}
        <View className="px-4 pb-4">
          <View className="flex-row gap-2 mb-3">
            <TextInput 
              placeholder="Kode Kupon"
              placeholderTextColor="#7D8F6A"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 h-10 py-0 text-brand-cream text-sm uppercase"
              underlineColorAndroid="transparent"
              value={couponInput}
              onChangeText={(t) => setCouponInput(t.toUpperCase())}
            />
            <TouchableOpacity 
              onPress={handleValidateCoupon}
              disabled={isValidatingCoupon || !couponInput || items.length === 0}
              className="bg-brand-sage px-4 justify-center rounded-xl"
              style={{ opacity: (isValidatingCoupon || !couponInput || items.length === 0) ? 0.5 : 1 }}
            >
              <Text className="font-bold text-brand-dark">Cek</Text>
            </TouchableOpacity>
          </View>

          <View className={`flex-row justify-between items-center bg-black/40 border border-white/10 rounded-xl p-2 pl-4 ${appliedCoupon ? 'opacity-50' : ''}`}>
            <Text className="text-sm font-medium text-brand-sage">
              {appliedCoupon ? `Kupon: ${appliedCoupon.code}` : 'Diskon Manual'}
            </Text>
            
            {!appliedCoupon && (
              <View className="flex-row items-center w-[60%] justify-end">
                <View className="flex-row bg-black/50 rounded-lg p-0.5 border border-white/5 mr-2">
                  <TouchableOpacity 
                    className={`px-3 py-1 rounded-md ${discountType === 'nominal' ? 'bg-brand-sage' : ''}`}
                    onPress={() => setDiscountType('nominal')}
                  >
                    <Text className={`text-xs font-bold ${discountType === 'nominal' ? 'text-brand-dark' : 'text-brand-sage'}`}>Rp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className={`px-3 py-1 rounded-md ${discountType === 'percentage' ? 'bg-brand-sage' : ''}`}
                    onPress={() => setDiscountType('percentage')}
                  >
                    <Text className={`text-xs font-bold ${discountType === 'percentage' ? 'text-brand-dark' : 'text-brand-sage'}`}>%</Text>
                  </TouchableOpacity>
                </View>
                <TextInput 
                  placeholder="0"
                  placeholderTextColor="#7D8F6A"
                  keyboardType="numeric"
                  className="text-right text-brand-cream font-bold w-16 h-8 py-0"
                  underlineColorAndroid="transparent"
                  value={discountType === 'nominal' ? (discountAmount ? discountAmount.toString() : '') : (discountAmount ? discountAmount.toString() : '')}
                  onChangeText={(val) => {
                    let num = parseInt(val.replace(/\D/g, ''), 10) || 0;
                    if (discountType === 'percentage' && num > 100) num = 100;
                    setDiscountAmount(num);
                  }}
                />
              </View>
            )}
            
            {appliedCoupon && (
              <TouchableOpacity onPress={() => setAppliedCoupon(null, 0)}>
                <Text className="text-xs text-red-400 font-bold mr-2">Hapus</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Ringkasan & Checkout */}
        <View className="p-4 border-t border-white/10 bg-black/20">
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

          <View className="flex-row justify-between mb-4">
            <Text className="text-brand-sage text-sm">Pajak (11%)</Text>
            <Text className="text-brand-cream font-medium">{formatRupiah(getTax())}</Text>
          </View>
          
          <View className="flex-row justify-between items-end border-b border-white/5 pb-4 mb-4">
            <Text className="text-brand-sage font-medium">Total Bayar</Text>
            <Text className="text-brand-warm font-bold text-2xl">{formatRupiah(getTotal())}</Text>
          </View>

          <TouchableOpacity 
            disabled={items.length === 0}
            onPress={handleCheckout}
            className={`py-4 rounded-xl items-center ${items.length === 0 ? 'bg-brand-olive/30' : 'bg-brand-olive'}`}
          >
            <Text className={`font-bold text-lg ${items.length === 0 ? 'text-brand-cream/50' : 'text-brand-cream'}`}>
              Selesaikan Pesanan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

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
