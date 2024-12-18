import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import type { Property } from '@db/schema';
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { LatLngExpression } from 'leaflet';

// Fix for leaflet default marker icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PriceMapProps {
  properties: Property[];
}

interface PropertyMarker extends Property {
  position: [number, number];
}

export function PriceMap({ properties }: PriceMapProps) {
  // Default to France center coordinates
  const center: LatLngExpression = [46.603354, 1.888334];
  
  const markersData = useMemo(() => {
    return properties.map(property => {
      // Si les coordonnées sont disponibles, les utiliser
      if (property.latitude && property.longitude) {
        return {
          ...property,
          position: [
            parseFloat(property.latitude),
            parseFloat(property.longitude)
          ] as [number, number]
        };
      }
      
      // Sinon, générer des coordonnées approximatives pour la France
      // Cela permet d'avoir une visualisation en attendant le géocodage
      const franceBounds = {
        north: 51.089167, // Latitude max France
        south: 42.333333, // Latitude min France
        east: 8.233333,   // Longitude max France
        west: -4.795556   // Longitude min France
      };
      
      return {
        ...property,
        position: [
          franceBounds.south + Math.random() * (franceBounds.north - franceBounds.south),
          franceBounds.west + Math.random() * (franceBounds.east - franceBounds.west)
        ] as [number, number]
      };
    });
  }, [properties]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
        >
          {markersData.map((property) => (
            <Marker
              key={property.id}
              position={property.position}
            >
              <Popup>
                <div className="p-2">
                  <Link href={`/property/${property.id}`}>
                    <div className="cursor-pointer">
                      <h3 className="font-semibold mb-1">{property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{property.location}</p>
                      <Badge>
                        {new Intl.NumberFormat('fr-FR', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        }).format(property.price)}
                      </Badge>
                    </div>
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
