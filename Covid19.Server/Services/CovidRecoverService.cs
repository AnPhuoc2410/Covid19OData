using Covid19.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Covid19.Server.Services
{
    public class CovidRecoverService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private const string Covid_Recover = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv";

        public CovidRecoverService(ApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<IEnumerable<CovidRecoverCase>> GetRecoverCasesAsync()
        {
            return await _context.CovidRecoverCases.AsNoTracking().ToListAsync();
        }

        public async Task SeedDataFromCsvAsync()
        {
            if (await _context.CovidRecoverCases.AnyAsync()) return;

            var records = new List<CovidRecoverCase>();
            var response = await _httpClient.GetAsync(Covid_Recover);
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
                        var recover = csv.GetField<int>(dateCol);

                        records.Add(new CovidRecoverCase
                        {
                            Id = Guid.NewGuid(),
                            ProvinceState = provinceState,
                            CountryRegion = countryRegion,
                            Lat = lat,
                            Long = lon,
                            Date = DateTime.Parse(dateCol, System.Globalization.CultureInfo.InvariantCulture).ToUniversalTime(),
                            Recovered = recover
                        });
                    }
                }
            }

            await _context.CovidRecoverCases.AddRangeAsync(records);
            await _context.SaveChangesAsync();
        }
    }
}
