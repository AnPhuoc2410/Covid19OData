import { useCallback, useEffect, useState, useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Treemap } from "recharts";
import "./App.css";
import type { CovidData, CountryData } from "./covid.ts";

const geoUrl = "map.json";

// Country to continent mapping for filtering - Comprehensive list
const countryToContinent: Record<string, string> = {
    // Americas
    "US": "Americas", "Brazil": "Americas", "Mexico": "Americas", "Argentina": "Americas",
    "Colombia": "Americas", "Peru": "Americas", "Chile": "Americas", "Canada": "Americas",
    "Venezuela": "Americas", "Ecuador": "Americas", "Bolivia": "Americas", "Paraguay": "Americas",
    "Uruguay": "Americas", "Guatemala": "Americas", "Honduras": "Americas", "Nicaragua": "Americas",
    "Costa Rica": "Americas", "Panama": "Americas", "Cuba": "Americas", "Dominican Republic": "Americas",
    "Haiti": "Americas", "Jamaica": "Americas", "Trinidad and Tobago": "Americas", "Bahamas": "Americas",
    "Barbados": "Americas", "Belize": "Americas", "Guyana": "Americas", "Suriname": "Americas",
    
    // Europe
    "Germany": "Europe", "France": "Europe", "Italy": "Europe", "Spain": "Europe",
    "United Kingdom": "Europe", "Russia": "Europe", "Ukraine": "Europe", "Poland": "Europe",
    "Netherlands": "Europe", "Belgium": "Europe", "Czechia": "Europe", "Portugal": "Europe",
    "Sweden": "Europe", "Romania": "Europe", "Austria": "Europe", "Greece": "Europe",
    "Hungary": "Europe", "Switzerland": "Europe", "Serbia": "Europe", "Bulgaria": "Europe",
    "Denmark": "Europe", "Finland": "Europe", "Norway": "Europe", "Ireland": "Europe",
    "Croatia": "Europe", "Bosnia and Herzegovina": "Europe", "Albania": "Europe", "Lithuania": "Europe",
    "Slovenia": "Europe", "Latvia": "Europe", "Estonia": "Europe", "North Macedonia": "Europe",
    "Slovakia": "Europe", "Moldova": "Europe", "Luxembourg": "Europe", "Montenegro": "Europe",
    "Malta": "Europe", "Iceland": "Europe", "Belarus": "Europe", "Azerbaijan": "Europe",
    "Georgia": "Europe", "Cyprus": "Europe", "Armenia": "Europe", "Kosovo": "Europe",
    
    // Asia
    "India": "Asia", "Japan": "Asia", "Korea, South": "Asia", "Philippines": "Asia",
    "Vietnam": "Asia", "Thailand": "Asia", "Malaysia": "Asia", "Singapore": "Asia",
    "China": "Asia", "Indonesia": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia",
    "Iran": "Asia", "Turkey": "Asia", "Iraq": "Asia", "Saudi Arabia": "Asia",
    "Israel": "Asia", "Jordan": "Asia", "Lebanon": "Asia", "United Arab Emirates": "Asia",
    "Kuwait": "Asia", "Oman": "Asia", "Qatar": "Asia", "Bahrain": "Asia",
    "Yemen": "Asia", "Syria": "Asia", "Afghanistan": "Asia", "Myanmar": "Asia",
    "Sri Lanka": "Asia", "Nepal": "Asia", "Cambodia": "Asia", "Laos": "Asia",
    "Mongolia": "Asia", "Taiwan*": "Asia", "Kazakhstan": "Asia", "Uzbekistan": "Asia",
    "Kyrgyzstan": "Asia", "Tajikistan": "Asia", "Turkmenistan": "Asia", "Maldives": "Asia",
    "Brunei": "Asia", "Timor-Leste": "Asia", "Bhutan": "Asia",
    
    // Africa
    "South Africa": "Africa", "Egypt": "Africa", "Morocco": "Africa", "Tunisia": "Africa",
    "Algeria": "Africa", "Libya": "Africa", "Ethiopia": "Africa", "Kenya": "Africa",
    "Nigeria": "Africa", "Ghana": "Africa", "Cameroon": "Africa", "Zimbabwe": "Africa",
    "Uganda": "Africa", "Senegal": "Africa", "Sudan": "Africa", "Mozambique": "Africa",
    "Angola": "Africa", "Zambia": "Africa", "Madagascar": "Africa", "Mali": "Africa",
    "Burkina Faso": "Africa", "Niger": "Africa", "Chad": "Africa", "Somalia": "Africa",
    "Congo (Kinshasa)": "Africa", "Congo (Brazzaville)": "Africa", "Mauritania": "Africa",
    "Rwanda": "Africa", "Benin": "Africa", "Burundi": "Africa", "Togo": "Africa",
    "Guinea": "Africa", "Malawi": "Africa", "Namibia": "Africa", "Botswana": "Africa",
    "Gabon": "Africa", "Mauritius": "Africa", "Eswatini": "Africa", "Djibouti": "Africa",
    "Equatorial Guinea": "Africa", "Central African Republic": "Africa", "Eritrea": "Africa",
    "Gambia": "Africa", "Lesotho": "Africa", "Liberia": "Africa", "Sierra Leone": "Africa",
    "Tanzania": "Africa", "Cote d'Ivoire": "Africa", "Cabo Verde": "Africa", "Seychelles": "Africa",
    "South Sudan": "Africa", "Western Sahara": "Africa",
    
    // Oceania
    "Australia": "Oceania", "New Zealand": "Oceania", "Papua New Guinea": "Oceania",
    "Fiji": "Oceania", "Solomon Islands": "Oceania", "Vanuatu": "Oceania",
    "Samoa": "Oceania", "Kiribati": "Oceania", "Micronesia": "Oceania",
    "Tonga": "Oceania", "Palau": "Oceania", "Marshall Islands": "Oceania",
};

