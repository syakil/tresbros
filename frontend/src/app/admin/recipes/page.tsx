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
          ${toastMessage.type === 'success' ? 'bg-brand-olive/95 border-brand-sage/50 text-brand-cream' : 'bg-red-900/95 border-red-500/50 text-red-200'}`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Konfirmasi Hapus Resep Item */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card variant="olive" className="w-full max-w-md bg-[#1C1F1D] border-red-500/30 shadow-2xl p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-brand-cream">Remove from Recipe?</h3>
            <p className="text-sm text-brand-sage">
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
        <h1 className="text-3xl font-display font-bold text-brand-cream">Recipes & BOM</h1>
        <p className="text-brand-sage">Manage Bill of Materials (Raw Materials) for automatic stock deduction</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
        
        {/* Kiri: Daftar Produk */}
        <Card variant="olive" className="w-full md:w-1/3 flex flex-col p-0 overflow-hidden shrink-0 border-white/10 shadow-xl">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-brand-sage" />
              <input 
                type="text" 
                placeholder="Search product..." 
                className="w-full bg-black/40 border border-white/10 text-brand-cream text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-brand-warm"
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
                className={`w-full text-left p-4 border-b border-white/5 transition flex items-center justify-between ${
                  activeProductId === product.id ? 'bg-brand-sage/20 border-l-4 border-l-brand-warm' : 'hover:bg-black/20 border-l-4 border-l-transparent'
                }`}
              >
                <div>
                  <p className={`font-medium ${activeProductId === product.id ? 'text-brand-warm' : 'text-brand-cream'}`}>{product.name}</p>
                  <p className="text-xs text-brand-sage mt-1">{product.category}</p>
                </div>
                {activeProductId === product.id && <ArrowRight className="w-4 h-4 text-brand-warm" />}
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-6 text-center text-brand-sage/50 text-sm">
                Product not found
              </div>
            )}
          </div>
        </Card>

        {/* Kanan: Detail Resep */}
        <Card variant="olive" className="flex-1 flex flex-col p-0 overflow-hidden border-white/10 shadow-xl relative z-20">
          {activeProductId ? (
            <>
              <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-warm/20 flex items-center justify-center">
                    <Beaker className="w-5 h-5 text-brand-warm" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-brand-cream">{activeProduct?.name}</h2>
                    <p className="text-sm text-brand-sage">Raw material needs per 1 portion</p>
                  </div>
                </div>
                <Button variant="primary" onClick={() => setShowAddMaterial(!showAddMaterial)} className="text-sm shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Add Material
                </Button>
              </div>

              {showAddMaterial && (
                <div className="p-4 border-b border-white/10 bg-brand-olive/50 flex gap-3 items-end shrink-0 relative z-30">
                  <div className="flex-1">
                    <label className="text-xs text-brand-sage mb-1 block">Select Master Raw Material</label>
                    <CustomSelect 
                      value={newMaterialId}
                      onChange={(val) => setNewMaterialId(val)}
                      className="bg-black/40 border border-white/10 text-brand-cream rounded-lg px-3 py-2.5"
                      options={materials.map((m: any) => ({
                        value: m.id.toString(),
                        label: `${m.name} (${m.unit})`
                      }))}
                      placeholder="Select Material..."
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-brand-sage mb-1 block">Quantity</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-warm" 
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => addRecipeItem.mutate()} 
                    className="py-2.5"
                    disabled={addRecipeItem.isPending || !newMaterialId || !newQuantity}
                  >
                    Save
                  </Button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto z-10">
                <table className="w-full text-left text-sm text-brand-sage">
                  <thead className="bg-black/40 text-brand-cream sticky top-0 shadow-sm z-20">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Raw Material Name</th>
                      <th className="px-6 py-4 font-semibold">Quantity Used</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loadingRecipe ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-brand-sage/60">Loading recipe...</td>
                      </tr>
                    ) : currentRecipe.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12">
                          <PackageOpen className="w-12 h-12 text-brand-sage/20 mx-auto mb-3" />
                          <p className="text-brand-sage/60">No raw material recipe for this product yet.</p>
                        </td>
                      </tr>
                    ) : (
                      currentRecipe.map((item: any) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-brand-cream font-medium">{item.material}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-brand-warm text-base mr-1">{item.qty}</span>
                            <span className="text-xs">{item.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition" 
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
            <div className="flex-1 flex flex-col items-center justify-center text-brand-sage/40">
              <Beaker className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a product on the left to view the recipe</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
