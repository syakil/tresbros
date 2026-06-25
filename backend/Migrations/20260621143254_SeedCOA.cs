using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedCOA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
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
                (13, 0.0, '6110', TRUE, 'Beban Operasional', 'EXPENSE')
                ON CONFLICT (""Id"") DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 13);
        }
    }
}
