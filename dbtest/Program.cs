using System;
using System.IO;
using System.Text.Json;
using Npgsql;

class Program
{
    static void Main()
    {
        string appSettingsPath = Path.Combine("..", "backend", "appsettings.json");
        string json = File.ReadAllText(appSettingsPath);
        using var doc = JsonDocument.Parse(json);
        string connStr = doc.RootElement.GetProperty("ConnectionStrings").GetProperty("DefaultConnection").GetString();

        using var conn = new NpgsqlConnection(connStr);
        conn.Open();

        string sql = @"
            INSERT INTO ""ChartOfAccounts"" (""Id"", ""Balance"", ""Code"", ""IsActive"", ""Name"", ""Type"") VALUES 
            (1, 0.0, '1110', TRUE, 'Kas Kecil (Cash on Hand)', 'ASSET'),
            (2, 0.0, '1120', TRUE, 'Piutang Payment Gateway (Midtrans)', 'ASSET'),
            (3, 0.0, '1130', TRUE, 'Kas di Bank', 'ASSET'),
            (4, 0.0, '1140', TRUE, 'Persediaan Bahan Baku', 'ASSET'),
            (5, 0.0, '2110', TRUE, 'Hutang Usaha (AP)', 'LIABILITY'),
            (6, 0.0, '2120', TRUE, 'Hutang Pajak (PB1)', 'LIABILITY'),
            (7, 0.0, '3110', TRUE, 'Modal Pemilik', 'EQUITY'),
            (8, 0.0, '3120', TRUE, 'Laba Ditahan', 'EQUITY'),
            (9, 0.0, '4110', TRUE, 'Pendapatan Penjualan', 'REVENUE'),
            (10, 0.0, '4120', TRUE, 'Diskon & Promo', 'REVENUE'),
            (11, 0.0, '5110', TRUE, 'Harga Pokok Penjualan (HPP)', 'EXPENSE'),
            (12, 0.0, '5120', TRUE, 'Biaya Admin Payment Gateway', 'EXPENSE'),
            (13, 0.0, '6110', TRUE, 'Beban Operasional', 'EXPENSE'),
            (14, 0.0, '5130', TRUE, 'Penyesuaian Persediaan', 'EXPENSE')
            ON CONFLICT (""Id"") DO NOTHING;
            
            SELECT setval('""ChartOfAccounts_Id_seq""', (SELECT MAX(""Id"") FROM ""ChartOfAccounts""));
        ";

        using var cmd = new NpgsqlCommand(sql, conn);
        int rows = cmd.ExecuteNonQuery();
        Console.WriteLine($"Restored COA successfully! Inserted {rows} rows.");
    }
}
