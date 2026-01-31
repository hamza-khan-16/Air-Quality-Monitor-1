import { useState, useEffect } from "react";

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  loading: boolean;
  error: string | null;
}

export function useDeviceLocation(): DeviceLocation {
  const [location, setLocation] = useState<DeviceLocation>({
    latitude: 0,
    longitude: 0,
    city: null,
    country: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: "Geolocation not supported",
        city: "Unknown Location",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await response.json();
          
          const city = data.address?.city || 
                       data.address?.town || 
                       data.address?.village || 
                       data.address?.county ||
                       "Unknown";
          const country = data.address?.country || "";
          
          setLocation({
            latitude,
            longitude,
            city,
            country,
            loading: false,
            error: null,
          });
        } catch {
          setLocation({
            latitude,
            longitude,
            city: "Your Location",
            country: "",
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        setLocation({
          latitude: 0,
          longitude: 0,
          city: "Location Unavailable",
          country: "",
          loading: false,
          error: error.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return location;
}
