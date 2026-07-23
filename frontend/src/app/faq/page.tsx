import { ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      question: "Bagaimana cara mendaftar akun Tres Bros?",
      answer: "Anda dapat menghubungi tim sales kami atau mendaftar langsung melalui halaman utama."
    },
    {
      question: "Apakah sistem kasir bisa digunakan secara offline?",
      answer: "Untuk saat ini, sistem kami membutuhkan koneksi internet agar data penjualan bisa sinkron secara real-time."
    },
    {
      question: "Bagaimana cara melakukan pembayaran?",
      answer: "Kami menerima berbagai metode pembayaran termasuk transfer bank, e-wallet (OVO, GoPay, Dana), dan QRIS."
    },
    {
      question: "Apakah saya bisa mengubah pesanan yang sudah diproses?",
      answer: "Pesanan yang sudah diproses ke dapur tidak dapat dibatalkan melalui sistem kasir. Mohon hubungi manajer restoran untuk pembatalan manual."
    },
    {
      question: "Apakah data saya aman?",
      answer: "Tentu. Kami menggunakan enkripsi standar industri untuk melindungi seluruh data pelanggan dan transaksi Anda."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Tres Bros
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link href="/faq" className="text-blue-600">FAQ</Link>
            <Link href="/syarat-ketentuan" className="hover:text-gray-900 transition-colors">Syarat & Ketentuan</Link>
            <Link href="/kebijakan-pengembalian" className="hover:text-gray-900 transition-colors">Kebijakan Pengembalian</Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Temukan jawaban untuk pertanyaan umum seputar layanan Tres Bros.
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Masih butuh bantuan?</h3>
          <p className="text-gray-600 mb-6">Tim dukungan pelanggan kami siap membantu Anda.</p>
          <a href="mailto:support@tresbros.com" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Hubungi Kami
          </a>
        </div>
      </main>
    </div>
  );
}
