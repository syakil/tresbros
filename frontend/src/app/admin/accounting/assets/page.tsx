"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, ShieldAlert, MonitorPlay, TrendingDown, DollarSign } from 'lucide-react';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [coas, setCoas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    salvageValue: 0,
    usefulLifeInYears: 5,
    assetAccountId: 0,
    paymentAccountId: 0,
    accumulatedDepreciationAccountId: 0,
    depreciationExpenseAccountId: 0
  });

  const [depreciateModal, setDepreciateModal] = useState<{show: boolean, asset: any, amount: number, date: string, desc: string}>({
    show: false, asset: null, amount: 0, date: new Date().toISOString().split('T')[0], desc: 'Beban Penyusutan Bulanan'
  });

  const [disposeModal, setDisposeModal] = useState<{show: boolean, asset: any, price: number, accountId: number, date: string}>({
    show: false, asset: null, price: 0, accountId: 0, date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, coaRes] = await Promise.all([
        axios.get('/api/assets'),
        axios.get('/api/accounting/coa')
      ]);
      setAssets(assetsRes.data || []);
      setCoas(coaRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/assets', formData);
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert("Failed to save asset: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDepreciate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/assets/${depreciateModal.asset.id}/depreciate`, {
        amount: Number(depreciateModal.amount),
        date: new Date(depreciateModal.date).toISOString(),
        description: depreciateModal.desc
      });
      setDepreciateModal({ ...depreciateModal, show: false });
      fetchData();
    } catch (error: any) {
      alert("Failed to depreciate: " + (error.response?.data || error.message));
    }
  };

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.delete(`/api/assets/${disposeModal.asset.id}?disposalPrice=${disposeModal.price}&disposalAccountId=${disposeModal.accountId}&date=${new Date(disposeModal.date).toISOString()}`);
      setDisposeModal({ ...disposeModal, show: false });
      fetchData();
    } catch (error: any) {
      alert("Failed to dispose: " + (error.response?.data || error.message));
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading assets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Fixed Assets</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage fixed assets, calculate depreciation, and track disposals.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
        >
          <Plus className="w-5 h-5" />
          Add New Asset
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 text-zinc-900 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Asset Name & Code</th>
                <th className="px-6 py-4 font-semibold">Purchase Info</th>
                <th className="px-6 py-4 font-semibold">Book Value</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {assets.map((a: any) => (
                <tr key={a.id} className="hover:bg-zinc-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-900">{a.name}</div>
                    <div className="text-xs text-zinc-500">{a.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{formatRupiah(a.purchasePrice)}</div>
                    <div className="text-xs text-zinc-500">{new Date(a.purchaseDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{formatRupiah(a.bookValue)}</div>
                    <div className="text-xs text-zinc-500">Acc. Dep: {formatRupiah(a.accumulatedDepreciation)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.status === 'ACTIVE' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setDepreciateModal({ show: true, asset: a, amount: 0, date: new Date().toISOString().split('T')[0], desc: 'Beban Penyusutan Bulanan' })}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition tooltip"
                          title="Depreciate"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDisposeModal({ show: true, asset: a, price: 0, accountId: 0, date: new Date().toISOString().split('T')[0] })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition tooltip"
                          title="Dispose"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <MonitorPlay className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                    <p>No assets found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ASSET MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-zinc-900">Add New Fixed Asset</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Asset Code</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. AST-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Asset Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Mesin Kopi Espresso" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Purchase Date</label>
                  <input type="date" required value={formData.purchaseDate} onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Purchase Price (Rp)</label>
                  <input type="number" required min="0" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Salvage Value (Rp)</label>
                  <input type="number" min="0" value={formData.salvageValue} onChange={(e) => setFormData({...formData, salvageValue: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Useful Life (Years)</label>
                  <input type="number" required min="1" value={formData.usefulLifeInYears} onChange={(e) => setFormData({...formData, usefulLifeInYears: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              
              <hr className="border-zinc-100" />
              
              <h3 className="text-lg font-bold text-zinc-800">Accounting Configuration</h3>
              <p className="text-sm text-zinc-500 mb-4">Select the relevant Chart of Accounts for this asset. Journals will be posted automatically.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Asset COA (Debit)</label>
                  <select required value={formData.assetAccountId} onChange={(e) => setFormData({...formData, assetAccountId: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                    <option value={0}>-- Select Asset Account --</option>
                    {coas.filter(c => c.type === 'ASSET').map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Payment COA (Credit)</label>
                  <select required value={formData.paymentAccountId} onChange={(e) => setFormData({...formData, paymentAccountId: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                    <option value={0}>-- Select Cash/Bank/AP --</option>
                    {coas.filter(c => c.type === 'ASSET' || c.type === 'LIABILITY').map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Accumulated Depr. COA</label>
                  <select required value={formData.accumulatedDepreciationAccountId} onChange={(e) => setFormData({...formData, accumulatedDepreciationAccountId: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                    <option value={0}>-- Select Accum. Depr. --</option>
                    {coas.filter(c => c.type === 'ASSET').map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Depreciation Expense COA</label>
                  <select required value={formData.depreciationExpenseAccountId} onChange={(e) => setFormData({...formData, depreciationExpenseAccountId: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                    <option value={0}>-- Select Depr. Expense --</option>
                    {coas.filter(c => c.type === 'EXPENSE').map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPRECIATE MODAL */}
      {depreciateModal.show && depreciateModal.asset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Depreciate Asset</h2>
              <p className="text-sm text-zinc-500">{depreciateModal.asset.name}</p>
            </div>
            <form onSubmit={handleDepreciate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                <input type="date" required value={depreciateModal.date} onChange={(e) => setDepreciateModal({...depreciateModal, date: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Amount (Rp)</label>
                <input type="number" required min="1" value={depreciateModal.amount} onChange={(e) => setDepreciateModal({...depreciateModal, amount: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                <p className="text-xs text-zinc-500 mt-1">Max allowed: {formatRupiah(depreciateModal.asset.purchasePrice - depreciateModal.asset.salvageValue - depreciateModal.asset.accumulatedDepreciation)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                <input type="text" required value={depreciateModal.desc} onChange={(e) => setDepreciateModal({...depreciateModal, desc: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setDepreciateModal({...depreciateModal, show: false})} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium">Process Depreciation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPOSE MODAL */}
      {disposeModal.show && disposeModal.asset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Dispose Asset</h2>
              <p className="text-sm text-zinc-500">{disposeModal.asset.name}</p>
            </div>
            <form onSubmit={handleDispose} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Disposal Date</label>
                <input type="date" required value={disposeModal.date} onChange={(e) => setDisposeModal({...disposeModal, date: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Disposal Price / Sales Proceed (Rp)</label>
                <input type="number" min="0" value={disposeModal.price} onChange={(e) => setDisposeModal({...disposeModal, price: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" placeholder="0 if scrapped" />
              </div>
              {disposeModal.price > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Deposit To COA</label>
                  <select required value={disposeModal.accountId} onChange={(e) => setDisposeModal({...disposeModal, accountId: Number(e.target.value)})} className="w-full border border-zinc-300 rounded-lg px-4 py-2 outline-none focus:border-red-500">
                    <option value={0}>-- Select Account --</option>
                    {coas.filter(c => c.type === 'ASSET').map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setDisposeModal({...disposeModal, show: false})} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">Dispose Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
