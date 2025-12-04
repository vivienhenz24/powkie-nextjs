"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Harvard coordinates (used as initial center)
const HARVARD_CENTER: [number, number] = [-71.1167, 42.3770];

interface MapViewProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export function MapView({ onMapReady }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // Dark mode themed map style
      style: "mapbox://styles/mapbox/dark-v11",
      center: HARVARD_CENTER,
      zoom: 14,
    });

    // Notify parent when map is ready
    map.current.on("load", () => {
      if (onMapReady && map.current) {
        onMapReady(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [onMapReady]);

  return <div ref={mapContainer} className="h-full w-full" />;
}
