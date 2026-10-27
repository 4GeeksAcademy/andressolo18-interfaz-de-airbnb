import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { stays } from "../stays";
import CatalogStayList from "./CatalogStayList";
import CatalogMap from "./CatalogMap";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<main className="min-h-screen px-[18px] pb-10 min-[900px]:px-10 min-[900px]:pb-14"><p role="status" className="py-8">Cargando alojamientos...</p></main>}><CatalogResults searchParams={searchParams} /></Suspense>;
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
    <main className="min-h-screen px-[18px] pb-10 min-[900px]:px-10 min-[900px]:pb-14">
      <nav className="flex min-h-[66px] items-center justify-between border-b border-[#ebebeb] min-[900px]:min-h-[82px]" aria-label="Navegación de resultados">
        <Link className="text-2xl font-bold text-[#ff385c] min-[900px]:text-[28px]" href="/">airbnb</Link>
        <Link className="inline-flex items-center gap-2 rounded-[22px] border border-[#ebebeb] px-[10px] py-2 text-xs font-semibold hover:bg-[#f7f7f7] min-[900px]:px-[14px] min-[900px]:py-[10px] min-[900px]:text-sm" href="/"><Search size={17} />Modificar búsqueda</Link>
      </nav>
      <section className="py-[22px] pb-[18px] min-[900px]:py-[27px] min-[900px]:pb-[22px]">
        <p className="text-[11px] font-bold text-[#6a6a6a]">RESULTADOS DE BÚSQUEDA</p>
        <h1 className="my-[7px] text-[22px] font-bold min-[900px]:text-[27px]">{destination ? `Alojamientos en ${destination}` : "Alojamientos disponibles"}</h1>
        <p className="text-[#6a6a6a]">{filteredStays.length} alojamientos{arrival && departure ? ` · ${arrival} – ${departure}` : ""}{guestCount ? ` · ${guestCount} huéspedes` : ""}{pets ? ` · ${pets} mascotas` : ""}</p>
      </section>
      <div className="grid grid-cols-1 items-start gap-[18px] min-[900px]:grid-cols-[minmax(0,1.35fr)_minmax(300px,.9fr)] min-[900px]:gap-[25px]">
        <CatalogStayList items={filteredStays} />
        <CatalogMap items={filteredStays} />
      </div>
    </main>
  );
}