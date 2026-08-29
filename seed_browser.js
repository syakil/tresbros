const coas = [
  { code: "1110", name: "Kas Kecil (Cash on Hand)", type: "ASSET", isActive: true },
  { code: "1120", name: "Piutang Payment Gateway (Midtrans)", type: "ASSET", isActive: true },
  { code: "1130", name: "Kas di Bank", type: "ASSET", isActive: true },
  { code: "1140", name: "Persediaan Bahan Baku", type: "ASSET", isActive: true },
  { code: "2110", name: "Hutang Usaha (AP)", type: "LIABILITY", isActive: true },
  { code: "2120", name: "Hutang Pajak (PB1)", type: "LIABILITY", isActive: true },
  { code: "3110", name: "Modal Pemilik", type: "EQUITY", isActive: true },
  { code: "3120", name: "Laba Ditahan", type: "EQUITY", isActive: true },
  { code: "4110", name: "Pendapatan Penjualan", type: "REVENUE", isActive: true },
  { code: "4120", name: "Diskon & Promo", type: "REVENUE", isActive: true },
  { code: "5110", name: "Harga Pokok Penjualan (HPP)", type: "EXPENSE", isActive: true },
  { code: "5120", name: "Biaya Admin Payment Gateway", type: "EXPENSE", isActive: true },
  { code: "6110", name: "Beban Operasional", type: "EXPENSE", isActive: true },
  { code: "5130", name: "Penyesuaian Persediaan", type: "EXPENSE", isActive: true }
];

async function seedCOA() {
  for (const coa of coas) {
    const res = await fetch("/api/accounting/coa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coa)
    });
    if (res.ok) {
      console.log(`Berhasil insert: ${coa.code} - ${coa.name}`);
    } else {
      console.error(`Gagal insert: ${coa.code}`);
    }
  }
  alert("Proses Insert Selesai! Silakan refresh halaman.");
}

seedCOA();
