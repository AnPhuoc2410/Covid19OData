using Microsoft.AspNetCore.Mvc;
using Covid19.Server.Services;

namespace Covid19.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly CovidConfirmService _confirmService;
        private readonly CovidDeathService _deathService;
        private readonly CovidRecoverService _recoverService;

        public SeedController(CovidConfirmService confirmService, CovidDeathService deathService, CovidRecoverService recoverService)
        {
            _confirmService = confirmService;
            _deathService = deathService;
            _recoverService = recoverService;
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedData()
        {
            try
            {
                await _confirmService.SeedDataFromCsvAsync();
                await _deathService.SeedDataFromCsvAsync();
                await _recoverService.SeedDataFromCsvAsync();
                return Ok("Data seeded successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}