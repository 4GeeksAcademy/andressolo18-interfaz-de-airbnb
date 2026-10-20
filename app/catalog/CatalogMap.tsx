"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APIProvider, AdvancedMarker, InfoWindow, Map, Pin, useApiLoadingStatus, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { Stay } from "../stays";

function MapContents({ items }: { items: Stay[] }) {
  const map = useMap();
  const core = useMapsLibrary("core");
  const status = useApiLoadingStatus();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedStay = items.find((stay) => stay.id === selectedId);

  useEffect(() => {
    if (!map || !core || !items.length) return;
    const bounds = new core.LatLngBounds();
    items.forEach((stay) => bounds.extend(stay.coordinates));
    map.fitBounds(bounds, 45);
    if (items.length === 1) map.setZoom(15);
  }, [map, core, items]);

  if (status === "FAILED" || status === "AUTH_FAILURE") {
    return <p role="alert" className="catalog-map-message">No se pudo cargar Google Maps. Revisa la clave y sus restricciones.</p>;
  }

  return <>
    {status !== "LOADED" && <p role="status" className="catalog-map-message">Cargando mapa...</p>}
    <Map mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"} defaultCenter={items[0].coordinates} defaultZoom={12} gestureHandling="cooperative" disableDefaultUI={false} style={{ width: "100%", height: "100%" }}>
      {items.map((stay) => <AdvancedMarker key={stay.id} position={stay.coordinates} title={stay.title} onClick={() => setSelectedId(stay.id)}>
        <Pin background="#ff385c" borderColor="#be2140" glyphColor="#ffffff" />
      </AdvancedMarker>)}
      {selectedStay && <InfoWindow position={selectedStay.coordinates} onCloseClick={() => setSelectedId(null)}>
        <div className="catalog-map-info"><strong>{selectedStay.title}</strong><p>${new Intl.NumberFormat("es-CL").format(selectedStay.price)} CLP por 9 noches</p><Link href={`/rooms/${selectedStay.id}`}>Ver alojamiento</Link></div>
      </InfoWindow>}
    </Map>
  </>;
}

export default function CatalogMap({ items }: { items: Stay[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return <aside className="catalog-map" aria-label="Mapa de alojamientos">
    {!items.length ? <p className="catalog-map-message">No hay alojamientos para mostrar en el mapa.</p> : !apiKey ? <p role="status" className="catalog-map-message">Google Maps no está configurado. Falta la clave de API.</p> : <APIProvider apiKey={apiKey} language="es" region="CL"><MapContents items={items} /></APIProvider>}
  </aside>;
}