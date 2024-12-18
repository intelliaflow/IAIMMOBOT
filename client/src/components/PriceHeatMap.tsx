import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from "recharts";
import type { Property } from "@db/schema";

interface PriceHeatMapProps {
  properties: Property[];
}

export function PriceHeatMap({ properties }: PriceHeatMapProps) {
  const priceData = useMemo(() => {
    const locationMap = new Map<string, { count: number; totalPrice: number; minPrice: number; maxPrice: number }>();
    
    properties.forEach(property => {
      const current = locationMap.get(property.location) || { 
        count: 0, 
        totalPrice: 0,
        minPrice: Infinity,
        maxPrice: -Infinity
      };
      
      locationMap.set(property.location, {
        count: current.count + 1,
        totalPrice: current.totalPrice + property.price,
        minPrice: Math.min(current.minPrice, property.price),
        maxPrice: Math.max(current.maxPrice, property.price)
      });
    });

    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      averagePrice: data.totalPrice / data.count,
      count: data.count,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice
    }));
  }, [properties]);

  const maxPrice = Math.max(...priceData.map(d => d.averagePrice));
  const minPrice = Math.min(...priceData.map(d => d.averagePrice));

  const getColor = (price: number) => {
    const normalizedPrice = (price - minPrice) / (maxPrice - minPrice);
    // Color gradient from blue (cold/low prices) to red (hot/high prices)
    const hue = ((1 - normalizedPrice) * 240).toString(10);
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Carte des prix par zone</h3>
      <div className="w-full aspect-[16/9]">
        <ScatterChart
          width={800}
          height={400}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <XAxis 
            dataKey="location" 
            type="category" 
            name="Location"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={100}
          />
          <YAxis 
            dataKey="averagePrice" 
            name="Prix moyen"
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M €`}
          />
          <ZAxis 
            dataKey="count" 
            range={[50, 400]} 
            name="Nombre de biens"
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              switch(name) {
                case "Prix moyen":
                  return [`${(value / 1000000).toFixed(2)}M €`, name];
                case "Nombre de biens":
                  return [value, name];
                default:
                  return [value, name];
              }
            }}
          />
          <Scatter data={priceData} shape="circle">
            {priceData.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.averagePrice)} />
            ))}
          </Scatter>
        </ScatterChart>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full" style={{ background: getColor(minPrice) }}></div>
          <span className="text-sm">{(minPrice / 1000000).toFixed(2)}M €</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full" style={{ background: getColor(maxPrice) }}></div>
          <span className="text-sm">{(maxPrice / 1000000).toFixed(2)}M €</span>
        </div>
      </div>
    </div>
  );
}
