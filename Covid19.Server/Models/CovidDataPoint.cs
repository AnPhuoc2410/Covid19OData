using System.ComponentModel.DataAnnotations;

namespace Covid19.Server.Models
{
    public class CovidDataPoint
    {
        [Key]
        public Guid Id { get; set; }
        public string? ProvinceState { get; set; }
        public string CountryRegion { get; set; }
        public double? Lat { get; set; }
        public double? Long { get; set; }
        public DateTime Date { get; set; }

        // Các trường dữ liệu được gộp từ 3 file
        public int Confirmed { get; set; }
        public int Deaths { get; set; }
        public int Recovered { get; set; }
    }
}
