import { useEffect, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import "./App.css";

interface CovidData {
    CountryRegion: string;
    Confirmed: number;
}

const geoUrl = "map.json";

function App() {
    const [data, setData] = useState<CovidData[]>([]);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const response = await fetch(
            "https://localhost:7049/odata/CovidConfirmed?$filter=CountryRegion eq 'Vietnam'"
        );
        if (response.ok) {
            const json = await response.json();

            // group theo CountryRegion => lấy số Confirmed mới nhất
            const latestByCountry: Record<string, number> = {};
            json.value.forEach((item: any) => {
                if (!latestByCountry[item.CountryRegion]) {
                    latestByCountry[item.CountryRegion] = item.Confirmed;
                }
            });

            const mapped: CovidData[] = Object.entries(latestByCountry).map(
                ([country, confirmed]) => ({
                    CountryRegion: country,
                    Confirmed: confirmed,
                })
            );

            setData(mapped);
        }
    };

    // scale màu theo confirmed cases
    const maxCases = Math.max(...data.map((d) => d.Confirmed), 1);
    const colorScale = scaleLinear<string>()
        .domain([0, maxCases * 0.1, maxCases * 0.3, maxCases * 0.6, maxCases])
        .range(["#f7f7f7", "#fee5d9", "#fcae91", "#fb6a4a", "#cb181d"]);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    const handleMouseEnter = (event: React.MouseEvent, geo: any, countryData?: CovidData) => {
        const cases = countryData ? countryData.Confirmed : 0;
        setTooltip({
            x: event.clientX,
            y: event.clientY,
            content: `${geo.properties.name}: ${formatNumber(cases)} cases`
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const getLegendData = () => {
        const steps = [0, maxCases * 0.1, maxCases * 0.3, maxCases * 0.6, maxCases];
        return steps.map((value, index) => ({
            color: colorScale(value),
            label: index === 0 ? '0' : index === steps.length - 1 ? `${formatNumber(Math.round(value))}+` : `${formatNumber(Math.round(value))}`
        }));
    };

    return (
        <div className="app-container">
            <div className="header">
                <h1>COVID-19 Global Cases</h1>
                <p>Interactive world map showing confirmed cases by country</p>
            </div>
            
            <div className="map-container">
                <div className="map-wrapper">
                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{ 
                            scale: 180,
                            center: [0, 15]
                        }}
                        width={1000}
                        height={700}
                        style={{ width: "100%", height: "auto" }}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryData = data.find(
                                        (d) => d.CountryRegion === geo.properties.name
                                    );
                                    const color = countryData
                                        ? colorScale(countryData.Confirmed)
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
                                                    fill: "#ff6b6b",
                                                    outline: "none",
                                                    cursor: "pointer",
                                                },
                                                pressed: {
                                                    fill: "#ff4757",
                                                    outline: "none",
                                                },
                                            }}
                                            onMouseEnter={(event) => handleMouseEnter(event, geo, countryData)}
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
                                <span>{item.label}</span>
                            </div>
                        ))}
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