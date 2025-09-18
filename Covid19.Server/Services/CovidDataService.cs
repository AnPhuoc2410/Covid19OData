using Covid19.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Covid19.Server.Services
{
    public class CovidDataService
    {
        private readonly CovidConfirmService _confirmService;
        private readonly CovidDeathService _deathService;
        private readonly CovidRecoverService _recoveredService;

        public CovidDataService(CovidConfirmService covidConfirmService, CovidDeathService covidDeathService, CovidRecoverService covidRecoverService)
        {
            _confirmService = covidConfirmService;
            _deathService = covidDeathService;
            _recoveredService = covidRecoverService;
        }

        public async Task<IEnumerable<CovidDataPoint>> GetCombinedDataAsync()
        {
            // 1. Gọi tất cả service con chạy song song để tiết kiệm thời gian
            var confirmTask = _confirmService.GetConfirmedCasesAsync();
            var deathTask = _deathService.GetDeathServicesAsync();
            var recoveredTask = _recoveredService.GetRecoverCasesAsync();

            await Task.WhenAll(confirmTask, deathTask, recoveredTask);

            // 2. Lấy kết quả từ các task đã hoàn thành
            var confirmedCases = await confirmTask;
            var deathCases = await deathTask;
            var recoveredCases = await recoveredTask;

            // 3. Sử dụng Dictionary để gộp dữ liệu một cách hiệu quả
            var dataMap = new Dictionary<string, CovidDataPoint>();

            // --- Bước 1: Xử lý Confirmed Cases trước để tạo dữ liệu nền ---
            foreach (var confirmedCase in confirmedCases)
            {
                // Tạo một key duy nhất cho mỗi dòng dữ liệu (Địa điểm + Ngày)
                string key = $"{confirmedCase.CountryRegion}-{confirmedCase.ProvinceState}-{confirmedCase.Date:yyyy-MM-dd}";

                dataMap[key] = new CovidDataPoint
                {
                    Id = Guid.NewGuid(),
                    ProvinceState = confirmedCase.ProvinceState,
                    CountryRegion = confirmedCase.CountryRegion,
                    Lat = confirmedCase.Lat,
                    Long = confirmedCase.Long,
                    Date = confirmedCase.Date,
                    Confirmed = confirmedCase.Confirmed,
                    Deaths = 0,     // Khởi tạo giá trị
                    Recovered = 0   // Khởi tạo giá trị
                };
            }

            // --- Bước 2: Cập nhật dữ liệu Deaths ---
            foreach (var deathCase in deathCases)
            {
                string key = $"{deathCase.CountryRegion}-{deathCase.ProvinceState}-{deathCase.Date:yyyy-MM-dd}";
                if (dataMap.TryGetValue(key, out var dataPoint))
                {
                    dataPoint.Deaths = deathCase.Deaths;
                }
            }

            // --- Bước 3: Cập nhật dữ liệu Recovered ---
            foreach (var recoveredCase in recoveredCases)
            {
                string key = $"{recoveredCase.CountryRegion}-{recoveredCase.ProvinceState}-{recoveredCase.Date:yyyy-MM-dd}";
                if (dataMap.TryGetValue(key, out var dataPoint))
                {
                    dataPoint.Recovered = recoveredCase.Recovered;
                }
            }

            // 4. Trả về danh sách dữ liệu đã được gộp hoàn chỉnh
            return dataMap.Values;
        }

        // Bạn có thể giữ lại hoặc thêm phương thức GetCountrySummariesAsync ở đây
        // nếu cần, nó sẽ gọi GetCombinedDataAsync() bên trên.

        public async Task<IEnumerable<CovidDataPoint>> GetCountrySummariesAsync()
        {
            var combinedData = await GetCombinedDataAsync();

            var countrySummaries = combinedData
                .GroupBy(d => new { d.CountryRegion, d.Date })
                .Select(g => new CovidDataPoint
                {
                    Id = Guid.NewGuid(),
                    ProvinceState = null, // Bỏ qua chi tiết tỉnh
                    CountryRegion = g.Key.CountryRegion,
                    Lat = 0, // Có thể tính trung bình hoặc bỏ trống
                    Long = 0,
                    Date = g.Key.Date,
                    Confirmed = g.Sum(x => x.Confirmed),
                    Deaths = g.Sum(x => x.Deaths),
                    Recovered = g.Sum(x => x.Recovered)
                })
                .ToList();

            return countrySummaries;
        }
    }
}