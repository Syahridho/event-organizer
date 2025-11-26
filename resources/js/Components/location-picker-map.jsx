import { useEffect } from "react";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { loadLeafletCSS } from "@/Utils/loadCSS";

// Fix untuk ikon Leaflet - gunakan CDN yang lebih stabil
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function PinMarker({ pin, onPinChange }) {
    useMapEvents({
        click(e) {
            const newPin = [e.latlng.lat, e.latlng.lng];
            onPinChange(newPin);
        },
    });

    if (!pin || !Array.isArray(pin) || pin.length !== 2) return null;

    return (
        <Marker position={pin}>
            <Popup>
                Lokasi: <br />
                {pin[0].toFixed(4)}, {pin[1].toFixed(4)}
            </Popup>
        </Marker>
    );
}

function MapUpdater({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position && Array.isArray(position) && position.length === 2) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);

    return null;
}

export default function LocationPickerMap({ pin, onPinChange }) {
    // Validasi pin dengan default yang aman
    const validPin =
        pin && Array.isArray(pin) && pin.length === 2
            ? pin
            : [0.5071, 101.4478]; // Default Pekanbaru

    // Load Leaflet CSS dynamically
    useEffect(() => {
        loadLeafletCSS().catch((err) => {
            console.error("Failed to load Leaflet CSS:", err);
        });
    }, []);

    // Generate unique key for map instance to prevent conflicts
    const mapKey = `map-${validPin[0]}-${validPin[1]}`;

    return (
        <div
            className="leaflet-container"
            style={{
                height: "300px",
                width: "100%",
                position: "relative",
                display: "block",
                margin: "0",
                padding: "0",
                overflow: "hidden",
                borderRadius: "0.5rem",
                border: "1px solid hsl(var(--border))",
            }}
        >
            <MapContainer
                key={mapKey}
                center={validPin}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    zIndex: 1,
                }}
                zoomControl={true}
            >
                <TileLayer
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <PinMarker pin={validPin} onPinChange={onPinChange} />
                <MapUpdater position={validPin} />
            </MapContainer>
        </div>
    );
}
