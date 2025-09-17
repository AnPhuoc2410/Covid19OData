using CsvHelper.Configuration.Attributes;
using System.ComponentModel.DataAnnotations;

namespace Covid19.Server.Models
{
    public class CovidDailyReport
    {
        [Key]
        [Name("UID")]
        public long UID { get; set; } // Dùng UID làm khóa chính vì nó là duy nhất

        [Name("Province_State")]
        public string? ProvinceState { get; set; }

        [Name("Country_Region")]
        public string? CountryRegion { get; set; }

        [Name("Last_Update")]
        public DateTime? LastUpdate { get; set; }

        [Name("Lat")]
        public double? Lat { get; set; }

        [Name("Long_")] // Thuộc tính này để map với cột "Long_" trong CSV
        public double? Long { get; set; }

        [Name("Confirmed")]
        public int? Confirmed { get; set; }

        [Name("Deaths")]
        public int? Deaths { get; set; }

        [Name("Recovered")]
        public int? Recovered { get; set; }

        [Name("Active")]
        public int? Active { get; set; }

        [Name("FIPS")]
        public int? FIPS { get; set; }

        [Name("Incident_Rate")]
        public double? IncidentRate { get; set; }

        [Name("Case_Fatality_Ratio")]
        public double? CaseFatalityRatio { get; set; }

        [Name("ISO3")]
        public string? ISO3 { get; set; }

    }
}
