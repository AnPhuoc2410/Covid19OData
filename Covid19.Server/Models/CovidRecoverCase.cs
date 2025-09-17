using System.ComponentModel.DataAnnotations;

namespace Covid19.Server.Models
{
    public class CovidRecoverCase
    {
        [Key]
        public Guid Id { get; set; }
        public string? ProvinceState { get; set; }
        public string CountryRegion { get; set; }
        public double? Lat { get; set; }
        public double? Long { get; set; }
        public DateTime Date { get; set; }



        Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,FIPS,Incident_Rate,Total_Test_Results,People_Hospitalized,Case_Fatality_Ratio,UID,ISO3,Testing_Rate,Hospitalization_Rate,Date,People_Tested,Mortality_Rate
Alabama, US,2022-02-22 04:31:49,32.3182,-86.9023,1273484,17933,,,1.0,25972.587206071155,,,1.408184162502238,84000001.0, USA,,,2022-02-21,,
Alaska, US,2022-02-22 
    }
}
