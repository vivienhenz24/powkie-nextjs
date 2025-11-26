"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Harvard coordinates
const HARVARD_CENTER: [number, number] = [-71.1167, 42.3770];

export function HomeMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: HARVARD_CENTER,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add a marker at Harvard


    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div ref={mapContainer} className="flex-1 w-full" />
    </div>
  );
}

