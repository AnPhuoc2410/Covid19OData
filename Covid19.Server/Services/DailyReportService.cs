using Covid19.Server.Models;
using CsvHelper;
using System.Globalization;
using System.Net;

namespace Covid19.Server.Services
{
    public class DailyReportService
    {
        private readonly HttpClient _httpClient;
        private const string BaseUrl =
            "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports_us/";

        public DailyReportService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // Trả về tổng hợp toàn bộ US thành 1 record duy nhất
        public async Task<CovidDailyReport?> GetUsSummaryAsync(DateOnly date)
        {
            string formattedDate = date.ToString("MM-dd-yyyy");
            string requestUrl = $"{BaseUrl}{formattedDate}.csv";

            try
            {
                var response = await _httpClient.GetAsync(requestUrl);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync();
                using var reader = new StreamReader(stream);
                using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

                var records = csv.GetRecords<CovidDailyReport>().ToList();

                if (!records.Any()) return null;

                // Gộp tất cả bang của US thành 1
                return new CovidDailyReport
                {
                    UID = 840, // UID tổng hợp US
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
                    IncidentRate = null, // không tính trung bình
                    CaseFatalityRatio = (records.Sum(r => r.Deaths ?? 0) /
                                         Math.Max(records.Sum(r => r.Confirmed ?? 0), 1)) * 100,
                    ISO3 = "USA"
                };
            }
            catch (HttpRequestException)
            {
                return null;
            }
        }
    }
}
