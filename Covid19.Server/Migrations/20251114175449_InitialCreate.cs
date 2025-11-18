using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Covid19.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CovidConfirmedCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvinceState = table.Column<string>(type: "text", nullable: true),
                    CountryRegion = table.Column<string>(type: "text", nullable: false),
                    Lat = table.Column<double>(type: "double precision", nullable: true),
                    Long = table.Column<double>(type: "double precision", nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Confirmed = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CovidConfirmedCases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CovidDailyReports",
                columns: table => new
                {
                    UID = table.Column<double>(type: "double precision", nullable: false),
                    ProvinceState = table.Column<string>(type: "text", nullable: true),
                    CountryRegion = table.Column<string>(type: "text", nullable: true),
                    LastUpdate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Lat = table.Column<double>(type: "double precision", nullable: true),
                    Long = table.Column<double>(type: "double precision", nullable: true),
                    Confirmed = table.Column<double>(type: "double precision", nullable: true),
                    Deaths = table.Column<double>(type: "double precision", nullable: true),
                    Recovered = table.Column<double>(type: "double precision", nullable: true),
                    Active = table.Column<double>(type: "double precision", nullable: true),
                    FIPS = table.Column<double>(type: "double precision", nullable: true),
                    IncidentRate = table.Column<double>(type: "double precision", nullable: true),
                    CaseFatalityRatio = table.Column<double>(type: "double precision", nullable: true),
                    ISO3 = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CovidDailyReports", x => x.UID);
                });

            migrationBuilder.CreateTable(
                name: "CovidDataPoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvinceState = table.Column<string>(type: "text", nullable: true),
                    CountryRegion = table.Column<string>(type: "text", nullable: false),
                    Lat = table.Column<double>(type: "double precision", nullable: true),
                    Long = table.Column<double>(type: "double precision", nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Confirmed = table.Column<int>(type: "integer", nullable: false),
                    Deaths = table.Column<int>(type: "integer", nullable: false),
                    Recovered = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CovidDataPoints", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CovidDeathCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvinceState = table.Column<string>(type: "text", nullable: true),
                    CountryRegion = table.Column<string>(type: "text", nullable: false),
                    Lat = table.Column<double>(type: "double precision", nullable: true),
                    Long = table.Column<double>(type: "double precision", nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Deaths = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CovidDeathCases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CovidRecoverCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProvinceState = table.Column<string>(type: "text", nullable: true),
                    CountryRegion = table.Column<string>(type: "text", nullable: false),
                    Lat = table.Column<double>(type: "double precision", nullable: true),
                    Long = table.Column<double>(type: "double precision", nullable: true),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Recovered = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CovidRecoverCases", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CovidConfirmedCases");

            migrationBuilder.DropTable(
                name: "CovidDailyReports");

            migrationBuilder.DropTable(
                name: "CovidDataPoints");

            migrationBuilder.DropTable(
                name: "CovidDeathCases");

            migrationBuilder.DropTable(
                name: "CovidRecoverCases");
        }
    }
}
