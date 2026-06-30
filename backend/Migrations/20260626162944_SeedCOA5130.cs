using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedCOA5130 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ChartOfAccounts",
                columns: new[] { "Id", "Balance", "Code", "IsActive", "Name", "Type" },
                values: new object[] { 14, 0.0, "5130", true, "Penyesuaian Persediaan", "EXPENSE" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ChartOfAccounts",
                keyColumn: "Id",
                keyValue: 14);
        }
    }
}
