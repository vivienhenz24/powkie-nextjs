"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Default address to center map on
const DEFAULT_ADDRESS = "64 Linnaean St, Cambridge, MA";
// Fallback coordinates (approximate location of the address)
const DEFAULT_CENTER: [number, number] = [-71.1205, 42.3805];

interface MapViewProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export function MapView({ onMapReady }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // Geocode the default address to get precise coordinates
    const geocodeAddress = async () => {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        // Use fallback if no token
        return DEFAULT_CENTER;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(DEFAULT_ADDRESS)}.json?access_token=${mapboxToken}&limit=1`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          return [lng, lat] as [number, number];
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
      }
      return DEFAULT_CENTER;
    };

    const initializeMap = async () => {
      if (map.current || !mapContainer.current) return;

      // Get precise coordinates for the address
      const mapCenter = await geocodeAddress();

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        // Dark mode themed map style
        style: "mapbox://styles/mapbox/dark-v11",
        center: mapCenter,
        zoom: 15,
      });

      // Notify parent when map is ready
      map.current.on("load", () => {
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
      });
    };

    initializeMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapReady]);

  return <div ref={mapContainer} className="h-full w-full" />;
}
