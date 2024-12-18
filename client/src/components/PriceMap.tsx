import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import type { Property } from '@db/schema';
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Icon, LatLngTuple } from 'leaflet';
import L from 'leaflet';

const DefaultIcon: Icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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
  const center: LatLngTuple = [46.603354, 1.888334];
  
  const markersData = useMemo(() => {
    return properties.filter(property => property.latitude && property.longitude)
      .map(property => ({
        ...property,
        position: [
          parseFloat(property.latitude!),
          parseFloat(property.longitude!)
        ] as LatLngTuple
      }));
  }, [properties]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
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
