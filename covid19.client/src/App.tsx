import { useCallback, useEffect, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import "./App.css";

interface CovidData {
    Id: string;
    ProvinceState: string;
    CountryRegion: string;
    Lat: number;
    Long: number;
    Date: string;
    Confirmed: number;
    Deaths: number;
    Recovered: number;
}

interface CountryData {
    CountryRegion: string;
    Confirmed: number;
    Deaths: number;
    Recovered: number;
    LastUpdate: string;
}

const geoUrl = "map.json";

function App() {
    const [data, setData] = useState<CountryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<'Confirmed' | 'Deaths' | 'Recovered'>('Confirmed');
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let allData: CovidData[] = [];
            let nextUrl: string | null = "https://localhost:7049/odata/CovidData?$orderby=Date desc";
            let pageCount = 0;
            const maxPages = 50; // Safety limit to prevent infinite loops

            // Fetch all pages
            while (nextUrl && pageCount < maxPages) {
                setLoadingProgress(`Fetching page ${pageCount + 1}... (${allData.length} records so far)`);
                console.log(`Fetching page ${pageCount + 1}...`);

                const response: Response = await fetch(nextUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();

                // Add current page data to our collection
                allData = allData.concat(json.value || []);

                // Check for next page
                nextUrl = json['@odata.nextLink'] || null;
                pageCount++;

                console.log(`Page ${pageCount}: Got ${json.value?.length || 0} records. Total so far: ${allData.length}`);

                // Optional: Add a small delay to avoid overwhelming the server
                if (nextUrl) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            setLoadingProgress('Processing data...');
            console.log(`Fetched ${allData.length} total records from ${pageCount} pages`);

            // Group by CountryRegion and get the latest confirmed cases for each country
            const latestByCountry: Record<string, CountryData> = {};

            allData.forEach((item: CovidData) => {
                const country = item.CountryRegion;
                const date = new Date(item.Date);

                if (!latestByCountry[country] || new Date(latestByCountry[country].LastUpdate) < date) {
                    latestByCountry[country] = {
                        CountryRegion: country,
                        Confirmed: item.Confirmed,
                        Deaths: item.Deaths,
                        Recovered: item.Recovered,
                        LastUpdate: item.Date
                    };
                }
                // else {
                //     if (new Date(latestByCountry[country].LastUpdate) < date) {
                //         latestByCountry[country].LastUpdate = item.Date;
                //     }
                //     latestByCountry[country].Confirmed += item.Confirmed;
                // }
            });

            // Convert to array and sort by confirmed cases
            const mapped = Object.values(latestByCountry).sort((a, b) => b[selectedMetric] - a[selectedMetric]);

            console.log('Processed data:', mapped.slice(0, 10)); // Show top 10 for debugging
            console.log(`Final result: ${mapped.length} unique countries`);
            setData(mapped);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
            setLoadingProgress('');
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Create a better color scale
    const getColorScale = () => {
        if (data.length === 0) return scaleLinear<string>().domain([0, 1]).range(["#f7f7f7", "#f7f7f7"]);

        const maxCases = Math.max(...data.map((d) => d.Confirmed));
        const minCases = Math.min(...data.filter(d => d.Confirmed > 0).map((d) => d.Confirmed));

        // Use logarithmic scale for better visualization of wide range
        return scaleLinear<string>()
            .domain([0, Math.log10(minCases + 1), Math.log10(maxCases * 0.1), Math.log10(maxCases * 0.5), Math.log10(maxCases)])
            .range(["#f7f7f7", "#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"]);
    };

    const colorScale = getColorScale();

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    // Improved country name matching
    const findCountryData = (geoName: string): CountryData | undefined => {
        // Direct match first
        let countryData = data.find(d => d.CountryRegion === geoName);

        if (!countryData) {
            // Try common name variations
            const nameMapping: Record<string, string> = {
                "United States of America": "US",
                "United Kingdom": "United Kingdom",
                "Russia": "Russia",
                "Iran": "Iran",
                "South Korea": "Korea, South",
                "North Korea": "Korea, North",
                "Czech Republic": "Czechia",
                "Myanmar": "Burma",
                "Democratic Republic of the Congo": "Congo (Kinshasa)",
                "Republic of the Congo": "Congo (Brazzaville)",
                "Ivory Coast": "Cote d'Ivoire",
                "East Timor": "Timor-Leste",
                "Swaziland": "Eswatini"
            };

            const mappedName = nameMapping[geoName];
            if (mappedName) {
                countryData = data.find(d => d.CountryRegion === mappedName);
            }

            // Try fuzzy matching
            if (!countryData) {
                countryData = data.find(d =>
                    d.CountryRegion.toLowerCase().includes(geoName.toLowerCase()) ||
                    geoName.toLowerCase().includes(d.CountryRegion.toLowerCase())
                );
            }
        }

        return countryData;
    };

    const handleMouseEnter = (event: React.MouseEvent, geo: any) => {
        const countryData = findCountryData(geo.properties.name);
        const cases = countryData ? countryData.Confirmed : 0;
        const lastUpdate = countryData ? new Date(countryData.LastUpdate).toLocaleDateString() : 'N/A';

        setTooltip({
            x: event.clientX,
            y: event.clientY,
            content: `${geo.properties.name}: ${formatNumber(cases)} cases (${lastUpdate})`
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const getLegendData = () => {
        if (data.length === 0) return [];

        const maxCases = Math.max(...data.map((d) => d.Confirmed));
        const steps = [0, maxCases * 0.01, maxCases * 0.1, maxCases * 0.3, maxCases];

        return steps.map((value, index) => ({
            color: colorScale(value > 0 ? Math.log10(value + 1) : 0),
            label: index === 0 ? '0' :
                index === steps.length - 1 ? `${formatNumber(Math.round(value))}+` :
                    `${formatNumber(Math.round(value))}`
        }));
    };

    if (loading) {
        return (
            <div className="app-container">
                <div className="loading">
                    <div>Loading COVID-19 data...</div>
                    {loadingProgress && <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#7f8c8d' }}>{loadingProgress}</div>}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <div className="error">
                    Error loading data: {error}
                    <button onClick={fetchData} style={{ marginLeft: '10px' }}>
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
                <p>Interactive world map showing confirmed cases by country ({data.length} countries)</p>

                {/* Metric Selector */}
                <div className="metric-selector">
                    <button 
                        className={selectedMetric === 'Confirmed' ? 'active' : ''}
                        onClick={() => setSelectedMetric('Confirmed')}
                    >
                        Confirmed Cases
                    </button>
                    <button 
                        className={selectedMetric === 'Deaths' ? 'active' : ''}
                        onClick={() => setSelectedMetric('Deaths')}
                    >
                        Deaths
                    </button>
                    <button 
                        className={selectedMetric === 'Recovered' ? 'active' : ''}
                        onClick={() => setSelectedMetric('Recovered')}
                    >
                        Recovered
                    </button>
                </div>
            </div>

            <div className="map-container">
                <div className="map-wrapper">
                    <ComposableMap
                        projection="geoEqualEarth"
                        projectionConfig={{
                            scale: 160,
                            center: [0, 20]
                        }}
                        width={1000}
                        height={600}
                        style={{ width: "100%", height: "auto" }}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryData = findCountryData(geo.properties.name);
                                    const confirmedCases = countryData ? countryData.Confirmed : 0;
                                    const color = confirmedCases > 0
                                        ? colorScale(Math.log10(confirmedCases + 1))
                                        : "#f7f7f7";

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={color}
                                            stroke="#ffffff"
                                            strokeWidth={0.5}
                                            style={{
                                                default: {
                                                    outline: "none",
                                                },
                                                hover: {
                                                    fill: "#2c3e50",
                                                    outline: "none",
                                                    cursor: "pointer",
                                                    strokeWidth: 1,
                                                },
                                                pressed: {
                                                    fill: "#34495e",
                                                    outline: "none",
                                                },
                                            }}
                                            onMouseEnter={(event) => handleMouseEnter(event, geo)}
                                            onMouseLeave={handleMouseLeave}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ComposableMap>

                    {/* Legend */}
                    <div className="legend">
                        <div className="legend-title">Confirmed Cases</div>
                        {getLegendData().map((item, index) => (
                            <div key={index} className="legend-item">
                                <div
                                    className="legend-color"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span style={{ color: "black" }}>{item.label}</span>
                            </div>
                        ))}
                        <div className="legend-note">
                            <small>Using logarithmic scale</small>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="stats">
                    <div className="stat-item">
                        <strong>Total Countries:</strong> {data.length}
                    </div>
                    <div className="stat-item">
                        <strong>Total Confirmed:</strong> {formatNumber(data.reduce((sum, d) => sum + d.Confirmed, 0))}
                    </div>
                    <div className="stat-item">
                        <strong>Total Deaths:</strong> {formatNumber(data.reduce((sum, d) => sum + d.Deaths, 0))}
                    </div>
                    <div className="stat-item">
                        <strong>Total Recovered:</strong> {formatNumber(data.reduce((sum, d) => sum + d.Recovered, 0))}
                    </div>
                    <div className="stat-item">
                        <strong>Most Affected ({selectedMetric}):</strong> {data[0]?.CountryRegion} ({formatNumber(data[0]?.[selectedMetric] || 0)})
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="tooltip"
                    style={{
                        left: tooltip.x + 10,
                        top: tooltip.y - 30
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
}

export default App;