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
  return <main className="route-page room-page" aria-busy="true"><p role="status">Cargando alojamiento...</p></main>;
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

  return <section className="room-hero-photo mb-6" aria-label="Galería de fotos del alojamiento" aria-roledescription="carrusel">
    <Image src={currentPhoto.src} alt={currentPhoto.alt} fill sizes="(max-width: 900px) 100vw, 1280px" priority unoptimized />
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

  return <aside className="room-booking" aria-label="Reserva del alojamiento">
    <p><strong>${money(nightlyPrice)} CLP</strong> por noche</p>
    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-sm font-semibold">Huéspedes</h2><p className="text-xs text-[var(--muted)]">Máximo {maxGuests} personas</p></div>
      <div className="guest-picker-controls" role="group" aria-label="Cantidad de huéspedes">
        <button type="button" className="guest-stepper" aria-label="Reducir huéspedes" title="Reducir huéspedes" disabled={guests <= minGuests} onClick={() => changeGuests(-1)}><Minus size={16} aria-hidden="true" /></button>
        <span className="guest-count" aria-live="polite" aria-atomic="true" aria-label={`${guests} ${guests === 1 ? "huésped" : "huéspedes"}`}>{guests}</span>
        <button type="button" className="guest-stepper" aria-label="Aumentar huéspedes" title="Aumentar huéspedes" disabled={guests >= maxGuests} onClick={() => changeGuests(1)}><Plus size={16} aria-hidden="true" /></button>
      </div>
    </div>
    <button type="button" className="primary-button" onClick={() => setNotice(`Reserva de demostración para ${guests} ${guests === 1 ? "huésped" : "huéspedes"}. No se ha realizado ninguna reserva ni cobro.`)}>Reservar</button>
    <p className="room-booking-note">${money(stay.price)} CLP en total por 9 noches</p>
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
    <main className="route-page room-page">
      <nav className="route-nav" aria-label="Navegación del alojamiento">
        <Link className="route-brand" href="/">airbnb</Link>
        <Link className="route-back-link" href="/catalog"><ArrowLeft size={17} />Volver a los alojamientos</Link>
      </nav>
      <header className="room-heading">
        <h1>{stay.title}</h1>
        <div className="room-heading-meta">
          <span aria-label={`Valoración: ${stay.rating} de 5 estrellas`}><Star size={14} fill="currentColor" aria-hidden="true" />{stay.rating} / 5</span>
          <span>{stay.reviewCount} {stay.reviewCount === 1 ? "reseña" : "reseñas"}</span>
          <span><MapPin size={14} aria-hidden="true" />{stay.city}, Chile</span>
          <RoomActions title={stay.title} />
        </div>
      </header>
      <RoomGallery stay={stay} />
      <div className="room-layout">
        <div className="room-main-content">
          <section className="room-summary">
            <div><h2>Alojamiento entero en {stay.city}</h2><p>4 huéspedes · 2 habitaciones · 2 camas · 1 baño</p></div>
          </section>
          <section className="host-info border-b border-[var(--line)] py-6" aria-label="Información del anfitrión">
            <div className="room-host-avatar shrink-0" role="img" aria-label={`Avatar de ${stay.host.name}`}>{stay.host.name.charAt(0)}</div>
            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold">Anfitrión: {stay.host.name}</h2>
              <p className="mt-1 text-[var(--muted)]">{stay.host.yearsHosting} {stay.host.yearsHosting === 1 ? "año" : "años"} como anfitrión</p>
            </div>
          </section>
          <section className="room-description"><p>Disfruta de unos días de descanso en un espacio luminoso y acogedor. Una ubicación ideal para descubrir {stay.city} y sentirte como en casa.</p></section>
          <section className="room-amenities" aria-labelledby="amenities-heading">
            <h2 id="amenities-heading">Lo que ofrece este lugar</h2>
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