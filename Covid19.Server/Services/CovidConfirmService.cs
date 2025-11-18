using Covid19.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Covid19.Server.Services
{

    public class CovidConfirmService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private const string Covid_Confirm = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";


        public CovidConfirmService(ApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<IEnumerable<CovidConfirmedCase>> GetConfirmedCasesAsync()
        {
            return await _context.CovidConfirmedCases.AsNoTracking().ToListAsync();
        }

        public async Task SeedDataFromCsvAsync()
        {
            if (await _context.CovidConfirmedCases.AnyAsync()) return; // Đã có dữ liệu

            var records = new List<CovidConfirmedCase>();
            var response = await _httpClient.GetAsync(Covid_Confirm);
            response.EnsureSuccessStatusCode();

            using (var stream = await response.Content.ReadAsStreamAsync())
            using (var reader = new StreamReader(stream))
            using (var csv = new CsvHelper.CsvReader(reader, System.Globalization.CultureInfo.InvariantCulture))
            {
                csv.Read();
                csv.ReadHeader();
                var header = csv.HeaderRecord;

                var dateColumns = header.Skip(4).ToList();

                while (csv.Read())
                {
                    var provinceState = csv.GetField(0);
                    var countryRegion = csv.GetField(1);
                    var lat = csv.GetField<double?>(2);
                    var lon = csv.GetField<double?>(3);

                    foreach (var dateCol in dateColumns)
                    {
                        var confirmed = csv.GetField<int>(dateCol);

                        records.Add(new CovidConfirmedCase
                        {
                            Id = Guid.NewGuid(),
                            ProvinceState = provinceState,
                            CountryRegion = countryRegion,
                            Lat = lat,
                            Long = lon,
                            Date = DateTime.Parse(dateCol, System.Globalization.CultureInfo.InvariantCulture).ToUniversalTime(),
                            Confirmed = confirmed
                        });
                    }
                }
            }

            await _context.CovidConfirmedCases.AddRangeAsync(records);
            await _context.SaveChangesAsync();
        }
    }
}
