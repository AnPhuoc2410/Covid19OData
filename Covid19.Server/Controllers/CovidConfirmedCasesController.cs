using Covid19.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;

namespace Covid19.Server.Controllers
{
    public class CovidConfirmedCasesController : ODataController
    {
        private readonly CovidDataService _covidDataService;

        public CovidConfirmedCasesController(CovidDataService covidDataService)
        {
            _covidDataService = covidDataService;
        }

        [EnableQuery(PageSize = 100)]
        public async Task<IActionResult> Get()
        {
            var cases = await _covidDataService.GetConfirmedCasesAsync();
            return Ok(cases.AsQueryable());
        }
    }

}
