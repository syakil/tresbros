"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, ShoppingCart, Calendar, Building2, Search, FileText, Trash2, UploadCloud, ImageIcon, X, ChevronRight } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { materialId: '', qty: '', price: '' }
  ]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for Modal
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Master Materials for Select Dropdown
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await axios.get('/api/materials');
      return data;
    }
  });

  // Fetch Purchase History
  const { data: purchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data } = await axios.get('/api/purchases');
      return data;
    }
  });

  // Mutation to Create Purchase
  const createPurchase = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post('/api/purchases', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowAdd(false);
      setSupplier('');
      setPurchaseItems([{ materialId: '', qty: '', price: '' }]);
      setReceiptFile(null);
      setReceiptBase64('');
      showToast('PO berhasil disimpan!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Gagal menyimpan PO', 'error');
    }
  });

  // Mutation to Cancel Purchase
  const cancelPurchase = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.patch(`/api/purchases/${id}`, { action: 'cancel' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setConfirmCancelId(null);
      setSelectedPO(null); // Tutup modal atau update state jika ingin modal tetap terbuka
      showToast('PO berhasil dibatalkan dan stok telah disesuaikan.', 'success');
    },
    onError: (error: any) => {
      setConfirmCancelId(null);
      showToast(error.response?.data?.error || 'Gagal membatalkan PO', 'error');
    }
  });

  const handleCancelPO = (id: number) => {
    setConfirmCancelId(id);
  };

  const confirmAction = () => {
    if (confirmCancelId) {
      cancelPurchase.mutate(confirmCancelId);
    }
  };

  const addLineItem = () => {
    setPurchaseItems([...purchaseItems, { materialId: '', qty: '', price: '' }]);
  };

  const removeLineItem = (index: number) => {
    const newItems = [...purchaseItems];
    newItems.splice(index, 1);
    setPurchaseItems(newItems);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePurchase = () => {
    if (!supplier) return showToast("Nama supplier harus diisi!", "error");
    
    // Validasi item
    const validItems = purchaseItems.filter(item => item.materialId && item.qty && item.price);
    if (validItems.length === 0) return showToast("Minimal 1 item belanja harus diisi dengan lengkap!", "error");

    createPurchase.mutate({
      purchaseNo: "",
      supplierName: supplier,
      receiptBase64,
      receiptFileName: receiptFile?.name,
      items: validItems.map(item => ({
        materialId: Number(item.materialId),
        quantity: Number(item.qty),
        price: Number(item.price)
      }))
    });
  };

  // Kalkulasi KPI
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthPurchases = purchases.filter((p: any) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'COMPLETED';
  });

  const totalPengeluaranBulanIni = thisMonthPurchases.reduce((acc: number, curr: any) => acc + curr.totalAmount, 0);

  // Filter Search
  const filteredPurchases = purchases.filter((po: any) => {
    return po.purchaseNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
           po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3
          ${toastMessage.type === 'success' ? 'bg-brand-olive/95 border-brand-sage/50 text-brand-cream' : 'bg-red-900/95 border-red-500/50 text-red-200'}`}
        >
          {toastMessage.type === 'success' ? <ShoppingCart className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-medium text-sm">{toastMessage.text}</p>
        </div>
      )}

      {/* Konfirmasi Batal PO */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card variant="olive" className="w-full max-w-md bg-[#1C1F1D] border-red-500/30 shadow-2xl p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2 text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-brand-cream">Batalkan Transaksi?</h3>
            <p className="text-sm text-brand-sage">
              Anda yakin ingin membatalkan Purchase Order ini? Stok bahan baku yang berkaitan dengan transaksi ini akan dikurangi secara otomatis. Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => setConfirmCancelId(null)}>Kembali</Button>
              <Button 
                variant="primary" 
                className="bg-red-500 hover:bg-red-600 text-white border-none shadow-[0_4px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all"
                onClick={confirmAction}
                disabled={cancelPurchase.isPending}
              >
                {cancelPurchase.isPending ? 'Memproses...' : 'Ya, Batalkan PO'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-brand-cream">Pembelian Bahan Baku</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-brand-sage text-sm md:text-base">Catat transaksi belanja bahan baku (Purchase Orders) dari supplier</p>
          <Button variant="primary" className="shadow-md w-full md:w-auto justify-center" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4 mr-2" /> Buat Pembelian Baru
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card variant="olive" className="bg-black/40 border border-brand-warm/30 mb-2">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="font-semibold text-brand-cream flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-warm" />
                Form Input Pembelian Baru
              </h3>
              <p className="text-sm text-brand-sage">PO-{new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 10)}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <label className="text-xs text-brand-sage mb-1.5 block">Nama Supplier / Toko</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Contoh: PT Kopi Maju Jaya"
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm"
                />
              </div>

              <div className="w-full md:w-1/2">
                <label className="text-xs text-brand-sage mb-1.5 block">Upload Foto Struk (Opsional)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-black/40 hover:bg-black/60 border border-white/10 text-brand-cream rounded-xl px-4 py-3 flex items-center gap-2 transition-colors w-full md:w-auto justify-center">
                    <UploadCloud className="w-4 h-4 text-brand-warm" />
                    <span className="text-sm">{receiptFile ? 'Ganti File' : 'Pilih File Gambar'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  {receiptFile && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImageIcon className="w-4 h-4 text-brand-sage shrink-0" />
                      <span className="text-xs text-brand-sage truncate">{receiptFile.name}</span>
                      <button onClick={() => { setReceiptFile(null); setReceiptBase64(''); }} className="text-red-400 hover:text-red-300 ml-auto">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-brand-sage block border-b border-white/5 pb-2">Rincian Item Pembelian</label>

              {purchaseItems.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-end bg-black/20 p-4 rounded-xl border border-white/5 relative">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase tracking-wider text-brand-sage mb-1 block">Bahan Baku</label>
                    <CustomSelect
                      value={item.materialId}
                      onChange={(val) => {
                        const newItems = [...purchaseItems];
                        newItems[index].materialId = val;
                        setPurchaseItems(newItems);
                      }}
                      className="bg-black/40 border border-white/10 text-brand-cream rounded-lg px-3 py-2.5"
                      options={[
                        { value: '', label: 'Pilih Bahan Baku' },
                        ...materials.map((m: any) => ({ value: m.id.toString(), label: `${m.name} (${m.unit})` }))
                      ]}
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-[10px] uppercase tracking-wider text-brand-sage mb-1 block">Kuantitas</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const newItems = [...purchaseItems];
                        newItems[index].qty = e.target.value;
                        setPurchaseItems(newItems);
                      }}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/10 text-brand-cream rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-warm"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <label className="text-[10px] uppercase tracking-wider text-brand-sage mb-1 block">Harga Total Beli (Rp)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...purchaseItems];
                        newItems[index].price = e.target.value;
                        setPurchaseItems(newItems);
                      }}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/10 text-brand-cream rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand-warm"
                    />
                  </div>
                  
                  {/* Tombol Hapus Baris */}
                  {purchaseItems.length > 1 && (
                    <button 
                      onClick={() => removeLineItem(index)}
                      className="absolute top-2 right-2 md:relative md:top-auto md:right-auto md:mb-1 w-8 h-8 md:w-10 md:h-10 shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition border border-red-500/20"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <Button variant="outline" className="w-full md:w-auto mt-2 text-sm py-2" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Baris Item
              </Button>
            </div>

            {/* Ringkasan Total */}
            <div className="flex justify-end p-4 bg-brand-dark/50 rounded-xl border border-white/5">
               <div className="text-right">
                  <p className="text-xs text-brand-sage mb-1 uppercase tracking-wider font-bold">Total Pembelian</p>
                  <p className="text-2xl font-display font-bold text-brand-warm">
                    Rp {purchaseItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0).toLocaleString('id-ID')}
                  </p>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleSavePurchase} disabled={createPurchase.isPending}>
                {createPurchase.isPending ? 'Menyimpan...' : 'Simpan & Tambah Stok'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-2">
        <Card variant="olive" className="flex items-center gap-4 bg-black/40 p-4">
          <div className="w-10 h-10 rounded-full bg-brand-warm/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-brand-warm" />
          </div>
          <div>
            <p className="text-brand-sage text-[10px] md:text-xs font-medium uppercase tracking-wider">Total PO Bulan Ini</p>
            <h3 className="text-lg md:text-xl font-display font-bold text-brand-cream">{thisMonthPurchases.length} Transaksi</h3>
          </div>
        </Card>
        <Card variant="olive" className="flex items-center gap-4 bg-black/40 p-4">
          <div className="w-10 h-10 rounded-full bg-brand-olive/50 flex items-center justify-center border border-brand-sage/30 shrink-0">
            <Building2 className="w-5 h-5 text-brand-sage" />
          </div>
          <div>
            <p className="text-brand-sage text-[10px] md:text-xs font-medium uppercase tracking-wider">Pengeluaran Bulan Ini</p>
            <h3 className="text-lg md:text-xl font-display font-bold text-brand-cream">Rp {totalPengeluaranBulanIni.toLocaleString('id-ID')}</h3>
          </div>
        </Card>
      </div>

      <Card variant="olive" className="p-0 overflow-hidden shadow-xl border-white/10">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/20">
          <h3 className="font-semibold text-brand-cream">Riwayat Pembelian Terbaru</h3>
          <div className="relative w-full md:w-auto">
            <Search className="w-4 h-4 text-brand-sage absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari PO atau Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/10 text-sm text-brand-cream rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-brand-warm w-full md:w-64"
            />
          </div>
        </div>

        {/* Mobile View: Compact Cards */}
        <div className="md:hidden flex flex-col bg-black/40 divide-y divide-white/5">
          {isLoadingPurchases && <div className="p-6 text-center text-brand-sage text-sm">Memuat data...</div>}
          {!isLoadingPurchases && filteredPurchases.length === 0 && (
            <div className="p-6 text-center text-brand-sage text-sm">Tidak ada transaksi ditemukan.</div>
          )}
          {filteredPurchases.map((po: any) => (
            <div key={po.id} className="p-4 flex flex-col gap-2" onClick={() => setSelectedPO(po)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-brand-warm font-bold">{po.purchaseNo}</span>
                  {po.status === 'CANCELLED' && (
                    <span className="bg-red-500/20 text-red-400 text-[8px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Dibatalkan</span>
                  )}
                </div>
                <span className="bg-brand-sage/20 text-brand-sage text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Detail <ChevronRight className="inline w-3 h-3 ml-0.5" />
                </span>
              </div>
              <p className="font-medium text-brand-cream text-lg">{po.supplierName}</p>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="flex items-center gap-1.5 text-brand-sage text-xs">
                  <Calendar className="w-3 h-3" /> {new Date(po.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5 text-brand-sage text-xs">
                  {po.receiptUrl && <ImageIcon className="w-3 h-3 text-brand-warm" />} {po.items.length} Item
                </span>
              </div>
              <div className="mt-2 bg-black/20 p-2.5 rounded-lg border border-white/5 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-brand-sage font-bold">Total Pembelian</span>
                <span className="font-bold text-brand-cream">Rp {po.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-sage min-w-[800px]">
            <thead className="bg-black/40 text-brand-cream border-b border-white/10">
              <tr>
                <th className="px-6 py-5 font-semibold w-40">No PO</th>
                <th className="px-6 py-5 font-semibold">Supplier</th>
                <th className="px-6 py-5 font-semibold">Tanggal</th>
                <th className="px-6 py-5 font-semibold">Item Belanja</th>
                <th className="px-6 py-5 font-semibold text-right">Total Nominal</th>
                <th className="px-6 py-5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoadingPurchases && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">Memuat data...</td>
                </tr>
              )}
              {!isLoadingPurchases && filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">Tidak ada transaksi ditemukan.</td>
                </tr>
              )}
              {filteredPurchases.map((po: any) => (
                <tr key={po.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedPO(po)}>
                  <td className="px-6 py-4 font-mono text-xs text-brand-warm">{po.purchaseNo}</td>
                  <td className="px-6 py-4 text-brand-cream font-medium flex items-center gap-2">
                    {po.supplierName}
                    {po.receiptUrl && <span title="Ada Struk"><ImageIcon className="w-3 h-3 text-brand-warm shrink-0" /></span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {new Date(po.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">{po.items.length} Jenis Bahan</td>
                  <td className="px-6 py-4 text-right font-semibold text-brand-cream">
                    Rp {po.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {po.status === 'CANCELLED' ? (
                      <span className="bg-red-500/20 text-red-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-block">
                        Dibatalkan
                      </span>
                    ) : (
                      <span className="bg-brand-sage/20 text-brand-sage text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-block">
                        Selesai
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detail PO */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card variant="olive" className="w-full max-w-2xl bg-[#1C1F1D] border-brand-warm/30 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
              <div>
                <h3 className="font-semibold text-brand-cream text-lg">Detail Pembelian</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-brand-warm font-mono">{selectedPO.purchaseNo}</p>
                  {selectedPO.status === 'CANCELLED' && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Dibatalkan</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedPO(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-brand-sage transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
              
              {/* Info Utama */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-brand-sage mb-1">Nama Supplier</p>
                  <p className="font-medium text-brand-cream">{selectedPO.supplierName}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-brand-sage mb-1">Waktu Transaksi</p>
                  <p className="font-medium text-brand-cream">{new Date(selectedPO.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>

              {/* Rincian Item */}
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-sage mb-3 font-bold border-b border-white/10 pb-2">Rincian Item</p>
                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left text-sm text-brand-sage">
                    <thead className="bg-black/40 text-brand-cream border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Bahan Baku</th>
                        <th className="px-4 py-3 font-semibold text-right">Kuantitas</th>
                        <th className="px-4 py-3 font-semibold text-right">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedPO.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-brand-cream">{item.material?.name || `Material #${item.materialId}`}</td>
                          <td className="px-4 py-3 text-right">{item.quantity} <span className="text-xs text-brand-sage">{item.material?.unit}</span></td>
                          <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-black/40 border-t border-white/10">
                      <tr>
                        <th colSpan={2} className="px-4 py-3 text-right font-bold text-brand-cream uppercase text-xs">Total Pembelian</th>
                        <th className="px-4 py-3 text-right font-bold text-brand-warm">Rp {selectedPO.totalAmount.toLocaleString('id-ID')}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Foto Struk */}
              {selectedPO.receiptUrl && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-brand-sage mb-3 font-bold border-b border-white/10 pb-2">Foto Struk</p>
                  <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedPO.receiptUrl} alt="Struk Pembelian" className="max-w-full max-h-[400px] object-contain" />
                  </div>
                </div>
              )}
              {!selectedPO.receiptUrl && (
                <div className="bg-brand-sage/10 text-brand-sage p-4 rounded-xl text-center text-sm border border-brand-sage/20 border-dashed">
                  Tidak ada foto struk yang dilampirkan pada transaksi ini.
                </div>
              )}

            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 shrink-0 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedPO(null)}>Tutup</Button>
              {selectedPO.status !== 'CANCELLED' && (
                <Button 
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => handleCancelPO(selectedPO.id)}
                  disabled={cancelPurchase.isPending}
                >
                  {cancelPurchase.isPending ? 'Membatalkan...' : 'Batalkan PO'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
