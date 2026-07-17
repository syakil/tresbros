using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddClosingPeriod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.CreateTable(
                name: "ClosingPeriods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PeriodType = table.Column<string>(type: "text", nullable: false),
                    PeriodDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedBy = table.Column<string>(type: "text", nullable: false),
                    TotalRevenue = table.Column<double>(type: "double precision", nullable: false),
                    TotalExpense = table.Column<double>(type: "double precision", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClosingPeriods", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClosingPeriods");

            migrationBuilder.InsertData(
                table: "ChartOfAccounts",
                columns: new[] { "Id", "Balance", "Code", "IsActive", "Name", "Type" },
                values: new object[,]
                {
                    { 1, 0.0, "1110", true, "Kas Kecil (Cash on Hand)", "ASSET" },
                    { 2, 0.0, "1120", true, "Piutang Payment Gateway (Midtrans)", "ASSET" },
                    { 3, 0.0, "1130", true, "Kas di Bank", "ASSET" },
                    { 4, 0.0, "1140", true, "Persediaan Bahan Baku", "ASSET" },
                    { 5, 0.0, "2110", true, "Hutang Usaha (AP)", "LIABILITY" },
                    { 6, 0.0, "2120", true, "Hutang Pajak (PB1)", "LIABILITY" },
                    { 7, 0.0, "3110", true, "Modal Pemilik", "EQUITY" },
                    { 8, 0.0, "3120", true, "Laba Ditahan", "EQUITY" },
                    { 9, 0.0, "4110", true, "Pendapatan Penjualan", "REVENUE" },
                    { 10, 0.0, "4120", true, "Diskon & Promo", "REVENUE" },
                    { 11, 0.0, "5110", true, "Harga Pokok Penjualan (HPP)", "EXPENSE" },
                    { 12, 0.0, "5120", true, "Biaya Admin Payment Gateway", "EXPENSE" },
                    { 13, 0.0, "6110", true, "Beban Operasional", "EXPENSE" },
                    { 14, 0.0, "5130", true, "Penyesuaian Persediaan", "EXPENSE" },
                    { 15, 0.0, "1200", true, "Aset Tetap", "ASSET" },
                    { 16, 0.0, "1250", true, "Akumulasi Penyusutan Aset Tetap", "ASSET" },
                    { 17, 0.0, "6140", true, "Beban Penyusutan Aset Tetap", "EXPENSE" },
                    { 18, 0.0, "6150", true, "Keuntungan/Kerugian Pelepasan Aset", "EXPENSE" }
                });
        }
    }
}
