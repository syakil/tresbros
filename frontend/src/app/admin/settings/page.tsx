"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { Save, Trash2, BookOpen, ShoppingCart, Package } from 'lucide-react';

type ResetScope = 'journals' | 'transactions' | 'stock';

interface ResetCardProps {
  scope: ResetScope;
  title: string;
  description: string;
  icon: React.ReactNode;
  confirmWord: string;
  affectedData: string;
}

const ResetCard = ({ scope, title, description, icon, confirmWord, affectedData }: ResetCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    if (confirmText !== confirmWord) {
      setResetError(`Ketik "${confirmWord}" untuk mengonfirmasi.`);
      return;
    }

    setResetting(true);
    setResetError('');
    try {
      await axios.post(`/api/settings/reset-${scope}`);
      setResetSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setConfirmText('');
        setResetSuccess(false);
      }, 1500);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || `Gagal reset ${scope}. Coba lagi atau hubungi admin.`;
      setResetError(errMsg);
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Card className="p-5 border border-red-200 bg-red-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="text-red-500 mt-0.5 shrink-0">{icon}</div>
          <div>
            <h3 className="font-bold text-zinc-900 text-base">{title}</h3>
            <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setResetError('');
            setConfirmText('');
            setResetSuccess(false);
            setShowModal(true);
          }}
          variant="danger"
          className="shrink-0 px-5 py-2.5 text-sm font-semibold shadow-md shadow-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => { if (!resetting && !resetSuccess) setShowModal(false); }} />
          <Card className="relative z-10 w-full max-w-md border border-zinc-200 bg-white p-6 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-100 shadow-sm">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{title}?</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Semua data <strong className="text-zinc-800">{affectedData}</strong> akan dihapus secara <strong className="text-zinc-800">permanen</strong>.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-3.5 text-xs text-amber-800 leading-relaxed mb-5">
              <strong>Data berikut akan dihapus:</strong> {affectedData}. <strong>Data user, role, dan settings TIDAK akan dihapus.</strong>
            </div>

            {resetError && (
              <div className="mb-4 bg-red-50 text-red-700 text-sm p-3.5 rounded-xl border border-red-200 font-medium text-center">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 bg-emerald-50 text-emerald-700 text-sm p-3.5 rounded-xl border border-emerald-200 font-medium text-center animate-bounce">
                Berhasil di-reset! Modal akan ditutup...
              </div>
            )}

            <div className="space-y-2 mb-6">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">
                Ketik <span className="text-red-600 font-bold select-none">{confirmWord}</span> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                placeholder={confirmWord}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={resetting || resetSuccess}
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-center font-bold tracking-widest uppercase placeholder:text-zinc-300 text-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
              <Button
                variant="outline"
                onClick={() => { setConfirmText(''); setShowModal(false); }}
                disabled={resetting || resetSuccess}
                className="flex-1 text-sm font-medium"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleReset}
                disabled={confirmText !== confirmWord || resetting || resetSuccess}
                className="flex-1 text-sm font-bold shadow-sm shadow-red-500/10"
              >
                {resetting ? 'Memproses...' : 'Ya, Reset'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default function SettingsPage() {
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const resTax = await axios.get('/api/settings/TAX_ENABLED');
      setTaxEnabled(resTax.data.value === 'true');
    } catch (e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings', {
        key: 'TAX_ENABLED',
        value: taxEnabled ? 'true' : 'false',
        dataType: 'bool'
      });
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error("Failed to save settings", error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-zinc-500">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-zinc-900">System Settings</h1>
        <p className="text-zinc-500">Restaurant operations and price configuration</p>
      </div>

      <Card className="p-6 border border-zinc-200 bg-white flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">Tax Settings (PB1)</h2>
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <div>
              <h3 className="font-semibold text-zinc-900">Enable 11% Tax</h3>
              <p className="text-sm text-zinc-500 mt-1">
                If enabled, the system will automatically calculate an 11% tax (PB1) on every sales transaction in POS and Mobile.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
              />
              <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-zinc-900">Danger Zone</h2>
        </div>
        <div className="space-y-3">
          <ResetCard
            scope="journals"
            title="Reset Journal Entries"
            description="Hapus semua entri jurnal akuntansi (jurnal umum, buku besar). Saldo Chart of Accounts di-reset ke 0."
            icon={<BookOpen className="w-5 h-5" />}
            confirmWord="JURNAL"
            affectedData="journal entries, journal lines, dan saldo COA"
          />
          <ResetCard
            scope="transactions"
            title="Reset Transactions"
            description="Hapus semua data transaksi penjualan, purchase, expense, dan income. Chart of Accounts di-reset."
            icon={<ShoppingCart className="w-5 h-5" />}
            confirmWord="TRANSAKSI"
            affectedData="orders, purchases, expenses, incomes, dan saldo COA"
          />
          <ResetCard
            scope="stock"
            title="Reset Stock & Products"
            description="Hapus semua data stok (materials, batches), produk, kategori, resep, dan kupon."
            icon={<Package className="w-5 h-5" />}
            confirmWord="STOK"
            affectedData="materials, material batches, products, categories, recipes, dan coupons"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} variant="primary" className="px-8 py-3.5 text-base font-bold shadow-md shadow-blue-500/20">
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 bg-white rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.type === 'success' ? 'border-emerald-200' :
          toast.type === 'error' ? 'border-red-200' : 'border-amber-200'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
            toast.type === 'success' ? 'bg-emerald-500' :
            toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
          }`}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '!'}
          </div>
          <p className="font-medium text-sm">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
