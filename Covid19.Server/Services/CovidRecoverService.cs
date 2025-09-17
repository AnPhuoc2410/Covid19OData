using Covid19.Server.Models;
using CsvHelper;
using System.Globalization;

namespace Covid19.Server.Services
{
    public class CovidRecoverService
    {
        private static readonly List<CovidRecoverCase> _cache = new List<CovidRecoverCase>();
        private static DateTime _lastFetchTime = DateTime.MinValue;
        private readonly HttpClient _httpClient;
        private const string Covid_Recover = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv";

        public CovidRecoverService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // Dùng cache để không phải tải lại file mỗi lần gọi API
        public async Task<IEnumerable<CovidRecoverCase>> GetRecoverCasesAsync()
        {
            // Cache trong 1 giờ
            if (_cache.Any() && (DateTime.UtcNow - _lastFetchTime).TotalHours < 1)
            {
                return _cache;
            }

            var records = new List<CovidRecoverCase>();
            var response = await _httpClient.GetAsync(Covid_Recover);
            response.EnsureSuccessStatusCode();

            using (var stream = await response.Content.ReadAsStreamAsync())
            using (var reader = new StreamReader(stream))
            using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
            {
                csv.Read();
                csv.ReadHeader();
                var header = csv.HeaderRecord;

                // Lấy các cột ngày tháng (bỏ qua 4 cột đầu tiên)
                var dateColumns = header.Skip(4).ToList();

                while (csv.Read())
                {
                    var provinceState = csv.GetField(0);
                    var countryRegion = csv.GetField(1);
                    var lat = csv.GetField<double?>(2);
                    var lon = csv.GetField<double?>(3);

                    // Lặp qua từng cột ngày tháng để tạo dòng dữ liệu mới
                    foreach (var dateCol in dateColumns)
                    {
                        var recover = csv.GetField<int>(dateCol);

                        records.Add(new CovidRecoverCase
                        {
                            Id = Guid.NewGuid(),
                            ProvinceState = provinceState,
                            CountryRegion = countryRegion,
                            Lat = lat,
                            Long = lon,
                            Date = DateTime.Parse(dateCol, CultureInfo.InvariantCulture),
                            Recovered = recover
                        });
                    }
                }
            }

            _cache.Clear();
            _cache.AddRange(records);
            _lastFetchTime = DateTime.UtcNow;

            return _cache;
        }
    }
}
