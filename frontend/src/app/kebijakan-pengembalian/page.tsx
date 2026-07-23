import { RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar-light bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10 shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Tres Bros - Internal System
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link href="/faq" className="hover:text-gray-900 transition-colors">Panduan & FAQ</Link>
            <Link href="/syarat-ketentuan" className="hover:text-gray-900 transition-colors">Aturan Karyawan</Link>
            <Link href="/kebijakan-pengembalian" className="text-blue-600">SOP Pengembalian</Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <RefreshCcw className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            SOP Pengembalian (Void & Refund)
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Prosedur Penanganan Komplain dan Pengembalian Transaksi Pelanggan
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 prose prose-blue max-w-none text-gray-600">
          <p className="text-lg">
            Dokumen ini merupakan panduan bagi kasir dan manajer dalam menangani permintaan pengembalian dana (refund) atau pembatalan transaksi (void) dari pelanggan Tres Bros Caffè.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Void Transaksi (Pembatalan Order)</h2>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li><strong>Sebelum Dibayar:</strong> Kasir dapat membatalkan item secara langsung di layar POS.</li>
            <li><strong>Sudah Dibayar, Belum Dibuat:</strong> Kasir dapat melakukan Void pada sistem dengan persetujuan (PIN/Otorisasi) Manajer Shift. Dana dikembalikan secara tunai atau ditransfer sesuai kebijakan outlet.</li>
            <li><strong>Sudah Dibuat / Disajikan:</strong> Order tidak dapat di-void secara sepihak. Jika ada kesalahan, masukkan sebagai "Waste" dan buat order pengganti.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Refund (Pengembalian Dana) Pelanggan</h2>
          <p className="mb-4">
            Refund kepada pelanggan HANYA dapat diberikan dalam kondisi berikut:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Kualitas produk sangat tidak sesuai (basi, kotor, atau rusak) dan pelanggan menolak produk pengganti.</li>
            <li>Terjadi kesalahan teknis penggesekan mesin EDC / QRIS (double charge).</li>
            <li>Item yang dipesan ternyata kehabisan stok setelah pembayaran dilakukan.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Prosedur Retur Produk (Waste)</h2>
          <p className="mb-4">
            Setiap produk yang dibuat salah oleh barista atau dikembalikan oleh pelanggan harus dicatat sebagai <strong>Waste</strong> di sistem agar stok sesuai:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Jangan membuang fisik barang sebelum dicatat oleh manajer.</li>
            <li>Pilih opsi "Input Waste" pada menu Inventory.</li>
            <li>Masukkan alasan detail (contoh: "Tumpah oleh staf", "Komplain pelanggan", "Salah resep").</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
