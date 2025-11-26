import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import LocationPickerMap from "@/components/location-picker-map";
import useDebounce from "@/Utils/useDebounce";

export default function LocationInputWithMap({
    isEditing,
    location,
    pin,
    onLocationChange,
    onPinChange,
    isLoadingSearch,
    setIsLoadingSearch,
    initialLocationFromDB = "",
}) {
    const debounce = useDebounce(location, 500);
    const formRef = useRef(null);
    const isFirstRun = useRef(true);

    const handleSearch = async (query) => {
        setIsLoadingSearch(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
                {
                    headers: {
                        "User-Agent": "2255201047@filkom.unilak.ac.id", // Ganti sesuai kebijakan
                    },
                }
            );
            const data = await res.json();
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                onPinChange([lat, lon]);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setIsLoadingSearch(false);
        }
    };

    useEffect(() => {
        if (!debounce) return;

        const isManualSearch = isEditing && debounce !== initialLocationFromDB;
        const shouldSearch = !isEditing || isManualSearch;

        if (shouldSearch) {
            handleSearch(debounce);
        }
    }, [debounce, isEditing, initialLocationFromDB]);

    return (
        <div className="space-y-2">
            <div className="relative grid gap-2">
                <Label htmlFor="pin">Lokasi</Label>
                <Input
                    id="pin"
                    type="text"
                    placeholder="Lokasi"
                    value={location}
                    onChange={(e) => onLocationChange(e.target.value)}
                    required
                />

                {isLoadingSearch && (
                    <LoaderCircle className="absolute right-2.5 bottom-2.5 h-4 w-4 animate-spin text-gray-300" />
                )}
            </div>

            <div 
                className="map-wrapper w-full" 
                style={{ 
                    height: "300px",
                    position: "relative",
                    overflow: "hidden",
                    marginTop: "0.5rem"
                }}
            >
                <LocationPickerMap pin={pin} onPinChange={onPinChange} />
            </div>
        </div>
    );
}
