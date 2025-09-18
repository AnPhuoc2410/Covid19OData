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
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let allData: CovidData[] = [];
            let nextUrl: string | null =
                "https://localhost:7049/odata/CovidData?$orderby=Date desc";
            let pageCount = 0;
            // Removed maxPages limit - will load all available data

            while (nextUrl) {
                setLoadingProgress(
                    `Fetching page ${pageCount + 1}... (${allData.length} records so far)`
                );

                try {
                    const response: Response = await fetch(nextUrl);
                    if (!response.ok)
                        throw new Error(`HTTP error! status: ${response.status}`);

                    const json = await response.json();
                    const pageData = json.value || [];

                    // Break if no more data is returned
                    if (pageData.length === 0) {
                        console.log(`No more data on page ${pageCount + 1}, stopping fetch.`);
                        break;
                    }

                    allData = allData.concat(pageData);
                    nextUrl = json["@odata.nextLink"] || null;
                    pageCount++;

                    // Add a small delay between requests to be respectful to the server
                    if (nextUrl) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }

                    // Optional: Log progress every 10 pages
                    if (pageCount % 10 === 0) {
                        console.log(`Loaded ${pageCount} pages, ${allData.length} total records`);
                    }

                } catch (pageError) {
                    console.error(`Error fetching page ${pageCount + 1}:`, pageError);
                    // You can decide whether to break or continue on individual page errors
                    // For now, we'll break to avoid infinite loops on persistent errors
                    break;
                }
            }

            setLoadingProgress(`Processing ${allData.length} total records...`);
            console.log(`Finished loading: ${pageCount} pages, ${allData.length} total records`);

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

            console.log(`Final result: ${mapped.length} countries processed`);

        } catch (err) {
            console.error('Fetch error:', err);
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

    const handleTreemapCellEnter = (event: React.MouseEvent, name: string, size: number) => {
        setHoveredCell(name);
        setTooltip({
            x: event.clientX,
            y: event.clientY,
            content: `${name}: ${formatNumber(size)} ${selectedMetric}`,
        });
    };

    const handleTreemapCellLeave = () => {
        setHoveredCell(null);
        setTooltip(null);
    };

    const treemapData = data.map((d) => ({
        name: d.CountryRegion,
        size: d[selectedMetric],
    }));

    // Responsive treemap dimensions
    const getTreemapDimensions = () => {
        const width = window.innerWidth;
        if (width <= 480) {
            return { width: width - 40, height: 300 };
        } else if (width <= 768) {
            return { width: width - 60, height: 400 };
        } else {
            return { width: 1000, height: 500 };
        }
    };

    const [treemapDimensions, setTreemapDimensions] = useState(getTreemapDimensions());

    useEffect(() => {
        const handleResize = () => {
            setTreemapDimensions(getTreemapDimensions());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                        className={`confirmed ${selectedMetric === "Confirmed" ? "active" : ""
                            }`}
                        onClick={() => setSelectedMetric("Confirmed")}
                    >
                        🔵 Confirmed
                    </button>
                    <button
                        className={`deaths ${selectedMetric === "Deaths" ? "active" : ""
                            }`}
                        onClick={() => setSelectedMetric("Deaths")}
                    >
                        🔴 Deaths
                    </button>
                    <button
                        className={`recovered ${selectedMetric === "Recovered" ? "active" : ""
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
            <div className="treemap-container">
                <div className="treemap-header">
                    <h2>
                        COVID-19 {selectedMetric} by Country ({data.length} countries)
                    </h2>
                </div>
                <div className="treemap-wrapper">
                    <div className="treemap-chart">
                        <Treemap
                            width={treemapDimensions.width}
                            height={treemapDimensions.height}
                            data={treemapData}
                            dataKey="size"
                            stroke="#fff"
                            fill="#82ca9d"
                            // Add these props to stabilize the treemap
                            animationBegin={0}
                            animationDuration={0}
                            isAnimationActive={false}
                            content={({ x, y, width, height, name, size, payload }) => {
                                if (width <= 60 || height <= 30) return <g></g>;

                                // Calculate opacity based on size for better visual hierarchy
                                const maxSize = Math.max(...treemapData.map(d => d.size));
                                const opacity = 0.7 + (size / maxSize) * 0.3;

                                // Dynamic font size based on cell size and screen size
                                const baseFontSize = treemapDimensions.width <= 480 ? 10 : treemapDimensions.width <= 768 ? 12 : 14;
                                const fontSize = Math.min(width / 8, height / 4, baseFontSize);
                                const smallFont = fontSize * 0.8;

                                // Color scheme - using fixed colors to prevent flickering
                                const colors = {
                                    Confirmed: `rgba(52, 152, 219, ${opacity})`,
                                    Deaths: `rgba(231, 76, 60, ${opacity})`,
                                    Recovered: `rgba(46, 204, 113, ${opacity})`
                                };

                                // Create unique gradient ID to prevent conflicts
                                const gradientId = `gradient-${name}-${x}-${y}`.replace(/[^a-zA-Z0-9-]/g, '');
                                const isHovered = hoveredCell === name;

                                return (
                                    <g
                                        className="treemap-cell-fixed"
                                        onMouseEnter={(event) => handleTreemapCellEnter(event, name, size)}
                                        onMouseLeave={handleTreemapCellLeave}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <defs>
                                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor={colors[selectedMetric]} />
                                                <stop offset="100%" stopColor={colors[selectedMetric].replace(opacity.toString(), (opacity * 0.8).toString())} />
                                            </linearGradient>
                                        </defs>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={width}
                                            height={height}
                                            fill={`url(#${gradientId})`}
                                            stroke={isHovered ? "#2c3e50" : "#fff"}
                                            strokeWidth={isHovered ? 3 : 2}
                                            rx={4}
                                            ry={4}
                                            style={{
                                                filter: isHovered ? 'brightness(1.1)' : 'none'
                                            }}
                                        />
                                        <text
                                            x={x + width / 2}
                                            y={y + height / 2 - fontSize / 2}
                                            textAnchor="middle"
                                            fill="#fff"
                                            fontSize={fontSize}
                                            fontWeight={isHovered ? "700" : "600"}
                                            style={{
                                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            {name}
                                        </text>
                                        <text
                                            x={x + width / 2}
                                            y={y + height / 2 + fontSize / 2}
                                            textAnchor="middle"
                                            fill="rgba(255, 255, 255, 0.9)"
                                            fontSize={smallFont}
                                            fontWeight={isHovered ? "600" : "500"}
                                            style={{
                                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            {formatNumber(size)}
                                        </text>
                                    </g>
                                );
                            }}
                        >
                        </Treemap>
                    </div>
                </div>
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
