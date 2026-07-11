"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Boxes, ArrowDownToLine, ArrowUpFromLine, RefreshCw, AlertTriangle, Plus, CheckCircle2, X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface MaterialBatchesSectionProps {
  materialId: number;
  unit: string;
  showAlert: (text: string, type?: 'error' | 'success') => void;
}

function MaterialBatchesSection({ materialId, unit, showAlert }: MaterialBatchesSectionProps) {
  const queryClient = useQueryClient();
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  
  // State form edit batch
  const [editOrigQty, setEditOrigQty] = useState('');
  const [editRemQty, setEditRemQty] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['material-batches', materialId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/materials/${materialId}/batches`);
      return data;
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (payload: { batchId: number; originalQty: number; remainingQty: number; unitPrice: number }) => {
      const { data } = await axios.put(`/api/materials/${materialId}/batches`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-batches', materialId] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setEditingBatchId(null);
      showAlert("Batch updated successfully!", "success");
    }
  });

  const handleStartEdit = (batch: any) => {
    setEditingBatchId(batch.id);
    setEditOrigQty(batch.originalQty.toString());
    setEditRemQty(batch.remainingQty.toString());
    setEditUnitPrice(batch.unitPrice.toString());
  };

  const handleSaveEdit = (batchId: number) => {
    if (!editOrigQty || !editRemQty || !editUnitPrice) {
      showAlert("All fields are required!", "error");
      return;
    }
    updateBatchMutation.mutate({
      batchId,
      originalQty: parseFloat(editOrigQty),
      remainingQty: parseFloat(editRemQty),
      unitPrice: parseFloat(editUnitPrice)
    });
  };

  if (isLoading) {
    return <div className="text-zinc-500 text-xs py-4 text-center">Loading batch details...</div>;
  }

  return (
    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 flex flex-col gap-3 shadow-sm h-full">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Detail Stok Masuk (FIFO Batches)</h4>
        <span className="text-[10px] text-zinc-600 font-bold bg-zinc-200 px-2 py-0.5 rounded-full">{batches.length} Batch</span>
      </div>

      {batches.length === 0 ? (
        <div className="text-zinc-500 text-xs text-center py-6">No batch details found. Edit master data or adjust stock to create a batch.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 min-w-[320px]">
            <thead className="text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="py-2 font-semibold">Tgl Masuk</th>
                <th className="py-2 font-semibold">Stok Awal</th>
                <th className="py-2 font-semibold">Sisa Stok</th>
                <th className="py-2 font-semibold">Harga Beli</th>
                <th className="py-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {batches.map((batch: any) => {
                const isEditing = editingBatchId === batch.id;
                const formattedDate = new Date(batch.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={batch.id} className="hover:bg-zinc-100/50">
                    <td className="py-2 pr-2 whitespace-nowrap text-zinc-500 text-[10px]">{formattedDate}</td>
                    <td className="py-2 pr-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editOrigQty}
                          onChange={(e) => setEditOrigQty(e.target.value)}
                          className="w-16 bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-zinc-900 text-[11px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{batch.originalQty.toLocaleString('id-ID')} {unit}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editRemQty}
                          onChange={(e) => setEditRemQty(e.target.value)}
                          className="w-16 bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-zinc-900 text-[11px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`font-semibold ${batch.remainingQty > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {batch.remainingQty.toLocaleString('id-ID')} {unit}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editUnitPrice}
                          onChange={(e) => setEditUnitPrice(e.target.value)}
                          className="w-20 bg-white border border-zinc-300 rounded px-1.5 py-0.5 text-zinc-900 text-[11px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span>Rp {batch.unitPrice.toLocaleString('id-ID')}</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(batch.id)}
                            disabled={updateBatchMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingBatchId(null)}
                            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(batch)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-[10px]"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // State untuk Custom Alert
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Helper untuk menampilkan alert
  const showAlert = (text: string, type: 'error' | 'success' = 'error') => {
    setAlertMsg({ text, type });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };
  
  // State form tambah bahan baku
  const [addName, setAddName] = useState('');
  const [addUnit, setAddUnit] = useState('gram');
  const [addMinStock, setAddMinStock] = useState('');

  // State form mutasi stok
  const [adjustType, setAdjustType] = useState('in');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustPrice, setAdjustPrice] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

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
      showAlert("Material created successfully!", "success");
    }
  });

  const adjustMaterial = useMutation({
    mutationFn: async (payload: { id: number; type: string; quantity: number, price: number, notes: string }) => {
      const { data } = await axios.put(`/api/materials/${payload.id}`, {
        action: 'adjust_stock',
        adjustType: payload.type,
        quantity: payload.quantity,
        price: payload.price,
        notes: payload.notes
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-batches', variables.id] });
      setShowAdjust(null);
      setAdjustQty('');
      setAdjustPrice('');
      setAdjustNotes('');
      setAdjustType('in');
      showAlert("Stock mutation saved successfully!", "success");
    }
  });

  const updateMasterMaterial = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.put(`/api/materials/${payload.id}`, {
        action: 'update_master',
        name: payload.name,
        unit: payload.unit,
        minStock: payload.minStock,
        stock: payload.stock !== undefined ? Number(payload.stock) : undefined,
        costPerUnit: payload.costPerUnit !== undefined ? Number(payload.costPerUnit) : undefined
      });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-batches', variables.id] });
      setEditMaterialData(null);
      showAlert("Material master updated successfully!", "success");
    }
  });

  const handleAddMaterial = () => {
    if (!addName) return showAlert("Raw material name is required!", "error");
    createMaterial.mutate({
      name: addName,
      unit: addUnit,
      minStock: addMinStock
    });
  };

  const handleAdjustMaterial = (id: number) => {
    if (!adjustQty) return showAlert("Quantity is required!", "error");
    adjustMaterial.mutate({
      id,
      type: adjustType,
      quantity: parseFloat(adjustQty),
      price: parseFloat(adjustPrice || '0'),
      notes: adjustNotes
    });
  };

  const handleUpdateMaster = () => {
    if (!editMaterialData?.name) return showAlert("Name is required!", "error");
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
        <h1 className="text-3xl font-display font-bold text-zinc-900">Stock Opname & Inventory</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-zinc-500 text-sm md:text-base">Monitor stock opname, raw material availability, and stock movement</p>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="primary" className="shadow-md w-full md:w-auto justify-center" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 mr-2" /> Add Raw Material
            </Button>
          </div>
        </div>
      </div>

      {showAdd && (
        <Card className="flex flex-col md:flex-row gap-4 items-end mb-2">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Raw Material Name</label>
            <input 
              type="text" 
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g., Vanilla Syrup" 
              className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Unit of Measurement</label>
            <CustomSelect
              value={addUnit}
              onChange={setAddUnit}
              className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3"
              options={[
                { value: 'gram', label: 'Gram (g)' },
                { value: 'ml', label: 'Mililiter (ml)' },
                { value: 'pcs', label: 'Pieces (pcs)' }
              ]}
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Minimum Stock Alert</label>
            <input 
              type="number" 
              value={addMinStock}
              onChange={(e) => setAddMinStock(e.target.value)}
              placeholder="e.g., 500" 
              className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
            />
          </div>
          <Button variant="primary" className="w-full md:w-auto h-[46px]" onClick={handleAddMaterial} disabled={createMaterial.isPending}>
            {createMaterial.isPending ? 'Saving...' : 'Save'}
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-2">
        <Card 
          onClick={() => setFilterMode('all')}
          className={`flex items-center gap-4 cursor-pointer transition-all ${filterMode === 'all' ? 'bg-white ring-2 ring-blue-500' : 'bg-white/80 hover:bg-white'} border border-zinc-200`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] md:text-xs font-medium uppercase tracking-wider">Total Items</p>
            <h3 className="text-xl font-display font-bold text-zinc-900">{materials.length} Items</h3>
          </div>
        </Card>
        <Card 
          onClick={() => setFilterMode('low')}
          className={`flex items-center gap-4 cursor-pointer transition-all border ${filterMode === 'low' ? 'bg-red-50 ring-2 ring-red-400 border-red-400' : 'bg-white hover:bg-red-50 border-zinc-200'}`}
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-red-500 text-[10px] md:text-xs font-medium uppercase tracking-wider">Low Stock</p>
            <h3 className="text-xl font-display font-bold text-red-700">
              {materials.filter((m: any) => m.stock <= m.minStock).length} Items
            </h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex mb-4">
        <input 
          type="text" 
          placeholder="Search raw material name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-80 bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>

      {/* Mobile Compact List Layout (Hidden on Desktop) */}
      <div className="md:hidden bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
        {isLoading && <div className="text-center text-zinc-500 p-4 text-sm">Loading data from database...</div>}
        {!isLoading && filteredMaterials.length === 0 && (
          <div className="text-center text-zinc-500 p-4 text-sm">
            {materials.length === 0 ? "No raw material master data yet." : "No matching raw materials."}
          </div>
        )}
        {filteredMaterials.map((item: any) => {
          const isLowStock = item.stock <= item.minStock;
          const isExpanded = showAdjust === item.id;
          
          return (
            <div key={item.id} className="flex flex-col">
              {/* Main Compact Row */}
              <div 
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-zinc-50'}`}
                onClick={() => setShowAdjust(isExpanded ? null : item.id)}
              >
                {/* Info Kiri */}
                <div className="flex flex-col flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-900 font-semibold text-sm leading-tight line-clamp-1">{item.name}</span>
                    {isLowStock && <span className="bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider shrink-0">Low</span>}
                  </div>
                </div>

                {/* Stok Kanan */}
                <div className="text-right shrink-0">
                  <span className={`font-display font-bold text-base mr-1 ${isLowStock ? 'text-red-600' : 'text-blue-600'}`}>{item.stock.toLocaleString('id-ID')}</span>
                  <span className="text-[10px] text-zinc-500">{item.unit}</span>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Rp {item.costPerUnit?.toLocaleString('id-ID') || '0'} / {item.unit}</div>
                </div>
              </div>

              {/* Collapsible Action Area */}
              {isExpanded && (
                <div className="bg-zinc-50 p-3 flex flex-col gap-3 border-t border-zinc-100 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditMaterialData(item); }} 
                    className="w-full bg-white hover:bg-zinc-100 py-2 rounded-lg text-zinc-600 hover:text-zinc-900 text-xs font-medium border border-zinc-200 transition shadow-sm"
                  >
                    Edit Master Data
                  </button>
                  
                  {/* Detail Batches */}
                  <MaterialBatchesSection materialId={item.id} unit={item.unit} showAlert={showAlert} />
                  
                  <div className="bg-white rounded-lg p-3 border border-zinc-200 flex flex-col gap-3 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-800 border-b border-zinc-100 pb-1.5 uppercase tracking-wider">Stock Mutation</h4>
                    
                    <div className="flex gap-3">
                      <div className="w-1/3">
                        <label className="text-[10px] font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Type</label>
                        <select
                          value={adjustType}
                          onChange={(e) => setAdjustType(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md px-2 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="in">In (+)</option>
                          <option value="out">Out (-)</option>
                        </select>
                      </div>
                      <div className="w-1/3">
                        <label className="text-[10px] font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Qty</label>
                        <input 
                          type="number" 
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          placeholder="0" 
                          className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md px-2 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="text-[10px] font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Total Price</label>
                        <input 
                          type="number" 
                          value={adjustType === 'out' ? '' : adjustPrice}
                          onChange={(e) => setAdjustPrice(e.target.value)}
                          placeholder={adjustType === 'out' ? "Auto" : "0"} 
                          disabled={adjustType === 'out'}
                          className={`w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md px-2 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${adjustType === 'out' ? 'opacity-50 cursor-not-allowed bg-zinc-100' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Notes / Reason</label>
                      <input 
                        type="text" 
                        value={adjustNotes}
                        onChange={(e) => setAdjustNotes(e.target.value)}
                        placeholder="e.g., Purchase/Spill" 
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-md px-2 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="flex gap-3 mt-1">
                      <button 
                        onClick={() => setShowAdjust(null)}
                        className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        Cancel
                      </button>
                      <Button 
                        variant="primary" 
                        className="flex-1 py-2 text-xs font-bold justify-center" 
                        onClick={() => handleAdjustMaterial(item.id)}
                        disabled={adjustMaterial.isPending}
                      >
                        {adjustMaterial.isPending ? 'Saving...' : 'Save Mutation'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout (Hidden on Mobile) */}
      <Card className="hidden md:block p-0 border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm text-zinc-600 min-w-[800px]">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Raw Material Name</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Remaining Stock</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Avg Cost/Unit</th>
              <th className="px-6 py-4 font-semibold text-right uppercase tracking-wider text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading data from database...</td>
              </tr>
            )}
            {!isLoading && filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                  {materials.length === 0 ? "No raw material master data yet." : "No raw materials match your filter or search."}
                </td>
              </tr>
            )}
            {filteredMaterials.map((item: any) => {
              const isLowStock = item.stock <= item.minStock;
              return (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-zinc-50/50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-500">Min: {item.minStock} {item.unit}</span>
                            {isLowStock && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Low Stock</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-display font-bold ${isLowStock ? 'text-red-600' : 'text-zinc-900'}`}>{item.stock.toLocaleString('id-ID')}</span>
                        <span className="text-zinc-500 font-medium">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-900 font-medium">Rp {item.costPerUnit?.toLocaleString('id-ID') || '0'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          className="bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
                          onClick={() => setEditMaterialData(item)}
                        >
                          Edit Data
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`shadow-sm border-zinc-200 transition-colors ${showAdjust === item.id ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                          onClick={() => setShowAdjust(showAdjust === item.id ? null : item.id)}
                        >
                          Adjust Stock
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline Adjust Stock Form */}
                  {showAdjust === item.id && (
                    <tr className="bg-zinc-50/50">
                      <td colSpan={4} className="px-6 py-4 border-t border-zinc-100">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
                          {/* Left column: batch details */}
                          <MaterialBatchesSection materialId={item.id} unit={item.unit} showAlert={showAlert} />

                          {/* Right column: stock adjustment */}
                          <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-200 flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-zinc-800 border-b border-zinc-100 pb-1.5 uppercase tracking-wider">Stock Mutation (Penyesuaian Stok)</h4>
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                              <div className="w-full sm:w-1/3">
                                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Mutation Type</label>
                                <CustomSelect
                                  value={adjustType}
                                  onChange={setAdjustType}
                                  className="bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3"
                                  options={[
                                    { value: 'in', label: 'Stock In (+)' },
                                    { value: 'out', label: 'Stock Out (-)' }
                                  ]}
                                />
                              </div>
                              <div className="w-full sm:w-1/3">
                                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Quantity</label>
                                <input 
                                  type="number" 
                                  value={adjustQty}
                                  onChange={(e) => setAdjustQty(e.target.value)}
                                  placeholder={`Qty in ${item.unit}`} 
                                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                />
                              </div>
                              <div className="w-full sm:w-1/3">
                                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">
                                  Total Price {adjustType === 'out' && <span className="text-blue-500 text-[10px] lowercase normal-case">(Otomatis FIFO)</span>}
                                </label>
                                <input 
                                  type="number" 
                                  value={adjustType === 'out' ? '' : adjustPrice}
                                  onChange={(e) => setAdjustPrice(e.target.value)}
                                  placeholder={adjustType === 'out' ? "Dihitung sistem" : "Total Rp"}
                                  disabled={adjustType === 'out'}
                                  className={`w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${adjustType === 'out' ? 'opacity-50 cursor-not-allowed bg-zinc-100' : ''}`} 
                                />
                              </div>
                            </div>
                            <div className="w-full">
                              <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Notes / Reason</label>
                              <input 
                                type="text" 
                                value={adjustNotes}
                                onChange={(e) => setAdjustNotes(e.target.value)}
                                placeholder="e.g., Purchase from supplier, Spill..." 
                                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                              />
                            </div>
                            <div className="flex gap-3 mt-auto">
                              <Button 
                                variant="outline" 
                                className="flex-1 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 h-[46px] justify-center"
                                onClick={() => setShowAdjust(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="primary" 
                                className="flex-1 h-[46px] justify-center"
                                onClick={() => handleAdjustMaterial(item.id)}
                                disabled={adjustMaterial.isPending}
                              >
                                {adjustMaterial.isPending ? 'Saving...' : 'Save Mutation'}
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

      {/* Modal Edit Master Data */}
      {editMaterialData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white border border-zinc-200">
            <h2 className="text-xl font-display font-bold text-zinc-900 mb-4">Edit Master Data</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Raw Material Name</label>
                <input 
                  type="text" 
                  value={editMaterialData.name}
                  onChange={(e) => setEditMaterialData({...editMaterialData, name: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Unit of Measurement</label>
                <CustomSelect
                  value={editMaterialData.unit}
                  onChange={(val) => setEditMaterialData({...editMaterialData, unit: val})}
                  className="bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3"
                  options={[
                    { value: 'gram', label: 'Gram (g)' },
                    { value: 'ml', label: 'Mililiter (ml)' },
                    { value: 'pcs', label: 'Pieces (pcs)' }
                  ]}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Minimum Stock Alert</label>
                <input 
                  type="number" 
                  value={editMaterialData.minStock}
                  onChange={(e) => setEditMaterialData({...editMaterialData, minStock: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Current Stock Quantity</label>
                <input 
                  type="number" 
                  value={editMaterialData.stock}
                  onChange={(e) => setEditMaterialData({...editMaterialData, stock: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Average Cost per Unit (Rp)</label>
                <input 
                  type="number" 
                  value={editMaterialData.costPerUnit}
                  onChange={(e) => setEditMaterialData({...editMaterialData, costPerUnit: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setEditMaterialData(null)} className="bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700">Cancel</Button>
              <Button variant="primary" onClick={handleUpdateMaster} disabled={updateMasterMaterial.isPending}>
                {updateMasterMaterial.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Toast Alert */}
      {alertMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md ${
            alertMsg.type === 'success' 
              ? 'bg-emerald-500/95 border-emerald-400 text-white' 
              : 'bg-rose-500/95 border-rose-400 text-white'
          }`}>
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white shrink-0" />
            )}
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="ml-3 opacity-80 hover:opacity-100 transition">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
