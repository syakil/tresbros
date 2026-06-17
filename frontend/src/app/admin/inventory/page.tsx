"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Boxes, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertTriangle, Plus } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  
  // State form tambah bahan baku
  const [addName, setAddName] = useState('');
  const [addUnit, setAddUnit] = useState('gram');
  const [addMinStock, setAddMinStock] = useState('');

  // State form mutasi stok
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('');

  // State filter & pencarian
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // State edit popup
  const [editMaterialData, setEditMaterialData] = useState<any>(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await axios.get('/api/materials');
      return data;
    }
  });

  const createMaterial = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post('/api/materials', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowAdd(false);
      setAddName('');
      setAddMinStock('');
      setAddUnit('gram');
    }
  });

  const adjustMaterial = useMutation({
    mutationFn: async (payload: { id: number; type: string; quantity: number }) => {
      const { data } = await axios.put(`/api/materials/${payload.id}`, {
        adjustType: payload.type,
        quantity: payload.quantity
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowAdjust(null);
      setAdjustQty('');
      setAdjustType('in');
    }
  });

  const updateMasterMaterial = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.put(`/api/materials/${payload.id}`, {
        action: 'update_master',
        name: payload.name,
        unit: payload.unit,
        minStock: payload.minStock
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setEditMaterialData(null);
    }
  });

  const handleAddMaterial = () => {
    if (!addName) return alert("Nama bahan baku harus diisi!");
    createMaterial.mutate({
      name: addName,
      unit: addUnit,
      minStock: addMinStock
    });
  };

  const handleAdjustMaterial = (id: number) => {
    if (!adjustQty) return alert("Kuantitas harus diisi!");
    adjustMaterial.mutate({
      id,
      type: adjustType,
      quantity: parseFloat(adjustQty)
    });
  };

  const handleUpdateMaster = () => {
    if (!editMaterialData?.name) return alert("Nama harus diisi!");
    updateMasterMaterial.mutate(editMaterialData);
  };

  const filteredMaterials = materials.filter((m: any) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterMode === 'all' || (filterMode === 'low' && m.stock <= m.minStock);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-brand-cream">Manajemen Stok</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-brand-sage text-sm md:text-base">Pantau ketersediaan bahan baku dan mutasi stok (Stock Movement)</p>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="primary" className="shadow-md w-full md:w-auto justify-center" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Bahan Baku
            </Button>
          </div>
        </div>
      </div>

      {showAdd && (
        <Card variant="olive" className="flex flex-col md:flex-row gap-4 items-end bg-black/40 border border-brand-warm/30 mb-2">
          <div className="flex-1 w-full">
            <label className="text-xs text-brand-sage mb-1 block">Nama Bahan Baku</label>
            <input 
              type="text" 
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Contoh: Sirup Vanilla" 
              className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition" 
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs text-brand-sage mb-1 block">Satuan Ukur</label>
            <CustomSelect
              value={addUnit}
              onChange={setAddUnit}
              className="bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3"
              options={[
                { value: 'gram', label: 'Gram (g)' },
                { value: 'ml', label: 'Mililiter (ml)' },
                { value: 'pcs', label: 'Pieces (pcs)' }
              ]}
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs text-brand-sage mb-1 block">Batas Minimum Stok</label>
            <input 
              type="number" 
              value={addMinStock}
              onChange={(e) => setAddMinStock(e.target.value)}
              placeholder="Misal: 500" 
              className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition" 
            />
          </div>
          <Button variant="primary" className="w-full md:w-auto" onClick={handleAddMaterial} disabled={createMaterial.isPending}>
            {createMaterial.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-2">
        <Card 
          variant="olive" 
          onClick={() => setFilterMode('all')}
          className={`flex items-center gap-4 cursor-pointer transition-all ${filterMode === 'all' ? 'bg-black/80 ring-2 ring-brand-warm' : 'bg-black/40 hover:bg-black/60'}`}
        >
          <div className="w-10 h-10 rounded-full bg-brand-warm/20 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-brand-warm" />
          </div>
          <div>
            <p className="text-brand-sage text-[10px] md:text-xs font-medium uppercase tracking-wider">Total Bahan</p>
            <h3 className="text-xl font-display font-bold text-brand-cream">{materials.length} Item</h3>
          </div>
        </Card>
        <Card 
          variant="olive" 
          onClick={() => setFilterMode('low')}
          className={`flex items-center gap-4 cursor-pointer transition-all border-red-500/20 ${filterMode === 'low' ? 'bg-red-900/60 ring-2 ring-red-400' : 'bg-red-900/20 hover:bg-red-900/40'}`}
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-brand-sage text-[10px] md:text-xs font-medium uppercase tracking-wider">Stok Menipis</p>
            <h3 className="text-xl font-display font-bold text-brand-cream">
              {materials.filter((m: any) => m.stock <= m.minStock).length} Item
            </h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex mb-4">
        <input 
          type="text" 
          placeholder="Cari nama bahan baku..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-80 bg-black/40 border border-white/10 text-brand-cream rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition"
        />
      </div>

      {/* Mobile Compact List Layout (Hidden on Desktop) */}
      <div className="md:hidden bg-black/40 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
        {isLoading && <div className="text-center text-brand-sage p-4 text-sm">Memuat data dari database...</div>}
        {!isLoading && filteredMaterials.length === 0 && (
          <div className="text-center text-brand-sage p-4 text-sm">
            {materials.length === 0 ? "Belum ada data master bahan baku." : "Tidak ada bahan baku yang cocok."}
          </div>
        )}
        {filteredMaterials.map((item: any) => {
          const isLowStock = item.stock <= item.minStock;
          const isExpanded = showAdjust === item.id;
          
          return (
            <div key={item.id} className="flex flex-col">
              {/* Main Compact Row */}
              <div 
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-brand-sage/10' : 'hover:bg-white/5'}`}
                onClick={() => setShowAdjust(isExpanded ? null : item.id)}
              >
                {/* Info Kiri */}
                <div className="flex flex-col flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-cream font-semibold text-sm leading-tight line-clamp-1">{item.name}</span>
                    {isLowStock && <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider shrink-0">Low</span>}
                  </div>
                </div>

                {/* Stok Kanan */}
                <div className="text-right shrink-0">
                  <span className={`font-display font-bold text-base mr-1 ${isLowStock ? 'text-red-400' : 'text-brand-warm'}`}>{item.stock.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] text-brand-sage">{item.unit}</span>
                </div>
              </div>

              {/* Collapsible Action Area */}
              {isExpanded && (
                <div className="bg-black/60 p-3 flex flex-col gap-3 border-t border-white/5 shadow-inner">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditMaterialData(item); }} 
                    className="w-full bg-brand-dark hover:bg-black py-2 rounded-lg text-brand-sage hover:text-brand-cream text-xs font-medium border border-white/5 transition"
                  >
                    Edit Master Data Bahan
                  </button>
                  
                  <div className="bg-brand-dark/80 rounded-lg p-3 border border-white/5 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-brand-cream border-b border-white/10 pb-1.5">Mutasi Stok</h4>
                    
                    <div className="flex gap-3">
                      <div className="w-1/2">
                        <label className="text-[10px] text-brand-sage mb-1 block">Jenis</label>
                        <select
                          value={adjustType}
                          onChange={(e) => setAdjustType(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 text-brand-cream rounded-md px-2 py-2 text-xs focus:outline-none focus:border-brand-warm"
                        >
                          <option value="in">Masuk (+)</option>
                          <option value="out">Keluar (-)</option>
                        </select>
                      </div>
                      <div className="w-1/2">
                        <label className="text-[10px] text-brand-sage mb-1 block">Qty</label>
                        <input 
                          type="number" 
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          placeholder="0" 
                          className="w-full bg-black/60 border border-white/10 text-brand-cream rounded-md px-2 py-2 text-xs focus:outline-none focus:border-brand-warm" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] text-brand-sage mb-1 block">Catatan / Alasan</label>
                      <input type="text" placeholder="Cth: Pembelian/Tumpah" className="w-full bg-black/60 border border-white/10 text-brand-cream rounded-md px-2 py-2 text-xs focus:outline-none focus:border-brand-warm" />
                    </div>
                    
                    <Button 
                      variant="primary" 
                      className="w-full mt-1 py-2 text-xs font-bold shadow-lg" 
                      onClick={() => handleAdjustMaterial(item.id)}
                      disabled={adjustMaterial.isPending}
                    >
                      {adjustMaterial.isPending ? 'Menyimpan...' : 'Simpan Mutasi'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout (Hidden on Mobile) */}
      <Card variant="olive" className="hidden md:block p-0 overflow-hidden shadow-xl border-white/10">
        <table className="w-full text-left text-sm text-brand-sage min-w-[800px]">
          <thead className="bg-black/40 text-brand-cream border-b border-white/10">
            <tr>
              <th className="px-6 py-5 font-semibold">Nama Bahan Baku</th>
              <th className="px-6 py-5 font-semibold">Sisa Stok</th>
              <th className="px-6 py-5 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-brand-sage">Memuat data dari database...</td>
              </tr>
            )}
            {!isLoading && filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-brand-sage">
                  {materials.length === 0 ? "Belum ada data master bahan baku." : "Tidak ada bahan baku yang cocok dengan filter atau pencarian Anda."}
                </td>
              </tr>
            )}
            {filteredMaterials.map((item: any) => {
              const isLowStock = item.stock <= item.minStock;
              return (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-brand-cream font-medium text-base flex items-center gap-2">
                      {item.name}
                      {isLowStock && <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Low</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold text-lg mr-1 ${isLowStock ? 'text-red-400' : 'text-brand-warm'}`}>{item.stock.toLocaleString('id-ID')}</span>
                      <span className="text-xs">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditMaterialData(item)}
                        className="text-brand-sage hover:text-brand-warm bg-black/20 hover:bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg transition text-xs font-medium mr-2"
                      >
                        Edit Data
                      </button>
                      <button
                        onClick={() => setShowAdjust(showAdjust === item.id ? null : item.id)}
                        className="text-brand-sage hover:text-brand-cream bg-black/20 hover:bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg transition text-xs font-medium"
                      >
                        Sesuaikan
                      </button>
                    </td>
                  </tr>

                  {/* Row Adjust Stock (Collapsible) */}
                  {showAdjust === item.id && (
                    <tr className="bg-brand-dark/80 border-l-4 border-l-brand-warm border-y border-white/5">
                      <td colSpan={3} className="px-6 py-6">
                        <div className="bg-black/40 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
                          <h4 className="text-sm font-semibold text-brand-cream">Mutasi Stok: {item.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                              <label className="text-xs text-brand-sage mb-1.5 block">Jenis Mutasi</label>
                              <CustomSelect
                                value={adjustType}
                                onChange={setAdjustType}
                                className="bg-black/60 border border-white/10 text-brand-cream rounded-lg px-4 py-3"
                                options={[
                                  { value: 'in', label: 'Barang Masuk (+)' },
                                  { value: 'out', label: 'Barang Keluar (-)' }
                                ]}
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="text-xs text-brand-sage mb-1.5 block">Kuantitas ({item.unit})</label>
                              <input 
                                type="number" 
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(e.target.value)}
                                placeholder="0" 
                                className="w-full bg-black/60 border border-white/10 text-brand-cream rounded-lg px-4 py-3 focus:outline-none focus:border-brand-warm" 
                              />
                            </div>
                            <div className="md:col-span-2 flex gap-4 items-end">
                              <div className="flex-1">
                                <label className="text-xs text-brand-sage mb-1.5 block">Keterangan / Alasan</label>
                                <input type="text" placeholder="Contoh: Pembelian / Tumpah..." className="w-full bg-black/60 border border-white/10 text-brand-cream rounded-lg px-4 py-3 focus:outline-none focus:border-brand-warm" />
                              </div>
                              <Button 
                                variant="primary" 
                                className="shrink-0 px-8 py-3 shadow-lg font-medium h-full" 
                                onClick={() => handleAdjustMaterial(item.id)}
                                disabled={adjustMaterial.isPending}
                              >
                                {adjustMaterial.isPending ? 'Menyimpan...' : 'Simpan'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Popup Edit Master Data */}
      {editMaterialData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card variant="olive" className="w-full max-w-md bg-brand-dark border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            <h2 className="text-xl font-display font-bold text-brand-cream">Edit Master Bahan</h2>
            
            <div>
              <label className="text-xs text-brand-sage mb-1 block">Nama Bahan Baku</label>
              <input 
                type="text" 
                value={editMaterialData.name}
                onChange={(e) => setEditMaterialData({...editMaterialData, name: e.target.value})}
                className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition" 
              />
            </div>
            
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-xs text-brand-sage mb-1 block">Satuan Ukur</label>
                <CustomSelect
                  value={editMaterialData.unit}
                  onChange={(val) => setEditMaterialData({...editMaterialData, unit: val})}
                  className="bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3"
                  options={[
                    { value: 'gram', label: 'Gram (g)' },
                    { value: 'ml', label: 'Mililiter (ml)' },
                    { value: 'pcs', label: 'Pieces (pcs)' }
                  ]}
                />
              </div>
              <div className="w-1/2">
                <label className="text-xs text-brand-sage mb-1 block">Alert Stok Menipis</label>
                <input 
                  type="number" 
                  value={editMaterialData.minStock}
                  onChange={(e) => setEditMaterialData({...editMaterialData, minStock: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setEditMaterialData(null)}>Batal</Button>
              <Button variant="primary" onClick={handleUpdateMaster} disabled={updateMasterMaterial.isPending}>
                {updateMasterMaterial.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
