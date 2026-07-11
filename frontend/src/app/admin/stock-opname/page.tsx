"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClipboardList, Search, CheckCircle, X, AlertTriangle, Check } from 'lucide-react';

export default function StockOpnamePage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  // Maintain local form states for each material row
  // Key is material.id
  const [opnameStates, setOpnameStates] = useState<Record<number, { actualStock: string; unitPrice: string; notes: string }>>({});

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Query raw materials
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await axios.get('/api/materials');
      return data;
    }
  });

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: async (payload: { id: number; type: 'in' | 'out'; quantity: number; price: number; notes: string }) => {
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
      // Clear input state for this row
      setOpnameStates(prev => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      showToast(`Stock opname saved successfully for material.`, 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || "Failed to adjust stock", 'error');
    }
  });

  const handleStateChange = (materialId: number, field: 'actualStock' | 'unitPrice' | 'notes', value: string) => {
    setOpnameStates(prev => ({
      ...prev,
      [materialId]: {
        ...((prev[materialId]) || { actualStock: '', unitPrice: '', notes: '' }),
        [field]: value
      }
    }));
  };

  const handleSaveOpname = (material: any) => {
    const systemStock = material.stock;
    const state = opnameStates[material.id];

    if (!state || state.actualStock === "") {
      showToast("Please enter the actual physical stock first!", "warning");
      return;
    }

    const actualStock = parseFloat(state.actualStock);
    if (isNaN(actualStock) || actualStock < 0) {
      showToast("Actual stock must be 0 or greater!", "error");
      return;
    }

    const diff = actualStock - systemStock;
    if (diff === 0) {
      showToast("No stock discrepancy detected. No adjustment needed.", "warning");
      return;
    }

    const type = diff > 0 ? 'in' : 'out';
    const quantity = Math.abs(diff);
    
    let price = 0;
    if (type === 'in') {
      const uPrice = state.unitPrice !== "" ? parseFloat(state.unitPrice) : material.costPerUnit;
      if (isNaN(uPrice) || uPrice < 0) {
        showToast("Price per unit must be 0 or greater!", "error");
        return;
      }
      price = quantity * uPrice;
    }

    const defaultNotes = type === 'in' ? "Stock Opname (Discrepancy Surplus +)" : "Stock Opname (Discrepancy Deficit -)";
    const notes = state.notes || defaultNotes;

    adjustMutation.mutate({
      id: material.id,
      type,
      quantity,
      price,
      notes
    });
  };

  const filteredMaterials = materials.filter((m: any) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3
          ${toastMessage.type === 'success' ? 'bg-emerald-500 border-emerald-600 text-white' : 
            toastMessage.type === 'warning' ? 'bg-amber-500 border-amber-600 text-white' : 'bg-red-500 border-red-600 text-white'}`}
        >
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
          {toastMessage.type === 'error' && <X className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-display font-bold text-zinc-900 flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-blue-600" />
          Stock Opname
        </h1>
        <p className="text-zinc-500 text-sm">Update actual raw material stock levels, calculate discrepancies, and automatically post FIFO adjustments.</p>
      </div>

      {/* Search Filter */}
      <Card className="p-4 mb-6 bg-white border border-zinc-200 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search raw material for opname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </Card>

      {/* Opname Table Card */}
      <Card className="overflow-hidden bg-white border border-zinc-200 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Raw Material</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider text-right">System Stock</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider text-center">Actual Stock (Fisik)</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider text-center">Selisih</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Price Details (If Stock Increases)</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Notes / Reason</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 font-medium">
                    Loading raw materials database...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 font-medium">
                    No materials found. Add materials first.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material: any) => {
                  const state = opnameStates[material.id] || { actualStock: '', unitPrice: '', notes: '' };
                  const systemStock = material.stock;
                  
                  // Calculate discrepancy live
                  const hasInput = state.actualStock !== "";
                  const actualStockVal = hasInput ? parseFloat(state.actualStock) : systemStock;
                  const diff = hasInput ? (actualStockVal - systemStock) : 0;
                  
                  // Default unit price to system's current CostPerUnit
                  const displayUnitPrice = state.unitPrice !== "" ? state.unitPrice : material.costPerUnit.toString();

                  return (
                    <tr key={material.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900">{material.name}</div>
                        <div className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">{material.unit}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium">
                        {systemStock.toLocaleString('id-ID')} <span className="text-xs text-zinc-400">{material.unit}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            placeholder="Input actual qty"
                            value={state.actualStock}
                            onChange={(e) => handleStateChange(material.id, 'actualStock', e.target.value)}
                            className="w-32 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {!hasInput ? (
                          <span className="text-zinc-300 font-medium">-</span>
                        ) : diff > 0 ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200">
                            +{diff.toLocaleString('id-ID')} {material.unit}
                          </span>
                        ) : diff < 0 ? (
                          <span className="inline-block bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
                            {diff.toLocaleString('id-ID')} {material.unit}
                          </span>
                        ) : (
                          <span className="inline-block bg-zinc-100 text-zinc-500 text-xs font-semibold px-2 py-1 rounded-full border border-zinc-200">
                            Cocok
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasInput && diff > 0 ? (
                          <div className="flex flex-col gap-1 w-44">
                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Harga per {material.unit} (Rp)</label>
                            <input
                              type="number"
                              placeholder="Price per unit"
                              value={state.unitPrice}
                              onChange={(e) => handleStateChange(material.id, 'unitPrice', e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <div className="text-[10px] text-zinc-500 font-medium">
                              Est. Total: <span className="font-semibold text-zinc-700">Rp {(diff * parseFloat(displayUnitPrice || "0")).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        ) : hasInput && diff < 0 ? (
                          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            Dihitung otomatis (FIFO)
                          </span>
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {hasInput ? (
                          <input
                            type="text"
                            placeholder="Alasan selisih..."
                            value={state.notes}
                            onChange={(e) => handleStateChange(material.id, 'notes', e.target.value)}
                            className="w-full min-w-[120px] bg-white border border-zinc-200 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        ) : (
                          <span className="text-zinc-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="primary"
                          disabled={!hasInput || diff === 0 || adjustMutation.isPending}
                          onClick={() => handleSaveOpname(material)}
                          className="text-xs font-semibold px-3.5 py-1.5 h-8 gap-1 shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
