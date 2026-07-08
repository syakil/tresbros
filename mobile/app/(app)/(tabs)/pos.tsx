import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
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
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { couponsApi } from '@/api/coupons';
import { ordersApi } from '@/api/orders';
import { useCartStore, type CartItem } from '@/store/useCartStore';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types/models';

export default function POSScreen() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const cart = useCartStore();

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
    onSuccess: () => {
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Berhasil', 'Pesanan berhasil dibuat');
    },
    onError: (err: Error) => {
      Alert.alert('Gagal', err.message || 'Gagal membuat pesanan');
    },
  });

  const filtered = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  const handleAddProduct = (product: Product) => {
    cart.addItem(product);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;

    createOrder.mutate({
      customerName: cart.customerName || undefined,
      paymentMethod: 'CASH',
      discountAmount: cart.getDiscount() > 0 ? cart.getDiscount() : undefined,
      items: cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        notes: item.notes || undefined,
      })),
    });
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
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
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
});
