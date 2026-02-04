"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function TestMapsPage() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing");
      return;
    }

    // Check if script already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      initMap();
    };

    document.head.appendChild(script);

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    new window.google.maps.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      zoom: 10,
    });
  };

  return (
    <div>
      <div ref={mapRef} style={{ width: "100vw", height: "100vh" }} />
    </div>
  );
}
