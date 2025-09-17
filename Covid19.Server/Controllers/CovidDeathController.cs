using Covid19.Server.Models;
using Covid19.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

namespace Covid19.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CovidDeathController : ControllerBase
    {
        private readonly CovidDeathService _deathService;

        public CovidDeathController(CovidDeathService deathService)
        {
            _deathService = deathService;
        }

        [EnableQuery(PageSize = 100)]
        [HttpGet]
        public async Task<ActionResult<IQueryable<CovidDeathCase>>> Get()
        {
            var cases = await _deathService.GetDeathServicesAsync();
            return Ok(cases.AsQueryable());
        }
    }
}
