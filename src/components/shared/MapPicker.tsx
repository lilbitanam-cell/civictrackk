import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue with Leaflet in React
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapPickerProps {
  /** initial center */
  center?: { lat: number; lng: number };
  /** callback when location changes */
  onChange: (loc: { lat: number; lng: number }) => void;
}

const MapContainerAny: any = MapContainer;
const TileLayerAny: any = TileLayer;
const MarkerAny: any = Marker;

function ClickHandler({ onChange }: { onChange: (loc: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    click(e: any) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({ center = { lat: 28.6139, lng: 77.209 }, onChange }: MapPickerProps) {
  const [position, setPosition] = useState(center);

  useEffect(() => {
    onChange(position);
  }, [position, onChange]);

  return (
    <MapContainerAny center={center} zoom={13} style={{ height: '300px', width: '100%' }}>
      <TileLayerAny attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerAny position={position} />
      <ClickHandler onChange={setPosition} />
    </MapContainerAny>
  );
}
