using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCalibrationTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalibrationLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Shift = table.Column<string>(type: "text", nullable: false),
                    BaristaName = table.Column<string>(type: "text", nullable: false),
                    BeansName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalibrationLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CalibrationTrials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CalibrationLogId = table.Column<int>(type: "integer", nullable: false),
                    TrialNumber = table.Column<int>(type: "integer", nullable: false),
                    GrindSize = table.Column<string>(type: "text", nullable: false),
                    Dose = table.Column<double>(type: "double precision", nullable: false),
                    Yield = table.Column<double>(type: "double precision", nullable: false),
                    Time = table.Column<int>(type: "integer", nullable: false),
                    Sweetness = table.Column<bool>(type: "boolean", nullable: false),
                    Body = table.Column<bool>(type: "boolean", nullable: false),
                    Clean = table.Column<bool>(type: "boolean", nullable: false),
                    MilkMatch = table.Column<bool>(type: "boolean", nullable: false),
                    Passed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalibrationTrials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalibrationTrials_CalibrationLogs_CalibrationLogId",
                        column: x => x.CalibrationLogId,
                        principalTable: "CalibrationLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalibrationTrials_CalibrationLogId",
                table: "CalibrationTrials",
                column: "CalibrationLogId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalibrationTrials");

            migrationBuilder.DropTable(
                name: "CalibrationLogs");
        }
    }
}
