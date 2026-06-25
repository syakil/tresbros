using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO ""Roles"" (""Id"", ""CreatedAt"", ""Description"", ""Name"", ""Permissions"")
                VALUES (1, '2026-01-01T00:00:00Z', 'Akses Penuh', 'Super Admin', '[""dashboard"",""pos"",""kds"",""inventory"",""purchases"",""accounting"",""settings""]')
                ON CONFLICT (""Id"") DO NOTHING;
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""Users"" (""Id"", ""CreatedAt"", ""FullName"", ""IsActive"", ""Password"", ""RoleId"", ""Username"")
                VALUES (1, '2026-01-01T00:00:00Z', 'Administrator', true, 'password', 1, 'admin')
                ON CONFLICT (""Id"") DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
