using Covid19.Server.Models;
using Covid19.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;

namespace Covid19.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CovidDataController : ControllerBase
    {
        private readonly CovidDataService _dataService;

        public CovidDataController(CovidDataService covidDataService)
        {
            _dataService = covidDataService;
        }

        [EnableQuery(PageSize = 10000)]
        [HttpGet]
        public async Task<ActionResult<IQueryable<CovidConfirmedCase>>> Get()
        {
            var cases = await _dataService.GetCountrySummariesAsync();
            return Ok(cases.AsQueryable());
        }
    }
}
