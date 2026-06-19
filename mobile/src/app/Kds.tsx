import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, useWindowDimensions } from 'react-native';
import axios from 'axios';
import { Clock, ChefHat, CheckCircle2, User, X } from 'lucide-react-native';

const API_URL = 'http://192.168.1.3:3000/api'; 

interface OrderItem {
  id: number;
  quantity: number;
  notes: string | null;
  product: {
    name: string;
    recipeItems?: {
      id: number;
      quantity: number;
      material: {
        name: string;
        unit: string;
      };
    }[];
  };
}

interface Order {
  id: number;
  customerName: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'TAKEN';
  createdAt: string;
  items: OrderItem[];
}

// Timer Component
const Timer = ({ createdAt }: { createdAt: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const update = () => {
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}m ${s}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);

  return <Text className="text-brand-sage text-xs ml-1 font-mono">{elapsed}</Text>;
};

export function Kds() {
  const { width } = useWindowDimensions();
  const colWidth = Math.max(300, (width - 64) / 3);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<OrderItem | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`${API_URL}/orders/${id}`, { status });
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Gagal update status pesanan');
    }
  };

  const todoOrders = orders.filter(o => o.status === 'TODO');
  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS');
  const doneOrders = orders.filter(o => o.status === 'DONE');

  const OrderCardItem = ({ item }: { item: OrderItem }) => {
    const [showRecipe, setShowRecipe] = useState(false);
    return (
      <View className="flex-col border-b border-white/5 pb-3 mb-3">
        <View className="flex-row justify-between items-start">
          <TouchableOpacity 
            className="flex-1 mr-2"
            onPress={() => setShowRecipe(!showRecipe)}
            activeOpacity={0.7}
          >
            <Text className="text-brand-cream font-medium">
              <Text className="font-bold text-brand-warm">{item.quantity}x</Text> {item.product.name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full"
            onPress={() => setSelectedRecipeItem(item)}
          >
            <Text className="text-[10px] uppercase font-bold text-brand-sage">Lihat Resep</Text>
          </TouchableOpacity>
        </View>
        
        {item.notes && (
          <View className="bg-brand-warm/10 p-2 rounded-lg mt-2">
            <Text className="text-xs text-brand-warm">Catatan: {item.notes}</Text>
          </View>
        )}
        
        {showRecipe && item.product.recipeItems && item.product.recipeItems.length > 0 && (
          <View className="bg-black/30 p-3 rounded-lg mt-2 border border-white/5">
            <Text className="font-semibold text-brand-cream/80 text-xs mb-2 border-b border-white/10 pb-1">
              Bahan (Total {item.quantity} Porsi):
            </Text>
            {item.product.recipeItems.map(ri => (
              <View key={ri.id} className="flex-row justify-between mb-1">
                <Text className="text-brand-sage text-xs">{ri.material.name}</Text>
                <Text className="font-medium text-brand-cream/80 text-xs">{ri.quantity * item.quantity} {ri.material.unit}</Text>
              </View>
            ))}
          </View>
        )}
        {showRecipe && (!item.product.recipeItems || item.product.recipeItems.length === 0) && (
          <Text className="text-xs text-brand-sage/50 italic mt-2">Tidak ada resep</Text>
        )}
      </View>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <View className="bg-black/40 rounded-2xl p-4 mb-4 border border-white/5 shadow-xl">
      <View className="flex-row justify-between items-center border-b border-white/10 pb-3 mb-3">
        <View className="flex-row items-center">
          <Text className="font-bold text-brand-warm text-xl mr-2">Antrian: {order.queueNumber}</Text>
          {order.customerName && (
            <View className="flex-row items-center bg-black/30 px-2 py-1 rounded-lg">
              <User size={12} color="#F3EDE1" />
              <Text className="text-xs text-brand-cream ml-1">{order.customerName}</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center bg-black/20 px-2 py-1.5 rounded-full">
          <Clock size={12} color="#7D8F6A" />
          <Timer createdAt={order.createdAt} />
        </View>
      </View>
      
      <View className="flex-col">
        {order.items.map(item => (
          <OrderCardItem key={item.id} item={item} />
        ))}
      </View>

      <View className="pt-2 border-t border-white/10 mt-1">
        {order.status === 'TODO' && (
          <TouchableOpacity 
            className="bg-brand-olive flex-row justify-center items-center py-3 rounded-xl shadow-md"
            onPress={() => updateStatus(order.id, 'IN_PROGRESS')}
          >
            <ChefHat size={16} color="#F3EDE1" className="mr-2" />
            <Text className="text-brand-cream font-bold ml-2">Mulai Masak</Text>
          </TouchableOpacity>
        )}
        {order.status === 'IN_PROGRESS' && (
          <TouchableOpacity 
            className="bg-brand-warm flex-row justify-center items-center py-3 rounded-xl shadow-md"
            onPress={() => updateStatus(order.id, 'DONE')}
          >
            <CheckCircle2 size={16} color="#2A2A2A" className="mr-2" />
            <Text className="text-brand-dark font-bold ml-2">Selesai Masak</Text>
          </TouchableOpacity>
        )}
        {order.status === 'DONE' && (
          <TouchableOpacity 
            className="bg-transparent border border-brand-sage flex-row justify-center items-center py-3 rounded-xl"
            onPress={() => updateStatus(order.id, 'TAKEN')}
          >
            <CheckCircle2 size={16} color="#7D8F6A" className="mr-2" />
            <Text className="text-brand-sage font-bold ml-2">Sudah Diambil</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <View className="flex-1 bg-brand-dark p-4">
        <View className="flex-row justify-between items-end mb-6">
          <View>
            <Text className="text-3xl font-bold text-brand-cream">Dapur (KDS)</Text>
            <Text className="text-brand-sage">Manajemen Pesanan Real-time</Text>
          </View>
          <View className="flex-row items-center bg-brand-warm/10 px-3 py-1.5 rounded-full border border-brand-warm/30">
            <View className="w-2 h-2 rounded-full bg-brand-warm mr-2"></View>
            <Text className="text-brand-warm text-xs font-bold">Live Sync</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          {/* Kolom 1: Antrean (TODO) */}
          <View style={{ width: colWidth, marginRight: 16 }} className="bg-black/20 rounded-3xl p-4 border border-white/5">
            <View className="flex-row items-center justify-between mb-4 px-1">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-red-400 mr-2"></View>
                <Text className="font-bold text-brand-cream text-lg">Antrean</Text>
              </View>
              <View className="bg-black/40 px-3 py-1 rounded-lg">
                <Text className="text-brand-sage font-bold">{todoOrders.length}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {todoOrders.map(order => <OrderCard key={order.id} order={order} />)}
              {todoOrders.length === 0 && (
                <Text className="text-center text-brand-sage/40 mt-10">Tidak ada antrean</Text>
              )}
            </ScrollView>
          </View>

          {/* Kolom 2: Diproses (IN_PROGRESS) */}
          <View style={{ width: colWidth, marginRight: 16 }} className="bg-black/20 rounded-3xl p-4 border border-white/5">
            <View className="flex-row items-center justify-between mb-4 px-1">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></View>
                <Text className="font-bold text-brand-cream text-lg">Diproses</Text>
              </View>
              <View className="bg-black/40 px-3 py-1 rounded-lg">
                <Text className="text-brand-sage font-bold">{inProgressOrders.length}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)}
              {inProgressOrders.length === 0 && (
                <Text className="text-center text-brand-sage/40 mt-10">Tidak ada pesanan diproses</Text>
              )}
            </ScrollView>
          </View>

          {/* Kolom 3: Selesai (DONE) */}
          <View style={{ width: colWidth }} className="bg-black/20 rounded-3xl p-4 border border-white/5">
            <View className="flex-row items-center justify-between mb-4 px-1">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-green-400 mr-2"></View>
                <Text className="font-bold text-brand-cream text-lg">Selesai</Text>
              </View>
              <View className="bg-black/40 px-3 py-1 rounded-lg">
                <Text className="text-brand-sage font-bold">{doneOrders.length}</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {doneOrders.map(order => <OrderCard key={order.id} order={order} />)}
              {doneOrders.length === 0 && (
                <Text className="text-center text-brand-sage/40 mt-10">Belum ada pesanan selesai</Text>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Modal Recipe */}
      <Modal visible={!!selectedRecipeItem} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center px-4">
          <View className="bg-[#1A1A1A] w-full max-w-[400px] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <View className="flex-row justify-between items-center p-5 bg-black/20 border-b border-white/5">
              <Text className="font-bold text-xl text-brand-cream">Resep Masakan</Text>
              <TouchableOpacity onPress={() => setSelectedRecipeItem(null)} className="p-1">
                <X size={24} color="#7D8F6A" />
              </TouchableOpacity>
            </View>
            
            {selectedRecipeItem && (
              <View className="p-6">
                <View className="mb-6">
                  <Text className="text-brand-sage mb-1 text-sm">Menu:</Text>
                  <Text className="font-bold text-brand-warm text-2xl">{selectedRecipeItem.product.name}</Text>
                  <View className="bg-black/30 self-start px-3 py-1.5 rounded-lg mt-3 flex-row items-center">
                    <Text className="text-brand-cream text-sm">Total Pesanan: </Text>
                    <Text className="text-brand-warm font-bold text-base">{selectedRecipeItem.quantity}</Text>
                    <Text className="text-brand-cream text-sm"> Porsi</Text>
                  </View>
                </View>
                
                <View className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <Text className="text-xs font-bold text-brand-sage/60 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">
                    Resep Per Sajian (1 Porsi)
                  </Text>
                  
                  {selectedRecipeItem.product.recipeItems && selectedRecipeItem.product.recipeItems.length > 0 ? (
                    <View className="space-y-3">
                      {selectedRecipeItem.product.recipeItems.map((ri: any) => (
                        <View key={ri.id} className="flex-row justify-between items-center mb-2">
                          <Text className="text-brand-cream">{ri.material.name}</Text>
                          <View className="bg-brand-warm/10 px-3 py-1 rounded-lg">
                            <Text className="font-mono text-brand-warm font-bold text-sm">
                              {ri.quantity} {ri.material.unit}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-sm text-brand-sage italic py-2 text-center">Tidak ada data resep / bahan baku.</Text>
                  )}
                </View>
              </View>
            )}
            
            <View className="p-5 bg-black/20 border-t border-white/5">
              <TouchableOpacity 
                className="bg-transparent border border-white/10 py-3.5 rounded-xl items-center"
                onPress={() => setSelectedRecipeItem(null)}
              >
                <Text className="text-brand-cream font-bold">Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
