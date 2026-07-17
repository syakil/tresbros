using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialToCalibrationLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaterialId",
                table: "CalibrationLogs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalibrationLogs_MaterialId",
                table: "CalibrationLogs",
                column: "MaterialId");

            migrationBuilder.AddForeignKey(
                name: "FK_CalibrationLogs_Materials_MaterialId",
                table: "CalibrationLogs",
                column: "MaterialId",
                principalTable: "Materials",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CalibrationLogs_Materials_MaterialId",
                table: "CalibrationLogs");

            migrationBuilder.DropIndex(
                name: "IX_CalibrationLogs_MaterialId",
                table: "CalibrationLogs");

            migrationBuilder.DropColumn(
                name: "MaterialId",
                table: "CalibrationLogs");
        }
    }
}
