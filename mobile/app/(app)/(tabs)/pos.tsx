import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { Shape } from '@/theme/shape';
import { Header } from '@/components/layout/Header';
import { ProductCard } from '@/components/features/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { productsApi, type ProductResponse } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { ordersApi } from '@/api/orders';
import { settingsApi } from '@/api/settings';
import { useCartStore, type CartItem } from '@/store/useCartStore';
import { formatCurrency } from '@/utils/format';

export default function POSScreen() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MIDTRANS'>('CASH');
  const [cashAmountReceived, setCashAmountReceived] = useState<number | ''>('');
  const [roundingType, setRoundingType] = useState<'NONE' | 'DOWN_100' | 'UP_100' | 'DOWN_500' | 'UP_500' | 'DOWN_1000' | 'UP_1000'>('NONE');
  const [showRoundingDropdown, setShowRoundingDropdown] = useState(false);

  const cart = useCartStore();

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

  // Fetch global tax setting from backend
  const { data: taxSetting } = useQuery({
    queryKey: ['settings', 'TAX_ENABLED'],
    queryFn: () => settingsApi.getByKey('TAX_ENABLED'),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (taxSetting) {
      cart.setTaxEnabled(taxSetting.value === 'true');
    }
  }, [taxSetting]);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const createOrder = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: async (order) => {
      const totalAmount = getRoundedTotal(cart.getTotal());
      const change = Number(cashAmountReceived || 0) - totalAmount;

      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (order.paymentMethod === 'MIDTRANS' && order.paymentUrl) {
        try {
          await WebBrowser.openBrowserAsync(order.paymentUrl);
        } catch (err) {
          Alert.alert('Gagal', 'Gagal membuka halaman pembayaran');
        }
      } else {
        if (change > 0) {
          Alert.alert('Berhasil', `Pesanan dibuat.\nKembalian: ${formatCurrency(change)}`);
        } else {
          Alert.alert('Berhasil', 'Pesanan berhasil dibuat');
        }
      }
    },
    onError: (err: Error) => {
      Alert.alert('Gagal', err.message || 'Gagal membuat pesanan');
    },
  });

  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const handleAddProduct = (product: ProductResponse) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      categoryId: 0,
      availableCount: product.availableCount,
    });
  };

  const processCheckout = () => {
    const roundedTotal = getRoundedTotal(cart.getTotal());
    const rawTotal = cart.getTotal();
    const finalTotalAmount = paymentMethod === 'CASH' ? roundedTotal : rawTotal;
    const discountAmt = cart.getDiscount();

    createOrder.mutate({
      customerName: cart.customerName || undefined,
      paymentMethod: paymentMethod,
      discountAmount: discountAmt > 0 ? discountAmt : undefined,
      totalAmount: finalTotalAmount,
      items: cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        notes: item.notes || undefined,
      })),
    });
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    setRoundingType('NONE');
    setCashAmountReceived('');
    setShowRoundingDropdown(false);
    setPaymentMethod('CASH');
    setShowCheckout(true);
  };

  if (loadingProducts) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <Header
        title="Point of Sale"
        rightAction={
          <TouchableOpacity
            style={styles.cartBadge}
            onPress={() => setShowCart(true)}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {cart.items.length > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>{cart.items.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.name && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.name)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        renderItem={({ item }) => (
          <View style={styles.productCol}>
            <ProductCard product={item} onPress={() => handleAddProduct(item)} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState title="Tidak ada produk" description="Belum ada produk tersedia" />
        }
      />

      {/* Cart Bottom Bar */}
      {cart.items.length > 0 && !showCart && (
        <TouchableOpacity style={styles.cartBar} onPress={() => setShowCart(true)}>
          <View style={styles.cartBarLeft}>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>
                {cart.items.reduce((s, i) => s + i.quantity, 0)}
              </Text>
            </View>
            <Text style={styles.cartBarText}>Lihat Keranjang</Text>
          </View>
          <Text style={styles.cartBarTotal}>{formatCurrency(cart.getTotal())}</Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal (Bottom Sheet style) */}
      {showCart && (
        <View style={styles.cartOverlay}>
          <TouchableOpacity style={styles.cartBackdrop} onPress={() => setShowCart(false)} />
          <View style={styles.cartSheet}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Keranjang</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={cart.items}
              keyExtractor={(item) => item.cartItemId}
              renderItem={({ item }) => <CartItemRow item={item} />}
              style={styles.cartList}
            />

            <View style={styles.cartSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(cart.getSubtotal())}</Text>
              </View>
              {cart.getDiscount() > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Diskon</Text>
                  <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                    -{formatCurrency(cart.getDiscount())}
                  </Text>
                </View>
              )}
              {cart.taxEnabled && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>PB1 (11%)</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(cart.getTax())}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(cart.getTotal())}</Text>
              </View>
            </View>

            <View style={styles.cartActions}>
              <Button
                title="Hapus Semua"
                variant="outline"
                onPress={() => {
                  Alert.alert('Konfirmasi', 'Hapus semua item?', [
                    { text: 'Batal' },
                    { text: 'Hapus', style: 'destructive', onPress: () => cart.clearCart() },
                  ]);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Bayar"
                onPress={handleCheckout}
                loading={createOrder.isPending}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCheckout(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowCheckout(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Payment Method Selector */}
              <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    paymentMethod === 'CASH' && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod('CASH')}
                >
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === 'CASH' && styles.methodBtnTextActive,
                    ]}
                  >
                    💵 Tunai (Cash)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodBtn,
                    paymentMethod === 'MIDTRANS' && styles.methodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod('MIDTRANS')}
                >
                  <Text
                    style={[
                      styles.methodBtnText,
                      paymentMethod === 'MIDTRANS' && styles.methodBtnTextActive,
                    ]}
                  >
                    💳 Midtrans (QRIS/VA)
                  </Text>
                </TouchableOpacity>
              </View>

              {paymentMethod === 'CASH' ? (
                <View style={styles.cashContainer}>
                  {/* Rounding Selection */}
                  <Text style={styles.sectionLabel}>Pembulatan</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowRoundingDropdown(!showRoundingDropdown)}
                  >
                    <Text style={styles.dropdownBtnText}>
                      {roundingType === 'NONE' && 'Tanpa Pembulatan'}
                      {roundingType === 'DOWN_100' && 'Bulatkan Bawah Rp 100'}
                      {roundingType === 'UP_100' && 'Bulatkan Atas Rp 100'}
                      {roundingType === 'DOWN_500' && 'Bulatkan Bawah Rp 500'}
                      {roundingType === 'UP_500' && 'Bulatkan Atas Rp 500'}
                      {roundingType === 'DOWN_1000' && 'Bulatkan Bawah Rp 1.000'}
                      {roundingType === 'UP_1000' && 'Bulatkan Atas Rp 1.000'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  {showRoundingDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[
                        { value: 'NONE', label: 'Tanpa Pembulatan' },
                        { value: 'DOWN_100', label: 'Bulatkan Bawah Rp 100' },
                        { value: 'UP_100', label: 'Bulatkan Atas Rp 100' },
                        { value: 'DOWN_500', label: 'Bulatkan Bawah Rp 500' },
                        { value: 'UP_500', label: 'Bulatkan Atas Rp 500' },
                        { value: 'DOWN_1000', label: 'Bulatkan Bawah Rp 1.000' },
                        { value: 'UP_1000', label: 'Bulatkan Atas Rp 1.000' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.dropdownItem,
                            roundingType === opt.value && styles.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setRoundingType(opt.value as any);
                            setShowRoundingDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            roundingType === opt.value && styles.dropdownItemTextActive
                          ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.rowInfo}>
                    <Text style={styles.infoLabel}>Total Awal</Text>
                    <Text style={styles.infoValue}>{formatCurrency(cart.getTotal())}</Text>
                  </View>

                  <View style={styles.rowInfoActive}>
                    <Text style={styles.infoLabelActive}>Total Akhir</Text>
                    <Text style={styles.infoValueActive}>
                      {formatCurrency(getRoundedTotal(cart.getTotal()))}
                    </Text>
                  </View>

                  {/* Cash Amount Received Input */}
                  <Text style={styles.sectionLabel}>Uang Diterima</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputPrefix}>Rp</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={cashAmountReceived === '' ? '' : String(cashAmountReceived)}
                      onChangeText={(text) => {
                        const numeric = text.replace(/[^0-9]/g, '');
                        setCashAmountReceived(numeric === '' ? '' : Number(numeric));
                      }}
                      placeholder="Masukkan nominal bayar"
                      placeholderTextColor={Colors.zinc400}
                    />
                  </View>

                  {/* Quick Cash Suggestions */}
                  <View style={styles.quickCashContainer}>
                    <TouchableOpacity
                      style={styles.quickCashBtnPas}
                      onPress={() => setCashAmountReceived(getRoundedTotal(cart.getTotal()))}
                    >
                      <Text style={styles.quickCashBtnTextPas}>Uang Pas</Text>
                    </TouchableOpacity>
                    {[10000, 20000, 50000, 100000].map((val) => {
                      const roundedTotal = getRoundedTotal(cart.getTotal());
                      if (val > roundedTotal) {
                        return (
                          <TouchableOpacity
                            key={val}
                            style={styles.quickCashBtn}
                            onPress={() => setCashAmountReceived(val)}
                          >
                            <Text style={styles.quickCashBtnText}>
                              {formatCurrency(val).replace('Rp', '').trim()}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      return null;
                    })}
                  </View>

                  {/* Change or Due status */}
                  {cashAmountReceived !== '' && (
                    <View style={styles.statusBoxContainer}>
                      {Number(cashAmountReceived) >= getRoundedTotal(cart.getTotal()) ? (
                        <View style={styles.changeBox}>
                          <Text style={styles.changeLabel}>Kembalian</Text>
                          <Text style={styles.changeValue}>
                            {formatCurrency(Number(cashAmountReceived) - getRoundedTotal(cart.getTotal()))}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.dueBox}>
                          <Text style={styles.dueLabel}>Kurang</Text>
                          <Text style={styles.dueValue}>
                            {formatCurrency(getRoundedTotal(cart.getTotal()) - Number(cashAmountReceived))}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.midtransContainer}>
                  <View style={styles.midtransInfoBox}>
                    <Text style={styles.midtransTitle}>Pembayaran Online</Text>
                    <Text style={styles.midtransDesc}>
                      Pesanan akan dikirimkan ke Midtrans untuk diproses. Aplikasi akan membuka halaman pembayaran (Snap) secara aman langsung di dalam aplikasi.
                    </Text>
                  </View>
                  <View style={styles.rowInfoActive}>
                    <Text style={styles.infoLabelActive}>Total Tagihan</Text>
                    <Text style={styles.infoValueActive}>{formatCurrency(cart.getTotal())}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Button
                title="Batal"
                variant="outline"
                onPress={() => setShowCheckout(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={paymentMethod === 'CASH' ? 'Proses Bayar' : 'Bayar via Midtrans'}
                onPress={processCheckout}
                loading={createOrder.isPending}
                disabled={
                  paymentMethod === 'CASH' &&
                  (cashAmountReceived === '' ||
                    Number(cashAmountReceived) < getRoundedTotal(cart.getTotal()))
                }
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const cart = useCartStore();

  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemLeft}>
        <Text style={styles.cartItemName} numberOfLines={1}>
          {item.product.name}
        </Text>
        {item.notes ? <Text style={styles.cartItemNotes}>{item.notes}</Text> : null}
        <Text style={styles.cartItemPrice}>
          {formatCurrency((item.product.price + item.extraPrice) * item.quantity)}
        </Text>
      </View>
      <View style={styles.qtyControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => cart.updateQuantity(item.cartItemId, item.quantity - 1)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => cart.updateQuantity(item.cartItemId, item.quantity + 1)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.zinc50 },
  cartBadge: { position: 'relative', padding: Spacing.xs },
  cartIcon: { fontSize: 22 },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  categoryScroll: { maxHeight: 44 },
  categoryContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
  categoryChipActive: { backgroundColor: Colors.olive, borderColor: Colors.olive },
  categoryText: { ...Typography.captionMedium, color: Colors.zinc600 },
  categoryTextActive: { color: Colors.white },
  productRow: { gap: Spacing.sm, paddingHorizontal: Spacing.base },
  productList: { paddingTop: Spacing.md, paddingBottom: 80 },
  productCol: { flex: 1 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.olive,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Shape.borderRadius.xl,
    ...Shape.shadow.lg,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cartCount: {
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: { ...Typography.bodyMedium, color: Colors.olive },
  cartBarText: { ...Typography.bodyMedium, color: Colors.white },
  cartBarTotal: { ...Typography.subtitle, color: Colors.white },
  cartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cartBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cartSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Shape.borderRadius['2xl'],
    borderTopRightRadius: Shape.borderRadius['2xl'],
    maxHeight: '70%',
    padding: Spacing.lg,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  cartTitle: { ...Typography.subtitle, color: Colors.zinc900 },
  closeBtn: { fontSize: 18, color: Colors.zinc500, padding: Spacing.xs },
  cartList: { maxHeight: 250 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  cartItemLeft: { flex: 1, marginRight: Spacing.md },
  cartItemName: { ...Typography.bodyMedium, color: Colors.zinc900 },
  cartItemNotes: { ...Typography.caption, color: Colors.zinc400, marginTop: 2 },
  cartItemPrice: { ...Typography.body, color: Colors.brown, marginTop: 2 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.zinc100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, color: Colors.zinc700, fontWeight: '600' },
  qtyValue: { ...Typography.bodyMedium, color: Colors.zinc900, minWidth: 24, textAlign: 'center' },
  cartSummary: {
    borderTopWidth: 1,
    borderTopColor: Colors.zinc200,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: { ...Typography.body, color: Colors.zinc500 },
  summaryValue: { ...Typography.body, color: Colors.zinc700 },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.zinc200,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: { ...Typography.bodyMedium, color: Colors.zinc900 },
  totalValue: { ...Typography.subtitle, color: Colors.olive },
  cartActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Shape.borderRadius['2xl'],
    borderTopRightRadius: Shape.borderRadius['2xl'],
    maxHeight: '85%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
    paddingBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.subtitle,
    color: Colors.zinc900,
  },
  modalScroll: {
    paddingBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.captionMedium,
    color: Colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  methodContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Shape.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    alignItems: 'center',
    backgroundColor: Colors.zinc50,
  },
  methodBtnActive: {
    borderColor: Colors.olive,
    backgroundColor: Colors.olive + '10',
  },
  methodBtnText: {
    ...Typography.bodyMedium,
    color: Colors.zinc600,
  },
  methodBtnTextActive: {
    color: Colors.olive,
    fontWeight: '700',
  },
  cashContainer: {
    gap: Spacing.xs,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.xl,
    backgroundColor: Colors.zinc50,
    marginBottom: Spacing.sm,
  },
  dropdownBtnText: {
    ...Typography.body,
    color: Colors.zinc700,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.zinc400,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.xl,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  dropdownItemActive: {
    backgroundColor: Colors.olive + '08',
  },
  dropdownItemText: {
    ...Typography.body,
    color: Colors.zinc700,
  },
  dropdownItemTextActive: {
    color: Colors.olive,
    fontWeight: '600',
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  rowInfoActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Shape.borderRadius.xl,
    backgroundColor: Colors.zinc50,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    marginVertical: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.zinc500,
  },
  infoLabelActive: {
    ...Typography.bodyMedium,
    color: Colors.zinc800,
  },
  infoValue: {
    ...Typography.bodyMedium,
    color: Colors.zinc800,
  },
  infoValueActive: {
    ...Typography.subtitle,
    color: Colors.olive,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.xl,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    height: 50,
  },
  inputPrefix: {
    ...Typography.bodyMedium,
    color: Colors.zinc400,
    marginRight: Spacing.xs,
  },
  modalInput: {
    flex: 1,
    height: '100%',
    ...Typography.bodyLarge,
    color: Colors.zinc800,
  },
  quickCashContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  quickCashBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.lg,
    backgroundColor: Colors.zinc100,
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
  quickCashBtnText: {
    ...Typography.captionMedium,
    color: Colors.zinc700,
  },
  quickCashBtnPas: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.borderRadius.lg,
    backgroundColor: Colors.olive + '10',
    borderWidth: 1,
    borderColor: Colors.olive,
  },
  quickCashBtnTextPas: {
    ...Typography.captionMedium,
    color: Colors.olive,
    fontWeight: '700',
  },
  statusBoxContainer: {
    marginTop: Spacing.sm,
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: Shape.borderRadius.xl,
  },
  changeLabel: {
    ...Typography.bodyMedium,
    color: Colors.success,
  },
  changeValue: {
    ...Typography.subtitle,
    color: Colors.success,
  },
  dueBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.danger + '10',
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: Shape.borderRadius.xl,
  },
  dueLabel: {
    ...Typography.bodyMedium,
    color: Colors.danger,
  },
  dueValue: {
    ...Typography.subtitle,
    color: Colors.danger,
  },
  midtransContainer: {
    gap: Spacing.sm,
  },
  midtransInfoBox: {
    padding: Spacing.md,
    backgroundColor: Colors.olive + '08',
    borderRadius: Shape.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.olive + '20',
  },
  midtransTitle: {
    ...Typography.bodyMedium,
    color: Colors.olive,
    marginBottom: Spacing.xs,
  },
  midtransDesc: {
    ...Typography.caption,
    color: Colors.zinc600,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
});
