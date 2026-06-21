const coas = [
  { Code: "1110", Name: "Kas Kecil (Cash on Hand)", Type: "ASSET", IsActive: true },
  { Code: "1120", Name: "Piutang Payment Gateway (Midtrans)", Type: "ASSET", IsActive: true },
  { Code: "1130", Name: "Kas di Bank", Type: "ASSET", IsActive: true },
  { Code: "1140", Name: "Persediaan Bahan Baku", Type: "ASSET", IsActive: true },
  { Code: "2110", Name: "Hutang Usaha (AP)", Type: "LIABILITY", IsActive: true },
  { Code: "2120", Name: "Hutang Pajak (PB1)", Type: "LIABILITY", IsActive: true },
  { Code: "3110", Name: "Modal Pemilik", Type: "EQUITY", IsActive: true },
  { Code: "3120", Name: "Laba Ditahan", Type: "EQUITY", IsActive: true },
  { Code: "4110", Name: "Pendapatan Penjualan", Type: "REVENUE", IsActive: true },
  { Code: "4120", Name: "Diskon & Promo", Type: "REVENUE", IsActive: true },
  { Code: "5110", Name: "Harga Pokok Penjualan (HPP)", Type: "EXPENSE", IsActive: true },
  { Code: "5120", Name: "Biaya Admin Payment Gateway", Type: "EXPENSE", IsActive: true },
  { Code: "6110", Name: "Beban Operasional", Type: "EXPENSE", IsActive: true }
];

async function seed() {
  for (const coa of coas) {
    const res = await fetch("http://localhost:5052/api/Accounting/COA", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coa)
    });
    if (res.ok) {
      console.log(`Added: ${coa.Code} - ${coa.Name}`);
    } else {
      console.error(`Failed to add: ${coa.Code}`, await res.text());
    }
  }
}

seed();
