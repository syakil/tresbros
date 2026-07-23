import { FileText } from "lucide-react";
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Tres Bros
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
            <Link href="/syarat-ketentuan" className="text-blue-600">Syarat & Ketentuan</Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-gray-900 transition-colors">Kebijakan Pengembalian</Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Syarat & Ketentuan
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Pembaruan Terakhir: 23 Juli 2026
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 prose prose-blue max-w-none text-gray-600">
          <p>
            Selamat datang di layanan Tres Bros. Dengan mengakses atau menggunakan aplikasi kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan berikut. Harap membacanya dengan saksama.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Penggunaan Layanan</h2>
          <p className="mb-4">
            Layanan kami ditujukan untuk digunakan oleh bisnis di bidang makanan dan minuman. Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah dan sesuai dengan hukum yang berlaku.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Akun Pengguna</h2>
          <p className="mb-4">
            Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi akun Anda. Anda juga bertanggung jawab atas setiap kegiatan yang terjadi di bawah akun Anda.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Pembayaran dan Berlangganan</h2>
          <p className="mb-4">
            Biaya layanan kami akan ditagihkan sesuai dengan paket berlangganan yang Anda pilih. Kami berhak mengubah harga layanan kapan saja, namun kami akan memberitahukannya kepada Anda sebelumnya.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Batasan Tanggung Jawab</h2>
          <p className="mb-4">
            Kami tidak bertanggung jawab atas kerugian langsung, tidak langsung, atau insidental yang mungkin timbul dari penggunaan atau ketidakmampuan Anda untuk menggunakan layanan kami, termasuk namun tidak terbatas pada hilangnya data atau keuntungan.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Perubahan Syarat & Ketentuan</h2>
          <p className="mb-4">
            Kami dapat merevisi Syarat & Ketentuan ini dari waktu ke waktu. Pembaruan akan segera berlaku setelah dipublikasikan pada halaman ini. Anda diwajibkan untuk memeriksa halaman ini secara berkala.
          </p>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-sm">
              Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami di <a href="mailto:legal@tresbros.com" className="text-blue-600 hover:underline">legal@tresbros.com</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
