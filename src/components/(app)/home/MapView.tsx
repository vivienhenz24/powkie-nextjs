"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Harvard coordinates
const HARVARD_CENTER: [number, number] = [-71.1167, 42.3770];

// Harvard Houses coordinates (accurate coordinates from data.cambridgema.gov)
const HARVARD_HOUSES = [
  { name: "Adams", address: "26 Plympton St", coordinates: [-71.116784, 42.371754] as [number, number] },
  { name: "Cabot", address: "60 Linnaean St", coordinates: [-71.124724, 42.381210] as [number, number] },
  { name: "Currier", address: "64 Linnaean St", coordinates: [-71.125743, 42.382171] as [number, number] },
  { name: "Dunster", address: "945 Memorial Dr", coordinates: [-71.115827, 42.368632] as [number, number] },
  { name: "Eliot", address: "101 Dunster St", coordinates: [-71.120821, 42.370232] as [number, number] },
  { name: "Kirkland", address: "95 Dunster St", coordinates: [-71.120408, 42.370773] as [number, number] },
  { name: "Leverett", address: "28 DeWolfe St", coordinates: [-71.116742, 42.369379] as [number, number] },
  { name: "Lowell", address: "10 Holyoke Pl", coordinates: [-71.118213, 42.371178] as [number, number] },
  { name: "Mather", address: "10 Cowperthwaite St", coordinates: [-71.115100, 42.368600] as [number, number] },
  { name: "Pforzheimer", address: "56 Linnaean St", coordinates: [-71.124670, 42.381950] as [number, number] },
  { name: "Quincy", address: "58 Plympton St", coordinates: [-71.117086, 42.371116] as [number, number] },
  { name: "Winthrop", address: "32 Mill St", coordinates: [-71.118609, 42.370399] as [number, number] },
];

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
      style: "mapbox://styles/mapbox/light-v11",
      center: HARVARD_CENTER,
      zoom: 14,
    });

    // Add markers for each Harvard house
    HARVARD_HOUSES.forEach((house) => {
      new mapboxgl.Marker()
        .setLngLat(house.coordinates)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<h3>${house.name} House</h3><p class="text-sm text-muted-foreground">${house.address}</p>`
          )
        )
        .addTo(map.current!);
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
