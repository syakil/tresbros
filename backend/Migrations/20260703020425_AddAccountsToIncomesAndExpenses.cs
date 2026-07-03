using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountsToIncomesAndExpenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccountId",
                table: "Incomes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentAccountId",
                table: "Incomes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AccountId",
                table: "Expenses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentAccountId",
                table: "Expenses",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incomes_AccountId",
                table: "Incomes",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Incomes_PaymentAccountId",
                table: "Incomes",
                column: "PaymentAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_AccountId",
                table: "Expenses",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_PaymentAccountId",
                table: "Expenses",
                column: "PaymentAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_ChartOfAccounts_AccountId",
                table: "Expenses",
                column: "AccountId",
                principalTable: "ChartOfAccounts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_ChartOfAccounts_PaymentAccountId",
                table: "Expenses",
                column: "PaymentAccountId",
                principalTable: "ChartOfAccounts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Incomes_ChartOfAccounts_AccountId",
                table: "Incomes",
                column: "AccountId",
                principalTable: "ChartOfAccounts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Incomes_ChartOfAccounts_PaymentAccountId",
                table: "Incomes",
                column: "PaymentAccountId",
                principalTable: "ChartOfAccounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_ChartOfAccounts_AccountId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_ChartOfAccounts_PaymentAccountId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_Incomes_ChartOfAccounts_AccountId",
                table: "Incomes");

            migrationBuilder.DropForeignKey(
                name: "FK_Incomes_ChartOfAccounts_PaymentAccountId",
                table: "Incomes");

            migrationBuilder.DropIndex(
                name: "IX_Incomes_AccountId",
                table: "Incomes");

            migrationBuilder.DropIndex(
                name: "IX_Incomes_PaymentAccountId",
                table: "Incomes");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_AccountId",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_PaymentAccountId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "Incomes");

            migrationBuilder.DropColumn(
                name: "PaymentAccountId",
                table: "Incomes");

            migrationBuilder.DropColumn(
                name: "AccountId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "PaymentAccountId",
                table: "Expenses");
        }
    }
}
