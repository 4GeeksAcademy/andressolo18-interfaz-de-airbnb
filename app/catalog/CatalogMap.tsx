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
    return <p role="alert" className="absolute inset-0 grid place-content-center p-6 text-center text-sm">No se pudo cargar Google Maps. Revisa la clave y sus restricciones.</p>;
  }

  return <>
    {status !== "LOADED" && <p role="status" className="absolute inset-0 grid place-content-center p-6 text-center text-sm">Cargando mapa...</p>}
    <Map className="absolute inset-0 h-full w-full" mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"} defaultCenter={items[0].coordinates} defaultZoom={12} gestureHandling="cooperative" disableDefaultUI={false}>
      {items.map((stay) => <AdvancedMarker key={stay.id} position={stay.coordinates} title={stay.title} onClick={() => setSelectedId(stay.id)}>
        <Pin background="#ff385c" borderColor="#be2140" glyphColor="#ffffff" />
      </AdvancedMarker>)}
      {selectedStay && <InfoWindow position={selectedStay.coordinates} onCloseClick={() => setSelectedId(null)}>
        <div className="max-w-[220px] leading-6"><strong>{selectedStay.title}</strong><p className="my-[6px]">${new Intl.NumberFormat("es-CL").format(selectedStay.price)} CLP por 9 noches</p><Link className="underline" href={`/rooms/${selectedStay.id}`}>Ver alojamiento</Link></div>
      </InfoWindow>}
    </Map>
  </>;
}

export default function CatalogMap({ items }: { items: Stay[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return <aside className="relative h-[320px] min-w-0 overflow-hidden rounded-lg border border-[#dedede] bg-[#ebebeb] text-[#222] min-[900px]:sticky min-[900px]:top-4 min-[900px]:row-auto min-[900px]:h-[min(660px,calc(100vh-32px))] min-[900px]:rounded-[14px]" aria-label="Mapa de alojamientos">
    {!items.length ? <p role="status" className="absolute inset-0 grid place-content-center p-6 text-center text-sm">No hay alojamientos para mostrar en el mapa.</p> : !apiKey ? <p role="status" className="absolute inset-0 grid place-content-center p-6 text-center text-sm">Google Maps no está configurado. Falta la clave de API.</p> : <APIProvider apiKey={apiKey} language="es" region="CL"><MapContents items={items} /></APIProvider>}
  </aside>;
}