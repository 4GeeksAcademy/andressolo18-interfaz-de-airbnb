"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, Minus, Plus, Star, Users, Wifi } from "lucide-react";
import { stays } from "../../stays";
import type { Stay } from "../../stays";
import RoomActions from "./RoomActions";

const amenities = [
  { icon: Wifi, label: "Wifi" },
  { icon: Users, label: "Espacio para 4 huéspedes" },
  { icon: Check, label: "Alojamiento completo" },
];

function money(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

function RoomLoading() {
  return <main className="mx-auto min-h-screen max-w-[1440px] px-[18px] pb-10 min-[900px]:px-10 min-[900px]:pb-14" aria-busy="true"><p className="py-8" role="status">Cargando alojamiento...</p></main>;
}

function RoomGallery({ stay }: { stay: Stay }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = [
    { src: stay.image, alt: `Interior de ${stay.title}` },
    { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85", alt: "Foto de ejemplo de una sala de estar" },
    { src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=85", alt: "Foto de ejemplo de un apartamento" },
    { src: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=85", alt: "Foto de ejemplo de una cocina" },
  ];
  const currentPhoto = photos[photoIndex];

  return <section className="relative mb-6 aspect-[1.2] overflow-hidden rounded-[9px] bg-[#f7f7f7] min-[900px]:aspect-[1.75] min-[900px]:rounded-[14px]" aria-label="Galería de fotos del alojamiento" aria-roledescription="carrusel">
    <Image className="object-cover" src={currentPhoto.src} alt={currentPhoto.alt} fill sizes="(max-width: 900px) 100vw, 1280px" priority unoptimized />
    <button type="button" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-md hover:bg-gray-100" aria-label="Anterior" title="Anterior" onClick={() => setPhotoIndex((index) => (index - 1 + photos.length) % photos.length)}><ArrowLeft size={20} /></button>
    <button type="button" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-md hover:bg-gray-100" aria-label="Siguiente" title="Siguiente" onClick={() => setPhotoIndex((index) => (index + 1) % photos.length)}><ArrowRight size={20} /></button>
    <p className="absolute bottom-3 right-3 rounded-md bg-black/75 px-3 py-1 text-sm text-white" aria-live="polite" aria-atomic="true">Foto {photoIndex + 1} de {photos.length}</p>
  </section>;
}

function RoomBooking({ stay }: { stay: Stay }) {
  const minGuests = 1;
  const maxGuests = 4;
  const [guests, setGuests] = useState(2);
  const [notice, setNotice] = useState("");
  const nightlyPrice = Math.round(stay.price / 9);

  function changeGuests(change: number) {
    setGuests((current) => Math.min(maxGuests, Math.max(minGuests, current + change)));
    setNotice("");
  }

  return <aside className="row-start-1 rounded-xl border border-[#ebebeb] p-[18px] shadow-[0_5px_20px_#00000012] min-[900px]:sticky min-[900px]:top-[18px] min-[900px]:row-auto min-[900px]:p-[23px]" aria-label="Reserva del alojamiento">
    <p className="text-sm"><strong className="text-xl">${money(nightlyPrice)} CLP</strong> por noche</p>
    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-sm font-semibold">Huéspedes</h2><p className="text-xs text-[var(--muted)]">Máximo {maxGuests} personas</p></div>
      <div className="flex shrink-0 items-center gap-[14px]" role="group" aria-label="Cantidad de huéspedes">
        <button type="button" className="grid h-[33px] w-[33px] place-items-center rounded-full border border-[#bdbdbd] text-[#222] hover:enabled:border-[#222] disabled:cursor-default disabled:opacity-30" aria-label="Reducir huéspedes" title="Reducir huéspedes" disabled={guests <= minGuests} onClick={() => changeGuests(-1)}><Minus size={16} aria-hidden="true" /></button>
        <span className="min-w-4 text-center text-[15px]" aria-live="polite" aria-atomic="true" aria-label={`${guests} ${guests === 1 ? "huésped" : "huéspedes"}`}>{guests}</span>
        <button type="button" className="grid h-[33px] w-[33px] place-items-center rounded-full border border-[#bdbdbd] text-[#222] hover:enabled:border-[#222] disabled:cursor-default disabled:opacity-30" aria-label="Aumentar huéspedes" title="Aumentar huéspedes" disabled={guests >= maxGuests} onClick={() => changeGuests(1)}><Plus size={16} aria-hidden="true" /></button>
      </div>
    </div>
    <button type="button" className="flex min-h-12 w-full items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] font-bold text-white hover:bg-[#cf1649]" onClick={() => setNotice(`Reserva de demostración para ${guests} ${guests === 1 ? "huésped" : "huéspedes"}. No se ha realizado ninguna reserva ni cobro.`)}>Reservar</button>
    <p className="mt-3 text-center text-xs text-[#6a6a6a]">${money(stay.price)} CLP en total por 9 noches</p>
    {notice && <p role="status" className="mt-3 text-sm leading-5">{notice}</p>}
  </aside>;
}

export default function RoomPage() {
  return <Suspense fallback={<RoomLoading />}><RoomRoute /></Suspense>;
}

function RoomRoute() {
  const { id } = useParams<{ id: string }>();
  return <RoomDetails key={id} id={id} />;
}

function RoomDetails({ id }: { id: string }) {
  const [stay, setStay] = useState<Stay | null>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setStay(stays.find((item) => String(item.id) === id) ?? null);
    }, 800);
    return () => clearTimeout(timer);
  }, [id]);

  if (stay === undefined) return <RoomLoading />;
  if (!stay) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-[18px] pb-10 min-[900px]:px-10 min-[900px]:pb-14">
      <nav className="flex min-h-[66px] items-center justify-between border-b border-[#ebebeb] min-[900px]:min-h-[82px]" aria-label="Navegación del alojamiento">
        <Link className="text-2xl font-bold text-[#ff385c] min-[900px]:text-[28px]" href="/">airbnb</Link>
        <Link className="inline-flex items-center gap-2 rounded-[22px] border border-[#ebebeb] px-[10px] py-2 text-xs font-semibold hover:bg-[#f7f7f7] min-[900px]:px-[14px] min-[900px]:py-[10px] min-[900px]:text-sm" href="/catalog"><ArrowLeft size={17} />Volver a los alojamientos</Link>
      </nav>
      <header className="py-[18px] pb-[14px] min-[900px]:py-6 min-[900px]:pb-[17px]">
        <h1 className="mb-3 text-[22px] font-bold min-[900px]:text-[27px]">{stay.title}</h1>
        <div className="flex flex-wrap items-center gap-[10px] min-[900px]:flex-nowrap min-[900px]:gap-[18px]">
          <span className="inline-flex items-center gap-[5px] text-[13px] font-semibold" aria-label={`Valoración: ${stay.rating} de 5 estrellas`}><Star size={14} fill="currentColor" aria-hidden="true" />{stay.rating} / 5</span>
          <span className="inline-flex items-center gap-[5px] text-[13px] font-semibold">{stay.reviewCount} {stay.reviewCount === 1 ? "reseña" : "reseñas"}</span>
          <span className="inline-flex items-center gap-[5px] text-[13px] font-semibold"><MapPin size={14} aria-hidden="true" />{stay.city}, Chile</span>
          <RoomActions title={stay.title} />
        </div>
      </header>
      <RoomGallery stay={stay} />
      <div className="grid grid-cols-1 items-start gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_330px] min-[900px]:gap-[42px]">
        <div className="min-w-0">
          <section className="flex items-center justify-between border-b border-[#ebebeb] py-[25px]">
            <div><h2 className="text-xl font-semibold">Alojamiento entero en {stay.city}</h2><p className="mt-[5px] text-[#6a6a6a]">4 huéspedes · 2 habitaciones · 2 camas · 1 baño</p></div>
          </section>
          <section className="flex items-center gap-3 border-b border-[#ebebeb] py-6" aria-label="Información del anfitrión">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e7eee9] text-xl" role="img" aria-label={`Avatar de ${stay.host.name}`}>{stay.host.name.charAt(0)}</div>
            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold">Anfitrión: {stay.host.name}</h2>
              <p className="mt-1 text-[#6a6a6a] text-xs">{stay.host.yearsHosting} {stay.host.yearsHosting === 1 ? "año" : "años"} como anfitrión</p>
            </div>
          </section>
          <section className="border-b border-[#ebebeb] py-[25px]"><p className="mt-[15px] leading-[1.7]">Disfruta de unos días de descanso en un espacio luminoso y acogedor. Una ubicación ideal para descubrir {stay.city} y sentirte como en casa.</p></section>
          <section className="border-b border-[#ebebeb] py-[25px]" aria-labelledby="amenities-heading">
            <h2 className="text-xl font-semibold" id="amenities-heading">Lo que ofrece este lugar</h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-6">
              {amenities.map(({ icon: Icon, label }) => <li key={label} className="flex min-w-0 items-start gap-3">
                <Icon size={22} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words text-sm leading-5">{label}</span>
              </li>)}
            </ul>
          </section>
        </div>
        <RoomBooking stay={stay} />
      </div>
    </main>
  );
}