using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRnDTestHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RnDTestHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RnDRecipeId = table.Column<int>(type: "integer", nullable: false),
                    TestVersion = table.Column<string>(type: "text", nullable: false),
                    IngredientsSnapshot = table.Column<string>(type: "text", nullable: false),
                    ActualCost = table.Column<double>(type: "double precision", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    TestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RnDTestHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RnDTestHistories_RnDRecipes_RnDRecipeId",
                        column: x => x.RnDRecipeId,
                        principalTable: "RnDRecipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RnDTestHistories_RnDRecipeId",
                table: "RnDTestHistories",
                column: "RnDRecipeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RnDTestHistories");
        }
    }
}
