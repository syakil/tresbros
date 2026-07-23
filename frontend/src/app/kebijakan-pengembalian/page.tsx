import { RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Tres Bros
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
            <Link href="/syarat-ketentuan" className="hover:text-gray-900 transition-colors">Syarat & Ketentuan</Link>
            <Link href="/kebijakan-pengembalian" className="text-blue-600">Kebijakan Pengembalian</Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <RefreshCcw className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Kebijakan Pengembalian Dana (Refund Policy)
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Pembaruan Terakhir: 23 Juli 2026
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 prose prose-blue max-w-none text-gray-600">
          <p className="text-lg">
            Kepuasan pelanggan adalah prioritas utama kami di Tres Bros. Oleh karena itu, kami menetapkan kebijakan pengembalian dana yang jelas untuk menjaga transparansi dan kepercayaan.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Kondisi Pengembalian Dana</h2>
          <p className="mb-4">
            Pengembalian dana (refund) dapat diproses jika memenuhi salah satu dari kondisi berikut:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Terjadi kesalahan penagihan ganda (double charge) pada sistem pembayaran kami.</li>
            <li>Layanan mengalami gangguan (downtime) melebihi SLA yang dijanjikan, sehingga layanan tidak dapat digunakan sama sekali selama lebih dari 48 jam berturut-turut.</li>
            <li>Anda memutuskan untuk membatalkan langganan dalam waktu 7 hari sejak pembelian pertama kali (Hanya berlaku untuk pelanggan baru).</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Proses Pengajuan Pengembalian Dana</h2>
          <p className="mb-4">
            Untuk mengajukan pengembalian dana, Anda harus mengirimkan email ke <a href="mailto:support@tresbros.com" className="text-blue-600 hover:underline">support@tresbros.com</a> dengan menyertakan detail berikut:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Nama Lengkap dan Nama Perusahaan</li>
            <li>Nomor Invoice atau Bukti Pembayaran</li>
            <li>Alasan pengajuan pengembalian dana</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Waktu Proses</h2>
          <p className="mb-4">
            Setelah pengajuan Anda diterima dan disetujui, kami akan memproses pengembalian dana dalam waktu 7-14 hari kerja. Dana akan dikembalikan ke metode pembayaran awal yang Anda gunakan.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Pengecualian</h2>
          <p className="mb-4">
            Pengembalian dana tidak berlaku untuk:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Pelanggaran Syarat & Ketentuan yang mengakibatkan penghentian akun.</li>
            <li>Pembatalan berlangganan di tengah periode tagihan yang sedang berjalan (kecuali dalam masa 7 hari garansi pelanggan baru).</li>
            <li>Biaya implementasi, pelatihan, atau kustomisasi yang telah dilakukan.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
