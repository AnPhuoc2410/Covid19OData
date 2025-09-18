using Covid19.Server.Models;
using Covid19.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using System.Globalization;

namespace Covid19.Server.Controllers
{
    public class CovidDailyReportsController : ODataController
    {
        private readonly DailyReportService _dailyReportService;
        private readonly ILogger<CovidDailyReportsController> _logger;

        public CovidDailyReportsController(DailyReportService dailyReportService, ILogger<CovidDailyReportsController> logger)
        {
            _dailyReportService = dailyReportService;
            _logger = logger;
        }

        [HttpGet("CovidDailyReports")]
        public async Task<ActionResult<CovidDailyReport>> Get([FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, CultureInfo.InvariantCulture, out var parsedDate))
            {
                return BadRequest("Định dạng ngày không hợp lệ. Vui lòng dùng 'yyyy-MM-dd'.");
            }

            _logger.LogInformation($"Fetching US summary for date: {parsedDate:yyyy-MM-dd}");

            var report = await _dailyReportService.GetUsSummaryAsync(parsedDate);
            if (report == null)
            {
                return NotFound($"Không có dữ liệu cho ngày {parsedDate:yyyy-MM-dd}");
            }

            return Ok(report);
        }
    }
}
