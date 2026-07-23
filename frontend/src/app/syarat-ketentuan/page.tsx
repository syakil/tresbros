import { FileText } from "lucide-react";
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar-light bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10 shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Tres Bros - Internal System
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link href="/faq" className="hover:text-gray-900 transition-colors">Panduan & FAQ</Link>
            <Link href="/syarat-ketentuan" className="text-blue-600">Aturan Karyawan</Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-gray-900 transition-colors">SOP Pengembalian</Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Ketentuan Penggunaan Sistem
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Aturan dan tata tertib karyawan Tres Bros Caffè
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 prose prose-blue max-w-none text-gray-600">
          <p>
            Sistem Point of Sale (POS), Inventory, dan Kitchen Display System (KDS) ini adalah milik eksklusif Tres Bros Caffè. Setiap staf yang memiliki akses wajib mematuhi aturan berikut.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Kerahasiaan Data (Data Confidentiality)</h2>
          <p className="mb-4">
            Semua data yang ada di dalam sistem (termasuk resep, omset penjualan, harga HPP, dan data pelanggan) bersifat rahasia. Karyawan dilarang keras menyebarkan atau membagikan data tersebut kepada pihak luar tanpa izin tertulis dari manajemen.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Penggunaan Akun</h2>
          <p className="mb-4">
            Setiap karyawan memiliki kredensial login (username dan password) masing-masing. Dilarang saling meminjamkan akun atau menggunakan akun staf lain untuk melakukan transaksi. Tindakan yang dilakukan oleh akun Anda menjadi tanggung jawab Anda sepenuhnya.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Integritas Transaksi</h2>
          <p className="mb-4">
            Semua transaksi masuk dan keluar, baik penjualan maupun pembelian stok, wajib diinput secara real-time ke dalam sistem. Kesengajaan memanipulasi stok, tidak menginput penjualan, atau menghapus data transaksi tanpa prosedur yang sah akan dikenakan sanksi tegas hingga pemecatan.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Penanganan Error & Kendala</h2>
          <p className="mb-4">
            Apabila terjadi masalah pada sistem, kasir atau staf dapur dilarang mencoba mengubah pengaturan konfigurasi server atau jaringan. Segera laporkan kendala ke Manajer Shift atau IT Support.
          </p>
        </div>
      </main>
    </div>
  );
}