function App() {
    const [data, setData] = useState<CountryData[]>([]);
    const [rawData, setRawData] = useState<CountryData[]>([]); // Cache raw data
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
    const [totals, setTotals] = useState({
        Confirmed: 0,
        Deaths: 0,
        Recovered: 0,
        LastUpdate: ""
    });

    // V2 Features
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContinent, setSelectedContinent] = useState<string>("All");
    const [displayMode, setDisplayMode] = useState<"top50" | "all">("all");
    const [sortBy, setSortBy] = useState<"value" | "name">("value");

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("🔵 Starting fetch...");

            let allData: CovidData[] = [];
            
            let nextUrl: string | null =
                "https://localhost:7049/odata/CovidData?$select=CountryRegion,Confirmed,Deaths,Recovered,Date&$orderby=Date desc";
            let pageCount = 0;

            while (nextUrl) {
                try {
                    const response: Response = await fetch(nextUrl);

                    if (!response.ok)
                        throw new Error(`HTTP error! status: ${response.status}`);

                    const json = await response.json();
                    const pageData = json.value || [];

                    if (pageData.length === 0) {
                        break;
                    }

                    // Directly concatenate page data (no artificial chunking)
                    allData = allData.concat(pageData);
                    pageCount++;

                    // Update progress for each page
                    setLoadingProgress(`⏳ Loading page ${pageCount}... Total: ${allData.length.toLocaleString()} rows`);

                    nextUrl = json["@odata.nextLink"] || null;

                } catch (pageError) {
                    console.error(`Error fetching:`, pageError);
                    break;
                }
            }

            setLoadingProgress(`Processing ${allData.length} total records...`);
            console.log(`Finished loading: ${pageCount} pages, ${allData.length} total records`);

            const latestByCountry: Record<string, CountryData> = {};
            allData.forEach((item: CovidData) => {
                const country = item.CountryRegion;
                const date = new Date(item.Date);

                // Skip invalid country names
                if (!country || country.trim() === '' || country === 'null' || country === 'undefined') {
                    return;
                }

                if (
                    !latestByCountry[country] ||
                    new Date(latestByCountry[country].LastUpdate) < date
                ) {
                    latestByCountry[country] = {
                        CountryRegion: country,
                        Confirmed: item.Confirmed || 0,
                        Deaths: item.Deaths || 0,
                        Recovered: item.Recovered || 0,
                        LastUpdate: item.Date,
                    };
                }
            });

            const mapped = Object.values(latestByCountry)
                .filter(d => {
                    // Additional filter for clean data
                    const name = d.CountryRegion;
                    return name && 
                           name.trim() !== '' && 
                           name !== 'null' && 
                           name !== 'undefined' &&
                           !isNaN(d.Confirmed) &&
                           !isNaN(d.Deaths) &&
                           !isNaN(d.Recovered);
                })
                .sort((a, b) => b.Confirmed - a.Confirmed);
            
            console.log(`Processed ${mapped.length} valid countries`);
            setRawData(mapped); // Cache the raw data
            setData(mapped);

            // Calculate totals
            const totalConfirmed = mapped.reduce((sum, d) => sum + d.Confirmed, 0);
            const totalDeaths = mapped.reduce((sum, d) => sum + d.Deaths, 0);
            const totalRecovered = mapped.reduce((sum, d) => sum + d.Recovered, 0);
            const lastUpdate = mapped.length > 0 ? mapped[0].LastUpdate : "";

            setTotals({
                Confirmed: totalConfirmed,
                Deaths: totalDeaths,
                Recovered: totalRecovered,
                LastUpdate: lastUpdate
            });

            console.log(`Final result: ${mapped.length} countries processed`);

        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setLoading(false);
            setLoadingProgress("");
        }
    }, []); // Empty dependency - only fetch once!

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Re-sort data when metric changes without refetching
    useEffect(() => {
        if (rawData.length > 0) {
            const sorted = [...rawData].sort(
                (a, b) => b[selectedMetric] - a[selectedMetric]
            );
            setData(sorted);
        }
    }, [selectedMetric, rawData]);

    const colorScale = useMemo(() => {
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
    }, [data, selectedMetric]);
    const formatNumber = useCallback((num: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num), []);

    const findCountryData = useCallback((geoName: string): CountryData | undefined => {
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
    }, [data]);

    const handleMouseEnter = useCallback((event: React.MouseEvent, geo: { properties: { name: string } }) => {
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
    }, [findCountryData, selectedMetric, formatNumber]);
    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    const handleTreemapCellEnter = useCallback((event: React.MouseEvent, name: string, size: number) => {
        setHoveredCell(name);
        setTooltip({
            x: event.clientX,
            y: event.clientY,
            content: `${name}: ${formatNumber(size)} ${selectedMetric}`,
        });
    }, [formatNumber, selectedMetric]);

    const handleTreemapCellLeave = useCallback(() => {
        setHoveredCell(null);
        setTooltip(null);
    }, []);

    // Get continent for a country
    const getContinent = useCallback((country: string): string => {
        return countryToContinent[country] || "Other";
    }, []);

    // Filtered and processed treemap data
    const treemapData = useMemo(() => {
        let filteredData = [...data];

        // Filter by search
        if (searchQuery) {
            filteredData = filteredData.filter(d => 
                d.CountryRegion.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by continent
        if (selectedContinent !== "All") {
            filteredData = filteredData.filter(d => {
                const continent = getContinent(d.CountryRegion);
                return continent === selectedContinent;
            });
            
            // Debug log for "Other" continent
            if (selectedContinent === "Other") {
                console.log("Countries in Other:", filteredData.map(d => d.CountryRegion));
            }
        }

        // Apply display mode (top50 or all)
        if (displayMode === "top50") {
            filteredData = filteredData.slice(0, 50);
        }

        // Sort data
        if (sortBy === "name") {
            filteredData.sort((a, b) => a.CountryRegion.localeCompare(b.CountryRegion));
        } else {
            filteredData.sort((a, b) => b[selectedMetric] - a[selectedMetric]);
        }

        // Ensure minimum size for visibility
        const validData = filteredData.filter(d => {
            // Filter out invalid data first
            const value = d[selectedMetric];
            const name = d.CountryRegion;
            return value > 0 && 
                   !isNaN(value) && 
                   value !== null && 
                   value !== undefined &&
                   name && 
                   name.trim() !== '' && 
                   name !== 'NaN' &&
                   name !== 'null' &&
                   name !== 'undefined';
        });

        const maxSize = validData.length > 0 ? Math.max(...validData.map(d => d[selectedMetric])) : 1;
        const minSize = maxSize * 0.001; // Reduced from 0.005 to show smaller countries

        const result = validData.map((d) => ({
            name: d.CountryRegion,
            size: Math.max(d[selectedMetric], minSize),
            continent: getContinent(d.CountryRegion),
        }));

        // Debug log
        console.log(`Treemap data: ${result.length} countries, Continent: ${selectedContinent}`);
        
        return result;
    }, [data, selectedMetric, searchQuery, selectedContinent, displayMode, sortBy, getContinent]);

    // Get unique continents
    const continents = useMemo(() => {
        const unique = new Set(data.map(d => getContinent(d.CountryRegion)));
        return ["All", ...Array.from(unique).sort()];
    }, [data, getContinent]);

    // Pre-calculate max size for performance
    const maxTreemapSize = useMemo(() => {
        return treemapData.length > 0 ? Math.max(...treemapData.map(d => d.size)) : 1;
    }, [treemapData]);

    // Fixed treemap dimensions - display all countries in one view
    const getTreemapDimensions = () => {
        const width = window.innerWidth;
        if (width <= 480) {
            return { width: width - 30, height: 500 };
        } else if (width <= 768) {
            return { width: width - 50, height: 600 };
        } else if (width <= 1024) {
            return { width: width - 80, height: 700 };
        } else {
            return { width: 1250, height: 750 }; // Fixed height - no scrolling
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
                    <div className="loading-spinner"></div>
                    <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginTop: "20px" }}>Loading COVID-19 Data...</div>
                    {loadingProgress && (
                        <div className="loading-progress">
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
                <h1>🌍 COVID-19 Global Dashboard</h1>
                <div className="summary">
                    <div className="summary-item confirmed">
                        <span className="label">Total Confirmed</span>
                        <span className="value">{formatNumber(totals.Confirmed)}</span>
                    </div>
                    <div className="summary-item deaths">
                        <span className="label">Total Deaths</span>
                        <span className="value">{formatNumber(totals.Deaths)}</span>
                    </div>
                    <div className="summary-item recovered">
                        <span className="label">Total Recovered</span>
                        <span className="value">{formatNumber(totals.Recovered)}</span>
                    </div>
                </div>
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

            {/* Treemap V2 - All Countries with Filters */}
            <div className="treemap-container-v2">
                <div className="treemap-header-v2">
                    <div className="treemap-title">
                        <h2>📊 COVID-19 Treemap Visualization</h2>
                        <p className="subtitle">Explore {treemapData.length} countries - {selectedMetric} cases</p>
                    </div>

                    {/* Control Panel */}
                    <div className="treemap-controls">
                        {/* Search */}
                        <div className="control-group">
                            <input
                                type="text"
                                placeholder="🔍 Search country..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {/* Continent Filter */}
                        <div className="control-group">
                            <select 
                                value={selectedContinent} 
                                onChange={(e) => setSelectedContinent(e.target.value)}
                                className="filter-select"
                            >
                                {continents.map(continent => (
                                    <option key={continent} value={continent}>
                                        {continent === "All" ? "🗺️ All Continents" : `🗺️ ${continent}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Display Mode */}
                        <div className="control-group">
                            <div className="button-group">
                                <button
                                    className={`mode-btn ${displayMode === "top50" ? "active" : ""}`}
                                    onClick={() => setDisplayMode("top50")}
                                >
                                    Top 50
                                </button>
                                <button
                                    className={`mode-btn ${displayMode === "all" ? "active" : ""}`}
                                    onClick={() => setDisplayMode("all")}
                                >
                                    All Countries
                                </button>
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="control-group">
                            <div className="button-group">
                                <button
                                    className={`mode-btn ${sortBy === "value" ? "active" : ""}`}
                                    onClick={() => setSortBy("value")}
                                >
                                    By Value
                                </button>
                                <button
                                    className={`mode-btn ${sortBy === "name" ? "active" : ""}`}
                                    onClick={() => setSortBy("name")}
                                >
                                    By Name
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="treemap-wrapper-v2">
                    <div className="treemap-scroll-container">
                        {treemapData.length === 0 ? (
                            <div className="no-data-message">
                                <p>No data available for the selected filters</p>
                            </div>
                        ) : (
                            <div className="treemap-chart">
                                <Treemap
                                    width={treemapDimensions.width}
                                    height={treemapDimensions.height}
                                data={treemapData}
                                dataKey="size"
                                stroke="#fff"
                                fill="#82ca9d"
                                animationBegin={0}
                                animationDuration={0}
                                isAnimationActive={false}
                                content={({ x, y, width, height, name, size }) => {
                                    // Validate cell data before rendering
                                    if (width <= 15 || height <= 12) return <g></g>;
                                    if (!name || name === 'NaN' || name === 'undefined' || name === 'null') return <g></g>;
                                    if (!size || isNaN(size) || size <= 0) return <g></g>;

                                    // Calculate opacity based on size for better visual hierarchy
                                    const opacity = 0.75 + (size / maxTreemapSize) * 0.25;

                                    // Dynamic font size - smaller to fit more countries
                                    const fontSize = Math.min(width / 5, height / 2.2, 12);
                                    const smallFont = fontSize * 0.7;

                                    // Professional color scheme with depth
                                    const colorSchemes = {
                                        Confirmed: {
                                            primary: 'rgb(52, 152, 219)',
                                            secondary: 'rgb(41, 128, 185)',
                                            accent: 'rgba(52, 152, 219, 0.2)'
                                        },
                                        Deaths: {
                                            primary: 'rgb(231, 76, 60)',
                                            secondary: 'rgb(192, 57, 43)',
                                            accent: 'rgba(231, 76, 60, 0.2)'
                                        },
                                        Recovered: {
                                            primary: 'rgb(46, 204, 113)',
                                            secondary: 'rgb(39, 174, 96)',
                                            accent: 'rgba(46, 204, 113, 0.2)'
                                        }
                                    };

                                    const scheme = colorSchemes[selectedMetric];
                                    const gradientId = `grad-${name?.replace(/[^a-zA-Z0-9]/g, '')}-${selectedMetric}`;
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
                                                    <stop offset="0%" stopColor={scheme.primary} stopOpacity={opacity} />
                                                    <stop offset="100%" stopColor={scheme.secondary} stopOpacity={opacity * 0.9} />
                                                </linearGradient>
                                                <filter id={`shadow-${gradientId}`}>
                                                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                                                </filter>
                                            </defs>
                                            <rect
                                                x={x}
                                                y={y}
                                                width={width}
                                                height={height}
                                                fill={`url(#${gradientId})`}
                                                stroke={isHovered ? "#2c3e50" : "rgba(255, 255, 255, 0.8)"}
                                                strokeWidth={0.5}
                                                rx={1}
                                                ry={1}
                                                style={{
                                                    filter: isHovered ? `brightness(1.15)` : 'none',
                                                    transition: 'none',
                                                }}
                                            />
                                            {/* Country Name */}
                                            <text
                                                x={x + width / 2}
                                                y={y + height / 2 - fontSize / 3}
                                                textAnchor="middle"
                                                fill="#fff"
                                                fontSize={fontSize}
                                                fontWeight={isHovered ? "700" : "600"}
                                                style={{
                                                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)',
                                                    pointerEvents: 'none',
                                                    letterSpacing: '0.3px'
                                                }}
                                            >
                                                {name}
                                            </text>
                                            {/* Case Count */}
                                            <text
                                                x={x + width / 2}
                                                y={y + height / 2 + fontSize / 2}
                                                textAnchor="middle"
                                                fill="rgba(255, 255, 255, 0.95)"
                                                fontSize={smallFont}
                                                fontWeight={isHovered ? "600" : "500"}
                                                style={{
                                                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
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
                        )}
                    </div>

                    {/* Stats Footer */}
                    <div className="treemap-footer">
                        <div className="stat-badge">
                            <span className="stat-label">Showing:</span>
                            <span className="stat-value">{treemapData.length} countries</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-label">Total {selectedMetric}:</span>
                            <span className="stat-value">{formatNumber(treemapData.reduce((sum, d) => sum + d.size, 0))}</span>
                        </div>
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

            {/* Footer */}
            <footer className="footer">
                <p>Last updated: {totals.LastUpdate ? new Date(totals.LastUpdate).toLocaleDateString() : "N/A"} | Data source: COVID-19 API</p>
            </footer>
        </div>
    );
}

export default App;
