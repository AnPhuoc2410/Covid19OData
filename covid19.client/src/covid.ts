export type CovidData = {
  Id: string;
  ProvinceState?: string | null; 
  CountryRegion: string;
  Date: string;
  Confirmed: number;
  Deaths: number;
  Recovered: number;
};

export type CountryData = {
  CountryRegion: string;
  Confirmed: number;
  Deaths: number;
  Recovered: number;
  LastUpdate: string;
};

export type CovidDailyReport = {
  UID: number;
  ProvinceState?: string | null;
  CountryRegion: string;
  LastUpdate: string;
  Lat: number;
  Long: number;
  Confirmed: number;
  Deaths: number;
  Recovered: number;
  Active: number;
  FIPS?: number;
  IncidentRate?: number;
  CaseFatalityRatio?: number;
  ISO3?: string;
};
