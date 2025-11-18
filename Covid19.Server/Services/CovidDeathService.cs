using Covid19.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Covid19.Server.Services
{
    public class CovidDeathService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private const string Covid_Death = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv";


        public CovidDeathService(ApplicationDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task<IEnumerable<CovidDeathCase>> GetDeathServicesAsync()
        {
            return await _context.CovidDeathCases.AsNoTracking().ToListAsync();
        }

        public async Task SeedDataFromCsvAsync()
        {
            if (await _context.CovidDeathCases.AnyAsync()) return;

            var records = new List<CovidDeathCase>();
            var response = await _httpClient.GetAsync(Covid_Death);
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
                        var death = csv.GetField<int>(dateCol);

                        records.Add(new CovidDeathCase
                        {
                            Id = Guid.NewGuid(),
                            ProvinceState = provinceState,
                            CountryRegion = countryRegion,
                            Lat = lat,
                            Long = lon,
                            Date = DateTime.Parse(dateCol, System.Globalization.CultureInfo.InvariantCulture).ToUniversalTime(),
                            Deaths = death
                        });
                    }
                }
            }

            await _context.CovidDeathCases.AddRangeAsync(records);
            await _context.SaveChangesAsync();
        }
    }
}
