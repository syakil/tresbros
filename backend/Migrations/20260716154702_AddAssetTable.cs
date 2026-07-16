using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Assets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    PurchaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PurchasePrice = table.Column<double>(type: "double precision", nullable: false),
                    SalvageValue = table.Column<double>(type: "double precision", nullable: false),
                    UsefulLifeInYears = table.Column<int>(type: "integer", nullable: false),
                    AssetAccountId = table.Column<int>(type: "integer", nullable: false),
                    PaymentAccountId = table.Column<int>(type: "integer", nullable: false),
                    AccumulatedDepreciationAccountId = table.Column<int>(type: "integer", nullable: false),
                    DepreciationExpenseAccountId = table.Column<int>(type: "integer", nullable: false),
                    AccumulatedDepreciation = table.Column<double>(type: "double precision", nullable: false),
                    BookValue = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    DisposalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DisposalPrice = table.Column<double>(type: "double precision", nullable: true),
                    DisposalAccountId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assets_ChartOfAccounts_AccumulatedDepreciationAccountId",
                        column: x => x.AccumulatedDepreciationAccountId,
                        principalTable: "ChartOfAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assets_ChartOfAccounts_AssetAccountId",
                        column: x => x.AssetAccountId,
                        principalTable: "ChartOfAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assets_ChartOfAccounts_DepreciationExpenseAccountId",
                        column: x => x.DepreciationExpenseAccountId,
                        principalTable: "ChartOfAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assets_ChartOfAccounts_DisposalAccountId",
                        column: x => x.DisposalAccountId,
                        principalTable: "ChartOfAccounts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Assets_ChartOfAccounts_PaymentAccountId",
                        column: x => x.PaymentAccountId,
                        principalTable: "ChartOfAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });


            migrationBuilder.CreateIndex(
                name: "IX_Assets_AccumulatedDepreciationAccountId",
                table: "Assets",
                column: "AccumulatedDepreciationAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_AssetAccountId",
                table: "Assets",
                column: "AssetAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_DepreciationExpenseAccountId",
                table: "Assets",
                column: "DepreciationExpenseAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_DisposalAccountId",
                table: "Assets",
                column: "DisposalAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_PaymentAccountId",
                table: "Assets",
                column: "PaymentAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assets");


        }
    }
}
