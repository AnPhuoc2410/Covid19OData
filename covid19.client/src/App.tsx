import { useCallback, useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Treemap, Tooltip as ReTooltip } from "recharts";
import "./App.css";
import type { CovidData, CountryData } from "./covid.ts";

const geoUrl = "map.json";

function App() {
  const [data, setData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<
    "Confirmed" | "Deaths" | "Recovered"
  >("Confirmed");
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("2021-01-01");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let allData: CovidData[] = [];
      let nextUrl: string | null =
        "https://localhost:7049/odata/CovidData?$orderby=Date desc";
      let pageCount = 0;
      const maxPages = 70;

      while (nextUrl && pageCount < maxPages) {
        setLoadingProgress(
          `Fetching page ${pageCount + 1}... (${allData.length} records so far)`
        );

        const response: Response = await fetch(nextUrl);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
        allData = allData.concat(json.value || []);
        nextUrl = json["@odata.nextLink"] || null;
        pageCount++;

        if (nextUrl) await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setLoadingProgress("Processing data...");

      const latestByCountry: Record<string, CountryData> = {};
      allData.forEach((item: CovidData) => {
        const country = item.CountryRegion;
        const date = new Date(item.Date);

        if (
          !latestByCountry[country] ||
          new Date(latestByCountry[country].LastUpdate) < date
        ) {
          latestByCountry[country] = {
            CountryRegion: country,
            Confirmed: item.Confirmed,
            Deaths: item.Deaths,
            Recovered: item.Recovered,
            LastUpdate: item.Date,
          };
        }
      });

      const mapped = Object.values(latestByCountry).sort(
        (a, b) => b[selectedMetric] - a[selectedMetric]
      );
      setData(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  }, [selectedMetric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getColorScale = () => {
    if (data.length === 0)
      return scaleLinear<string>().domain([0, 1]).range(["#f7f7f7", "#f7f7f7"]);

    const maxCases = Math.max(...data.map((d) => d[selectedMetric]));
    const minCases = Math.min(
      ...data.filter((d) => d[selectedMetric] > 0).map((d) => d[selectedMetric])
    );

    return scaleLinear<string>()
      .domain([
        0,
        Math.log10(minCases + 1),
        Math.log10(maxCases * 0.1),
        Math.log10(maxCases * 0.5),
        Math.log10(maxCases),
      ])
      .range(["#f7f7f7", "#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"]);
  };

  const colorScale = getColorScale();
  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

  const findCountryData = (geoName: string): CountryData | undefined => {
    let countryData = data.find((d) => d.CountryRegion === geoName);
    if (!countryData) {
      const nameMapping: Record<string, string> = {
        "United States of America": "US",
        "South Korea": "Korea, South",
        "North Korea": "Korea, North",
        "Czech Republic": "Czechia",
        Myanmar: "Burma",
        "Democratic Republic of the Congo": "Congo (Kinshasa)",
        "Republic of the Congo": "Congo (Brazzaville)",
        "Ivory Coast": "Cote d'Ivoire",
        "East Timor": "Timor-Leste",
        Swaziland: "Eswatini",
      };
      const mappedName = nameMapping[geoName];
      if (mappedName)
        countryData = data.find((d) => d.CountryRegion === mappedName);

      if (!countryData) {
        countryData = data.find(
          (d) =>
            d.CountryRegion.toLowerCase().includes(geoName.toLowerCase()) ||
            geoName.toLowerCase().includes(d.CountryRegion.toLowerCase())
        );
      }
    }
    return countryData;
  };

  const handleMouseEnter = (event: React.MouseEvent, geo: any) => {
    const countryData = findCountryData(geo.properties.name);
    const value = countryData ? countryData[selectedMetric] : 0;
    const lastUpdate = countryData
      ? new Date(countryData.LastUpdate).toLocaleDateString()
      : "N/A";

    setTooltip({
      x: event.clientX,
      y: event.clientY,
      content: `${geo.properties.name}: ${formatNumber(
        value
      )} ${selectedMetric} (${lastUpdate})`,
    });
  };
  const handleMouseLeave = () => setTooltip(null);

  const treemapData = data.map((d) => ({
    name: d.CountryRegion,
    size: d[selectedMetric],
  }));

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div>Loading COVID-19 data...</div>
          {loadingProgress && (
            <div
              style={{
                marginTop: "10px",
                fontSize: "0.9rem",
                color: "#7f8c8d",
              }}
            >
              {loadingProgress}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="app-container">
        <div className="error">
          Error loading data: {error}
          <button onClick={fetchData} style={{ marginLeft: "10px" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>COVID-19 Global Cases</h1>
        <div className="metric-selector">
          <button
            className={`confirmed ${
              selectedMetric === "Confirmed" ? "active" : ""
            }`}
            onClick={() => setSelectedMetric("Confirmed")}
          >
            🔵 Confirmed
          </button>
          <button
            className={`deaths ${
              selectedMetric === "Deaths" ? "active" : ""
            }`}
            onClick={() => setSelectedMetric("Deaths")}
          >
            🔴 Deaths
          </button>
          <button
            className={`recovered ${
              selectedMetric === "Recovered" ? "active" : ""
            }`}
            onClick={() => setSelectedMetric("Recovered")}
          >
            🟢 Recovered
          </button>
        </div>
      </div>

      {/* Bản đồ */}
      <div className="map-container">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 160, center: [0, 20] }}
          width={1000}
          height={600}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryData = findCountryData(geo.properties.name);
                const value = countryData ? countryData[selectedMetric] : 0;
                const color =
                  value > 0 ? colorScale(Math.log10(value + 1)) : "#f7f7f7";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: "#2c3e50",
                        outline: "none",
                        cursor: "pointer",
                        strokeWidth: 1,
                      },
                      pressed: { fill: "#34495e", outline: "none" },
                    }}
                    onMouseEnter={(event) => handleMouseEnter(event, geo)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Treemap */}
      <div style={{ marginTop: "40px" }}>
        <h2>
          Treemap by {selectedMetric} ({data.length} countries)
        </h2>
        <Treemap
          width={1000}
          height={500}
          data={treemapData}
          dataKey="size"
          stroke="#fff"
          fill="#82ca9d"
          content={({ x, y, width, height, name, size }) => {
            if (width <= 40 || height <= 20) return <g></g>; // Return empty group instead of null
            return (
              <g>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  style={{
                    fill:
                      selectedMetric === "Confirmed"
                        ? "#3498db"
                        : selectedMetric === "Deaths"
                        ? "#e74c3c"
                        : "#2ecc71",
                    stroke: "#fff",
                    strokeWidth: 1,
                  }}
                />
                <text
                  x={x + width / 2}
                  y={y + height / 2}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={12}
                >
                  {name} ({formatNumber(size)})
                </text>
              </g>
            );
          }}
        >
          <ReTooltip />
        </Treemap>
      </div>

      {/* Tooltip Map */}
      {tooltip && (
        <div
          className="tooltip"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default App;
