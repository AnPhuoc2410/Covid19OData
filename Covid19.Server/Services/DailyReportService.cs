using Covid19.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Covid19.Server.Services
{
    public class DailyReportService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private const string BaseUrl =
            "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports_us/";

        public DailyReportService(ApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<CovidDailyReport?> GetUsSummaryAsync(DateOnly date)
        {
            // Query từ DB nếu có
            var report = await _context.CovidDailyReports.FirstOrDefaultAsync(r => r.LastUpdate.HasValue && r.LastUpdate.Value.Date == date.ToDateTime(TimeOnly.MinValue));
            if (report != null) return report;

            // Nếu không có, tải từ CSV và lưu
            string formattedDate = date.ToString("MM-dd-yyyy");
            string requestUrl = $"{BaseUrl}{formattedDate}.csv";

            try
            {
                var response = await _httpClient.GetAsync(requestUrl);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return null;
                }

                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync();
                using var reader = new StreamReader(stream);
                using var csv = new CsvHelper.CsvReader(reader, System.Globalization.CultureInfo.InvariantCulture);

                var records = csv.GetRecords<CovidDailyReport>().ToList();

                if (!records.Any()) return null;

                var newReport = new CovidDailyReport
                {
                    UID = 840,
                    ProvinceState = null,
                    CountryRegion = "US",
                    LastUpdate = records.Max(r => r.LastUpdate),
                    Lat = null,
                    Long = null,
                    Confirmed = records.Sum(r => r.Confirmed ?? 0),
                    Deaths = records.Sum(r => r.Deaths ?? 0),
                    Recovered = records.Sum(r => r.Recovered ?? 0),
                    Active = records.Sum(r => r.Active ?? 0),
                    FIPS = null,
                    IncidentRate = null,
                    CaseFatalityRatio = (records.Sum(r => r.Deaths ?? 0) /
                                         Math.Max(records.Sum(r => r.Confirmed ?? 0), 1)) * 100,
                    ISO3 = "USA"
                };

                // Lưu vào DB
                _context.CovidDailyReports.Add(newReport);
                await _context.SaveChangesAsync();

                return newReport;
            }
            catch (HttpRequestException)
            {
                return null;
            }
        }
    }
}
