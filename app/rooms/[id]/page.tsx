import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Check, Star, Users, Wifi } from "lucide-react";
import { stays } from "../../stays";
import RoomActions from "./RoomActions";

type RoomPageProps = { params: Promise<{ id: string }> };

function money(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

export default function RoomPage({ params }: RoomPageProps) {
  return <Suspense fallback={<main className="route-page room-page"><p>Cargando alojamiento...</p></main>}><RoomDetails params={params} /></Suspense>;
}

async function RoomDetails({ params }: RoomPageProps) {
  const { id } = await params;
  const stay = stays.find((item) => item.id === Number(id));
  if (!stay) notFound();

  return (
    <main className="route-page room-page">
      <nav className="route-nav" aria-label="Navegación del alojamiento">
        <Link className="route-brand" href="/">airbnb</Link>
        <Link className="route-back-link" href="/catalog"><ArrowLeft size={17} />Volver a los alojamientos</Link>
      </nav>
      <header className="room-heading">
        <h1>{stay.title}</h1>
        <div className="room-heading-meta"><span><Star size={14} fill="currentColor" />{stay.rating}</span><span>{stay.city}, Chile</span><RoomActions title={stay.title} /></div>
      </header>
      <div className="room-layout">
        <div className="room-main-content">
          <div className="room-hero-photo"><Image src={stay.image} alt={`Interior de ${stay.title}`} fill sizes="(max-width: 850px) 100vw, 65vw" priority unoptimized /></div>
          <section className="room-summary">
            <div><h2>Alojamiento entero en {stay.city}</h2><p>4 huéspedes · 2 habitaciones · 2 camas · 1 baño</p></div>
            <div className="room-host-avatar" aria-label="Anfitrión Catalina">C</div>
          </section>
          <section className="room-description"><h2>Anfitrión: Catalina</h2><p>Superanfitriona · 4 años de experiencia</p><hr /><p>Disfruta de unos días de descanso en un espacio luminoso y acogedor. Una ubicación ideal para descubrir {stay.city} y sentirte como en casa.</p></section>
          <section className="room-amenities"><h2>Lo que ofrece este lugar</h2><p><Wifi size={19} />Wifi</p><p><Users size={19} />Espacio para 4 huéspedes</p><p><Check size={19} />Alojamiento completo</p></section>
        </div>
        <aside className="room-booking">
          <p><strong>${money(stay.price)} CLP</strong> por 9 noches</p>
          <div className="room-booking-dates"><span>12 – 21 oct</span><span>2 huéspedes</span></div>
          <Link className="primary-button" href="/catalog">Consultar disponibilidad</Link>
          <p className="room-booking-note">Aún no se te cobrará nada</p>
        </aside>
      </div>
    </main>
  );
}