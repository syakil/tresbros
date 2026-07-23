import { ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      question: "Bagaimana jika bahan baku di sistem tidak sesuai dengan fisik?",
      answer: "Segera laporkan kepada Manajer atau bagian Gudang untuk dilakukan Penyesuaian Stok (Stock Adjustment) atau Stock Opname."
    },
    {
      question: "Apakah sistem kasir bisa digunakan tanpa internet?",
      answer: "Sistem membutuhkan koneksi internet atau jaringan lokal agar data pesanan bisa langsung masuk ke sistem Dapur (KDS) dan laporan stok bisa sinkron secara real-time."
    },
    {
      question: "Bagaimana cara membatalkan pesanan yang salah input?",
      answer: "Jika pesanan belum diproses oleh dapur, kasir dapat membatalkannya langsung. Jika sudah diproses, hubungi dapur dan manajer untuk pembatalan atau penyesuaian bahan yang terbuang (waste)."
    },
    {
      question: "Apa yang harus dilakukan jika ada pelanggan yang minta tambahan menu setelah bayar?",
      answer: "Buat transaksi baru di sistem POS untuk menu tambahan tersebut agar stok dan laporan keuangan tetap akurat."
    },
    {
      question: "Kenapa pesanan tidak bisa diproses saat input penjualan?",
      answer: "Pastikan stok bahan baku mencukupi. Sistem akan otomatis menolak transaksi jika stok bahan baku di bawah kebutuhan resep."
    }
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar-light bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10 shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Tres Bros - Internal System
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link href="/faq" className="text-blue-600">Panduan & FAQ</Link>
            <Link href="/syarat-ketentuan" className="hover:text-gray-900 transition-colors">Aturan Karyawan</Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-gray-900 transition-colors">SOP Pengembalian</Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Panduan Penggunaan Sistem (FAQ)
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Panduan operasional harian untuk Kasir, Barista, dan Staf Dapur.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-1.5">
                <h2 className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </h2>
                <span className="shrink-0 rounded-full bg-gray-100 p-1.5 text-gray-900 sm:p-3">
                  <ChevronDown className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" />
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-gray-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-2xl p-8 text-center border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mengalami masalah sistem?</h3>
          <p className="text-gray-600 mb-6">Segera hubungi tim IT Support atau Manajer shift Anda.</p>
        </div>
      </main>
    </div>
  );
}
