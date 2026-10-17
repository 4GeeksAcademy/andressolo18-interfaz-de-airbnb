import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Search } from "lucide-react";
import { stays } from "../stays";
import { StayCard } from "../components/StayCard";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<main className="route-page catalog-page"><p>Cargando alojamientos...</p></main>}><CatalogResults searchParams={searchParams} /></Suspense>;
}

async function CatalogResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const destination = first(params.destination);
  const arrival = first(params.arrival);
  const departure = first(params.departure);
  const adults = Number(first(params.adults)) || 0;
  const children = Number(first(params.children)) || 0;
  const infants = Number(first(params.infants)) || 0;
  const pets = Number(first(params.pets)) || 0;
  const guestCount = adults + children + infants;
  const filteredStays = stays.filter((stay) => !destination || normalize(`${stay.city} ${stay.title}`).includes(normalize(destination)));

  return (
    <main className="route-page catalog-page">
      <nav className="route-nav" aria-label="Navegación de resultados">
        <Link className="route-brand" href="/">airbnb</Link>
        <Link className="route-search-link" href="/"><Search size={17} />Modificar búsqueda</Link>
      </nav>
      <section className="route-heading">
        <p className="route-eyebrow">RESULTADOS DE BÚSQUEDA</p>
        <h1>{destination ? `Alojamientos en ${destination}` : "Alojamientos disponibles"}</h1>
        <p>{filteredStays.length} alojamientos{arrival && departure ? ` · ${arrival} – ${departure}` : ""}{guestCount ? ` · ${guestCount} huéspedes` : ""}{pets ? ` · ${pets} mascotas` : ""}</p>
      </section>
      <div className="catalog-layout">
        <section className="catalog-grid" aria-label="Alojamientos disponibles">
          {filteredStays.map((stay) => <StayCard key={stay.id} stay={stay} variant="catalog" />)}
          {!filteredStays.length && <div className="catalog-empty"><MapPin size={35} /><h2>No encontramos alojamientos</h2><p>Prueba con Viña del Mar, Santiago o Pucón.</p><Link href="/">Volver a buscar</Link></div>}
        </section>
        <aside className="catalog-map" aria-label="Mapa ilustrativo de alojamientos">
          <span className="map-label">Ubicaciones de muestra</span>
          <div className="map-road map-road-one" /><div className="map-road map-road-two" /><div className="map-road map-road-three" />
          {filteredStays.slice(0, 8).map((stay, index) => <span key={stay.id} className={`map-marker map-marker-${index}`} title={stay.city}><MapPin size={25} fill="currentColor" /></span>)}
          <p>Mapa ilustrativo</p>
        </aside>
      </div>
    </main>
  );
}