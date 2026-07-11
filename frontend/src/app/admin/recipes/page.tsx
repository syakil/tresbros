"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Beaker, Plus, Trash2, Search, ArrowRight, PackageOpen, CheckCircle, X } from 'lucide-react';

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/api/products');
      return res.data;
    }
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await axios.get('/api/materials');
      return res.data;
    }
  });

  const { data: currentRecipe = [], isLoading: loadingRecipe } = useQuery({
    queryKey: ['recipes', activeProductId],
    queryFn: async () => {
      if (!activeProductId) return [];
      const res = await axios.get(`/api/recipes?productId=${activeProductId}`);
      return res.data;
    },
    enabled: !!activeProductId
  });

  // Set initial active product when products load
  useEffect(() => {
    if (products.length > 0 && !activeProductId) {
      setActiveProductId(products[0].id);
    }
  }, [products]);

  // Mutations
  const addRecipeItem = useMutation({
    mutationFn: async () => {
      if (!activeProductId || !newMaterialId || !newQuantity) throw new Error("Incomplete data");
      await axios.post('/api/recipes', {
        productId: activeProductId,
        materialId: parseInt(newMaterialId),
        quantity: parseFloat(newQuantity)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', activeProductId] });
      setShowAddMaterial(false);
      setNewMaterialId('');
      setNewQuantity('');
      showToast('Raw material successfully added to recipe');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || "Failed to add", "error");
    }
  });

  const deleteRecipeItem = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', activeProductId] });
      setConfirmDeleteId(null);
      showToast('Raw material removed from recipe');
    },
    onError: (error: any) => {
      setConfirmDeleteId(null);
      showToast(error.response?.data?.error || "Failed to remove", "error");
    }
  });

  const activeProduct = products.find((p: any) => p.id === activeProductId);
  const filteredProducts = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  const confirmAction = () => {
    if (confirmDeleteId) {
      deleteRecipeItem.mutate(confirmDeleteId);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full h-[calc(100vh-8rem)] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3
          ${toastMessage.type === 'success' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white'}`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Konfirmasi Hapus Resep Item */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white border-0 shadow-2xl p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2 text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-zinc-900">Remove from Recipe?</h3>
            <p className="text-sm text-zinc-500">
              Are you sure you want to remove this raw material from the recipe?
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-red-500 hover:bg-red-600 text-white border-none shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all"
                onClick={confirmAction}
                disabled={deleteRecipeItem.isPending}
              >
                {deleteRecipeItem.isPending ? 'Removing...' : 'Yes, Remove'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-display font-bold text-zinc-900">Recipes & BOM</h1>
        <p className="text-zinc-500">Manage Bill of Materials (Raw Materials) for automatic stock deduction</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
        
        {/* Kiri: Daftar Produk */}
        <Card className="w-full md:w-1/3 flex flex-col p-0 overflow-hidden shrink-0 border border-zinc-200 shadow-sm bg-white">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search product..." 
                className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {filteredProducts.map((product: any) => (
              <button 
                key={product.id}
                onClick={() => {
                  setActiveProductId(product.id);
                  setShowAddMaterial(false);
                }}
                className={`w-full text-left p-4 border-b border-zinc-50 transition flex items-center justify-between ${
                  activeProductId === product.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-zinc-50 border-l-4 border-l-transparent'
                }`}
              >
                <div>
                  <p className={`font-medium ${activeProductId === product.id ? 'text-blue-700' : 'text-zinc-900'}`}>{product.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{product.category}</p>
                </div>
                {activeProductId === product.id && <ArrowRight className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-6 text-center text-zinc-400 text-sm font-medium">
                Product not found
              </div>
            )}
          </div>
        </Card>

        {/* Kanan: Detail Resep */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden border border-zinc-200 shadow-sm relative z-20 bg-white">
          {activeProductId ? (
            <>
              <div className="p-6 border-b border-zinc-100 bg-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Beaker className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-zinc-900">{activeProduct?.name}</h2>
                    <p className="text-sm text-zinc-500">Raw material needs per 1 portion</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto z-10 bg-white">
                <table className="w-full text-left text-sm text-zinc-600">
                  <thead className="bg-zinc-50 text-zinc-500 sticky top-0 border-b border-zinc-200 z-20">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Raw Material Name</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Quantity Used</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loadingRecipe ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-zinc-400 font-medium">Loading recipe...</td>
                      </tr>
                    ) : currentRecipe.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-16">
                          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PackageOpen className="w-8 h-8 text-zinc-300" />
                          </div>
                          <p className="text-zinc-500 font-medium">No raw material recipe for this product yet.</p>
                        </td>
                      </tr>
                    ) : (
                      currentRecipe.map((item: any) => (
                        <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors group">
                          <td className="px-6 py-4 text-zinc-900 font-medium">{item.material}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-600 text-base mr-1">{item.qty}</span>
                            <span className="text-xs text-zinc-500 font-medium">{item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition opacity-0 group-hover:opacity-100" 
                              title="Remove Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50">
              <Beaker className="w-16 h-16 mb-4 text-zinc-200" />
              <p className="font-medium">Select a product on the left to view the recipe</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
