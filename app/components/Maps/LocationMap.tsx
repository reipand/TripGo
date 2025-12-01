'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title: string;
    description?: string;
    type: 'airport' | 'station' | 'hotel' | 'attraction';
  }>;
  height?: string;
  className?: string;
}

// Component to handle map updates
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

const createCustomIcon = (type: string) => {
  const colors = {
    airport: 'blue',
    station: 'green',
    hotel: 'orange',
    attraction: 'purple'
  };

  return L.divIcon({
    html: `
      <div style="
        background-color: ${colors[type as keyof typeof colors] || 'red'};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">
        ${type === 'airport' ? '✈️' : type === 'station' ? '🚆' : type === 'hotel' ? '🏨' : '🏛️'}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const LocationMap: React.FC<MapProps> = ({
  center,
  zoom = 13,
  markers = [],
  height = '400px',
  className = '',
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat peta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={zoom} />

        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={createCustomIcon(marker.type)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{marker.title}</h3>
                {marker.description && (
                  <p className="text-gray-600 mt-1">{marker.description}</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  {marker.type === 'airport' && 'Bandara'}
                  {marker.type === 'station' && 'Stasiun Kereta'}
                  {marker.type === 'hotel' && 'Hotel'}
                  {marker.type === 'attraction' && 'Tempat Wisata'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Airport Map Component
export const AirportMap: React.FC<{ airport: any }> = ({ airport }) => {
  const markers = [
    {
      position: [airport.latitude, airport.longitude] as [number, number],
      title: airport.name,
      description: `Bandara ${airport.city} (${airport.code})`,
      type: 'airport' as const,
    },
    ...(airport.terminals || []).map((terminal: any, index: number) => ({
      position: [
        airport.latitude + (Math.random() - 0.5) * 0.01,
        airport.longitude + (Math.random() - 0.5) * 0.01
      ] as [number, number],
      title: `Terminal ${terminal.name}`,
      description: `Gates: ${terminal.gates.join(', ')}`,
      type: 'airport' as const,
    }))
  ];

  return (
    <LocationMap
      center={[airport.latitude, airport.longitude]}
      zoom={14}
      markers={markers}
      height="300px"
      className="mt-4"
    />
  );
};