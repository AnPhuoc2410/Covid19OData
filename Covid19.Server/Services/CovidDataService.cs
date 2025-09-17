namespace Covid19.Server.Services
{
    using Covid19.Server.Models;
    using CsvHelper;
    using CsvHelper.Configuration;
    using System.Formats.Asn1;
    using System.Globalization;
    using System.Net.Http;

    public class CovidDataService
    {
        private static readonly List<CovidConfirmedCase> _cache = new List<CovidConfirmedCase>();
        private static DateTime _lastFetchTime = DateTime.MinValue;
        private readonly HttpClient _httpClient;
        private const string DataUrl = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";

        public CovidDataService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // Dùng cache để không phải tải lại file mỗi lần gọi API
        public async Task<IEnumerable<CovidConfirmedCase>> GetConfirmedCasesAsync()
        {
            // Cache trong 1 giờ
            if (_cache.Any() && (DateTime.UtcNow - _lastFetchTime).TotalHours < 1)
            {
                return _cache;
            }

            var records = new List<CovidConfirmedCase>();
            var response = await _httpClient.GetAsync(DataUrl);
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
                    for (int i = 0; i < dateColumns.Count; i++)
                    {
                        var dateString = dateColumns[i];
                        var confirmedCount = csv.GetField<int>(i + 4); // +4 để bắt đầu từ cột dữ liệu

                        records.Add(new CovidConfirmedCase
                        {
                            Id = Guid.NewGuid(),
                            ProvinceState = provinceState,
                            CountryRegion = countryRegion,
                            Lat = lat,
                            Long = lon,
                            Date = DateTime.Parse(dateString, CultureInfo.InvariantCulture),
                            Confirmed = confirmedCount
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
