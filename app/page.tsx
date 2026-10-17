"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
/**
 * Componentes de iconos importados de lucide-react:
 * ArrowLeft/ArrowRight/ChevronRight/ChevronDown: navegación y acciones;
 * Search: búsqueda; Heart/Star: favoritos y valoración; Tent: marca/anfitrión;
 * CircleUserRound/Users: cuenta y huéspedes; Globe/Menu: idioma y menú;
 * Minus/Plus: contador; Check: selección; Wifi: servicio; X: cierre.
 * Props utilizadas: size (píxeles), strokeWidth (grosor), fill (relleno),
 * className (estilos). Se ubican dentro de botones, títulos o filas informativas;
 * los botones padres definen la acción y su nombre accesible, no el icono.
 */
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, ChevronRight, CircleUserRound,
  Globe, Heart, MapPin, Menu, Minus, Plus, Search, Star, Tent, Users, Wifi, X,
} from "lucide-react";
import { cities, stays } from "./stays";
import type { Stay } from "./stays";
import { StayCard } from "./components/StayCard";

type View = "explore" | "favorites";
type Modal = "search" | "dates" | "login" | "language" | "host" | "help" | null;

const destinationSuggestions = [
  { city: "Viña del Mar", label: "Viña del Mar, Valparaíso", detail: "Ideal para escapadas de fin de semana" },
  { city: "Santiago", label: "Santiago, Región Metropolitana", detail: "Popular entre los viajeros de tu zona" },
  { city: "Pucón", label: "Pucón, Araucanía", detail: "Por lugares emblemáticos como este" },
];
const categories = [
  { name: "Todo", icon: "🌎" },
  { name: "Alojamientos", icon: "🏡" },
  { name: "Experiencias", icon: "🎈" },
  { name: "Servicios", icon: "🛎️" },
];
const money = (value: number) => new Intl.NumberFormat("es-CL").format(value);
const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const formatSearchDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day))).replace(/\.$/, "");
};
const shiftMonth = (value: string, offset: number) => {
  const [year, month] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
};
const shiftDate = (value: string, offset: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + offset));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
};
const formatCalendarMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toLocaleUpperCase("es") + label.slice(1);
};
const flexibleDurations = [
  { label: "Fin de semana", days: 2 },
  { label: "Semana", days: 7 },
  { label: "Mes", days: 30 },
];
const flexibleMonthOptions = Array.from({ length: 6 }, (_, index) => shiftMonth("2026-10", index));

function CalendarMonth({ month, arrival, departure, onSelect }: {
  month: string; arrival: string; departure: string; onSelect: (date: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const emptyDays = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array.from({ length: emptyDays }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`)];
  const weekdays = ["L", "Ma", "Mi", "J", "V", "S", "D"];

  return (
    <section className="calendar-month" aria-label={formatCalendarMonth(month)}>
      <h3>{formatCalendarMonth(month)}</h3>
      <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((date, index) => {
          if (!date) return <span className="calendar-empty" key={`empty-${index}`} />;
          const selected = date === arrival || date === departure;
          const inRange = Boolean(arrival && departure && date > arrival && date < departure);
          return <button type="button" key={date} className={`calendar-day ${selected ? "selected" : ""} ${inRange ? "in-range" : ""} ${date === arrival ? "range-start" : ""} ${date === departure ? "range-end" : ""}`} aria-label={date} aria-pressed={selected} onClick={() => onSelect(date)}>{Number(date.slice(-2))}</button>;
        })}
      </div>
    </section>
  );
}

function GuestCounterList({ items }: { items: { id: string; title: string; description: string; count: number; max: number; setCount: (count: number) => void }[] }) {
  return <div className="guest-picker-rows">{items.map((item) => <div className="guest-picker-row" key={item.id}>
    <div className="guest-picker-copy"><strong>{item.title}</strong><span>{item.description}</span></div>
    <div className="guest-picker-controls">
      <button type="button" className="guest-stepper" aria-label={`Quitar ${item.title}`} disabled={item.count === 0} onClick={() => item.setCount(item.count - 1)}><Minus size={15} /></button>
      <span className="guest-count" aria-live="polite">{item.count}</span>
      <button type="button" className="guest-stepper" aria-label={`Añadir ${item.title}`} disabled={item.count >= item.max} onClick={() => item.setCount(item.count + 1)}><Plus size={15} /></button>
    </div>
  </div>)}</div>;
}
function readSaved() {
  try { return localStorage.getItem("airbnb-saved") || "[]"; }
  catch { return "[]"; }
}
function subscribeSaved(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("favorites-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("favorites-change", callback);
  };
}
function parseSaved(value: string): number[] {
  try {
    const stored: unknown = JSON.parse(value);
    return Array.isArray(stored) && stored.every((id) => typeof id === "number") ? stored : [];
  } catch { return []; }
}

/**
 * StayImage: imagen reutilizable de un alojamiento, descendiente de StayRow o Home.
 * Props: stay (Stay, obligatoria) aporta image y title; className (string, opcional,
 * por defecto "") añade clases al componente Image de Next.js.
 * Layout: llena el contenedor padre mediante fill; ese padre debe tener position:
 * relative y dimensiones definidas. Aparece en tarjetas, búsqueda reciente,
 * experiencias/servicios y ficha de detalle, con recorte object-fit definido en CSS.
 * Image recibe src (URL), alt (texto accesible), fill (ocupa el padre), sizes
 * (ancho estimado según viewport), className y unoptimized (URL externa sin optimizador).
 */
function StayImage({ stay, className = "" }: { stay: Stay; className?: string }) {
  return <Image src={stay.image} alt={`Interior de ${stay.title.toLowerCase()}`} fill sizes="(max-width: 640px) 46vw, (max-width: 1100px) 25vw, 15vw" className={className} unoptimized />;
}

/**
 * StayRow: sección de alojamientos reutilizada dentro del main de Home.
 * Props obligatorias:
 * - title (string): encabezado de la sección.
 * - items (Stay[]): alojamientos que se convierten en tarjetas, en el orden recibido.
 * - saved (number[]): identificadores guardados; determina el estado de cada corazón.
 * - onSave ((id: number) => void): comunica al padre el clic en favoritos.
 * Layout: encabezado y flechas arriba; carrusel horizontal debajo. CSS establece
 * 2 columnas base, 4 desde 640px, 6 desde 900px y 7 desde 1200px.
 * Cada tarjeta reutiliza StayCard; el desplazamiento y sus límites son estado local,
 * y los favoritos pertenecen a Home.
 */
function StayRow({ title, items, saved, onSave }: {
  title: string; items: Stay[]; saved: number[];
  onSave: (id: number) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const scroll = (direction: number) => row.current?.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="stay-section">
      {/* Encabezado del carrusel: título a la izquierda y controles a la derecha.
          disabled depende de atStart/atEnd; la flecha anterior se oculta en móvil. */}
      <div className="section-heading flex items-center justify-between gap-4">
        <h2>{title}<ChevronRight size={19} className="heading-chevron" /></h2>
        <div className="flex shrink-0 gap-2">
          <button className="round-button previous" title="Alojamientos anteriores" aria-label="Alojamientos anteriores" disabled={atStart} onClick={() => scroll(-1)}><ArrowLeft size={17} /></button>
          <button className="round-button" title="Más alojamientos" aria-label="Más alojamientos" disabled={atEnd} onClick={() => scroll(1)}><ArrowRight size={17} /></button>
        </div>
      </div>
        {/* Contenedor desplazable: ref conecta las flechas con el elemento DOM;
          onScroll actualiza los límites sin modificar los alojamientos recibidos. */}
        <div className="stay-row" ref={row} onScroll={() => {
        const element = row.current;
        if (element) {
          setAtStart(element.scrollLeft < 5);
          setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 5);
        }
      }}>
        {items.map((stay) => <StayCard key={stay.id} stay={stay} variant="home" saved={saved.includes(stay.id)} onToggleSave={onSave} />)}
      </div>
    </section>
  );
}

/**
 * Home: componente cliente de la ruta "/"; no recibe props.
 * RootLayout lo inserta como children. Es el padre de StayRow y de los usos
 * directos de StayImage; administra filtros, vistas, favoritos, diálogos y avisos.
 * Layout en orden: cabecera, main variable, footer, navegación móvil fija,
 * diálogo modal y aviso flotante. Los últimos tres no forman filas del main.
 * Los nombres de bloques en los comentarios JSX son descriptivos: no representan
 * componentes React extraídos ni contratos de props independientes.
 */
export default function Home() {
  // Navegación: category elige el contenido del main; view alterna explorar/favoritos;
  // modal y menuOpen controlan las capas de diálogo y menú de la cabecera.
  const [category, setCategory] = useState("Todo");
  const [view, setView] = useState<View>("explore");
  const [modal, setModal] = useState<Modal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Identificadores persistentes: se pasan como saved a StayRow y alimentan savedStays.
  const saved = parseSaved(useSyncExternalStore(subscribeSaved, readSaved, () => "[]"));
  // Campos controlados del formulario: destination es la edición y searchCity el destino aplicado.
  // Las fechas y huéspedes se muestran en los resultados; no filtran disponibilidad real.
  const [destination, setDestination] = useState("");
  const [visibleStays, setVisibleStays] = useState(stays);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [arrival, setArrival] = useState("2026-10-12");
  const [departure, setDeparture] = useState("2026-10-21");
  const [datePickerMode, setDatePickerMode] = useState<"dates" | "flexible">("dates");
  const [calendarMonth, setCalendarMonth] = useState("2026-10");
  const [dateFlexibility, setDateFlexibility] = useState(0);
  const [flexibleDuration, setFlexibleDuration] = useState("Fin de semana");
  const [flexibleMonths, setFlexibleMonths] = useState<string[]>([]);
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  // selectedStay alimenta la ficha; notice alimenta el aviso; dialog referencia el modal nativo.
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const searchLink = useRef<HTMLAnchorElement>(null);
  const isDialogOpen = modal !== null || selectedStay !== null;

  useEffect(() => {
    if (isDialogOpen) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isDialogOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function toggleSave(id: number) {
    const updated = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    try { localStorage.setItem("airbnb-saved", JSON.stringify(updated)); } catch { setNotice("Tu navegador no permite guardar favoritos. Habilita el almacenamiento local."); }
    window.dispatchEvent(new Event("favorites-change"));
  }

  function closeDialog() { setModal(null); setSelectedStay(null); }
  function openModal(next: Modal) { setMenuOpen(false); setDestinationOpen(false); setModal(next); }
  function updateDestination(value: string) {
    const normalizedQuery = normalizeSearch(value);
    setDestination(value);
    setVisibleStays(stays.filter((stay) => normalizeSearch(`${stay.city} ${stay.title}`).includes(normalizedQuery)));
  }
  function applyDestination(value: string) {
    updateDestination(value);
    setSearchCity(value.trim());
    setView("explore");
    setCategory("Alojamientos");
  }
  function selectCalendarDate(value: string) {
    if (!arrival || departure) {
      setArrival(value);
      setDeparture("");
    } else if (value < arrival) {
      setArrival(value);
    } else {
      setDeparture(value);
    }
  }
  function toggleFlexibleMonth(value: string) {
    setFlexibleMonths((current) => current.includes(value) ? current.filter((month) => month !== value) : [...current, value]);
  }
  function applyFlexibleSelection() {
    if (flexibleMonths.length) {
      const firstMonth = [...flexibleMonths].sort()[0];
      const startDate = `${firstMonth}-01`;
      const duration = flexibleDurations.find((option) => option.label === flexibleDuration)?.days ?? 2;
      setArrival(startDate);
      setDeparture(shiftDate(startDate, duration));
    }
    closeDialog();
  }
  function navigateToCatalog() {
    setDestinationOpen(false);
    setGuestsOpen(false);
    closeDialog();
  }

  const filteredCities = cities.filter((city) => visibleStays.some((stay) => stay.city === city));
  const matchingDestinations = destinationSuggestions.filter((item) => normalizeSearch(`${item.city} ${item.label} ${item.detail}`).includes(normalizeSearch(destination)));
  const dateSummary = arrival && departure ? `${formatSearchDate(arrival)} - ${formatSearchDate(departure)}` : "Agrega fechas";
  const guests = adults + children + infants;
  const guestSummary = guests ? `${guests} ${guests === 1 ? "huésped" : "huéspedes"}${pets ? ` · ${pets} ${pets === 1 ? "mascota" : "mascotas"}` : ""}` : pets ? `${pets} ${pets === 1 ? "mascota" : "mascotas"}` : "¿Cuántos?";
  const guestCounterItems = [
    { id: "adults", title: "Adultos", description: "Edad: 13 años o más", count: adults, max: 16, setCount: setAdults },
    { id: "children", title: "Niños", description: "Edades 2–12", count: children, max: 16, setCount: setChildren },
    { id: "infants", title: "Bebés", description: "Menos de 2 años", count: infants, max: 5, setCount: setInfants },
    { id: "pets", title: "Mascotas", description: "¿Traes un animal de servicio?", count: pets, max: 5, setCount: setPets },
  ];
  const catalogHref = `/catalog?${new URLSearchParams({ destination: destination.trim(), arrival, departure, adults: String(adults), children: String(children), infants: String(infants), pets: String(pets) }).toString()}`;
  const savedStays = stays.filter((stay) => saved.includes(stay.id));

  return (
    <>
      {/* Cabecera (site-header): primer bloque de Home. No recibe props propias;
          usa category, searchCity, guests y los manejadores del padre. En móvil
          apila búsqueda/categorías; desde 900px muestra marca, categorías y acciones. */}
      <header className="site-header">
        <div className="top-bar">
          {/* Marca: visible en escritorio, restablece la portada al hacer clic. */}
          <button className="brand" aria-label="Airbnb, volver al inicio" onClick={() => { setView("explore"); setSearchCity(""); updateDestination(""); setCategory("Todo"); }}><Tent size={36} strokeWidth={1.8} /><span>airbnb</span></button>
          {/* Búsqueda móvil: ocupa el ancho disponible y abre el formulario compartido. */}
          <button className="mobile-search" onClick={() => openModal("search")}><Search size={19} strokeWidth={2.5} /><span>{searchCity || "Empieza la búsqueda"}</span></button>
          {/* Categorías: categories aporta nombre/icono; category determina active.
              Fila desplazable en móvil y navegación central en escritorio. */}
          <nav className="category-nav" aria-label="Tipo de viaje">
            {categories.map((item) => <button key={item.name} className={`category-button ${category === item.name ? "active" : ""}`} onClick={() => { setCategory(item.name); setView("explore"); setSearchCity(""); updateDestination(""); }}><span className="category-icon" aria-hidden="true">{item.icon}</span><span>{item.name}</span></button>)}
          </nav>
            {/* Acciones de escritorio: a la derecha de las categorías.
              El menú se ancla a menu-wrap; menu-dismiss cubre el exterior para cerrarlo. */}
            <div className="header-actions">
            <button className="host-button" onClick={() => openModal("host")}>Conviértete en anfitrión</button>
            <button className="round-button" aria-label="Idioma y moneda" title="Idioma y moneda" onClick={() => openModal("language")}><Globe size={18} /></button>
            <div className="menu-wrap">
              <button className="round-button" aria-label="Abrir menú" title="Menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></button>
              {menuOpen && <><button className="menu-dismiss" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} /><div className="dropdown-menu">
                <button onClick={() => openModal("login")}><CircleUserRound size={18} />Iniciar sesión o registrarse</button>
                <button onClick={() => { setView("favorites"); setMenuOpen(false); }}><Heart size={18} />Favoritos</button>
                <button onClick={() => openModal("language")}><Globe size={18} />Idiomas y moneda</button>
                <hr /><button onClick={() => openModal("host")}>Conviértete en anfitrión</button>
                <button onClick={() => openModal("host")}>Invita a un anfitrión</button>
                <button onClick={() => openModal("host")}>Encuentra a un coanfitrión</button>
                <hr /><button onClick={() => openModal("help")}>Centro de ayuda</button>
              </div></>}
            </div>
          </div>
        </div>
        {/* Búsqueda de escritorio: destino editable con sugerencias en vivo; fechas y huéspedes
          conservan el formulario compartido con mobile-search. */}
        <div className="desktop-search">
          <div className="desktop-search-location" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDestinationOpen(false); }}>
            <label htmlFor="desktop-destination"><strong>Dónde</strong></label>
            <input id="desktop-destination" type="text" role="combobox" aria-haspopup="listbox" autoComplete="off" placeholder="Explora destinos" value={destination} aria-autocomplete="list" aria-expanded={destinationOpen} aria-controls="destination-suggestions" onFocus={() => setDestinationOpen(true)} onChange={(event) => { applyDestination(event.target.value); setDestinationOpen(true); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchLink.current?.click(); } if (event.key === "Escape") setDestinationOpen(false); }} />
            {destinationOpen && <div className="destination-popover" id="destination-suggestions" role="listbox" aria-label="Destinos sugeridos">
              <p>Destinos sugeridos</p>
              {matchingDestinations.length ? matchingDestinations.map((item, index) => <button key={item.city} type="button" role="option" aria-selected={destination === item.city} className="destination-option" onPointerDown={(event) => event.preventDefault()} onClick={() => { applyDestination(item.city); setDestinationOpen(false); }}>
                <span className={`destination-icon destination-icon-${index % 3}`}><MapPin size={22} strokeWidth={1.8} /></span>
                <span className="destination-copy"><strong>{item.label}</strong><span>{item.detail}</span></span>
              </button>) : <span className="destination-empty">No hay destinos sugeridos</span>}
            </div>}
          </div>
          <button onClick={() => { setDatePickerMode("dates"); openModal("dates"); }}><strong>Fechas</strong><span>{dateSummary}</span></button>
          <div className="desktop-search-guests" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setGuestsOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setGuestsOpen(false); }}>
            <button type="button" className="desktop-search-guests-trigger" aria-haspopup="dialog" aria-expanded={guestsOpen} aria-controls="guest-picker" onClick={() => setGuestsOpen(true)}><strong>Quién</strong><span>{guestSummary}</span></button>
            {guestsOpen && <div className="guest-popover" id="guest-picker" role="dialog" aria-label="Seleccionar huéspedes"><GuestCounterList items={guestCounterItems} /></div>}
          </div>
          <Link ref={searchLink} className="search-submit" aria-label="Buscar alojamientos" href={catalogHref} onClick={navigateToCatalog}><Search size={21} /></Link>
        </div>
      </header>

      {/* Contenido principal: debajo de la cabecera. Renderiza una sola rama según
          view/category y suministra datos y callbacks a los componentes StayRow. */}
      <main className="main-content">
        {view === "favorites" ? <>
          {/* Vista de favoritos: savedStays se deriva de saved. Reutiliza StayRow
              con toggleSave y setSelectedStay; si no hay datos muestra un estado vacío. */}
          <div className="page-heading"><h1>Tus favoritos</h1><p>Los lugares a los que quieres volver.</p></div>
                  {savedStays.length ? <StayRow title={`${savedStays.length} alojamientos guardados`} items={savedStays} saved={saved} onSave={toggleSave} /> : <div className="empty-state"><Heart size={42} /><h2>Guarda tu próximo destino</h2><p>Tus alojamientos favoritos aparecerán aquí.</p><button className="primary-button" onClick={() => setView("explore")}>Explorar alojamientos</button></div>}
        </> : category === "Experiencias" || category === "Servicios" ? <>
          {/* Vista de experiencias/servicios: título y rejilla de bloques JSX.
              Una columna base y tres desde 640px; cada tarjeta contiene StayImage
              y muestra un aviso de demostración en lugar de abrir un alojamiento. */}
          <div className="page-heading"><h1>{category === "Experiencias" ? "Descubre algo nuevo" : "Haz tu estancia especial"}</h1><p>{category === "Experiencias" ? "Momentos que te conectan con cada destino." : "Pequeños detalles para un gran viaje."}</p></div>
          <div className="experience-grid">{(category === "Experiencias" ? ["Sabores de Santiago", "Una escapada a la naturaleza", "Descubre la costa"] : ["Chef en tu alojamiento", "Fotografía de tu viaje", "Bienestar y relajación"]).map((title, index) => <button className="experience-card" key={title} onClick={() => { setNotice("Esta actividad todavía no está disponible en esta demostración."); }}><div className="experience-photo"><StayImage stay={stays[index + 13]} /></div><h2>{title}</h2><p>{category === "Experiencias" ? "Experiencia local" : "Servicio a domicilio"}</p></button>)}</div>
        </> : <>
          {/* Búsqueda reciente: primer bloque de la portada sin filtro aplicado.
              Texto a la izquierda, StayImage con stay={stays[4]} a la derecha;
              el clic preselecciona Viña del Mar en el formulario. */}
          {!searchCity && <button className="continue-search" onClick={() => { updateDestination("Viña del Mar"); openModal("search"); }}>
            <div><h1>Sigue buscando<br className="mobile-break" /> alojamientos en Viña del Mar</h1><p>12 – 21 de oct · 2 huéspedes<ChevronRight size={14} /></p></div>
            <div className="recent-photo"><StayImage stay={stays[4]} /></div>
            <ChevronRight className="recent-arrow" size={20} />
          </button>}
            {/* Resumen de búsqueda: sustituye la tarjeta reciente cuando existe searchCity.
              Muestra los campos del formulario y permite restablecer el destino. */}
          {searchCity && <div className="page-heading search-results-heading"><div><h1>Alojamientos en {searchCity}</h1><p>{arrival} – {departure} · {guests} {guests === 1 ? "huésped" : "huéspedes"}</p></div><button className="outline-button" onClick={() => { setSearchCity(""); updateDestination(""); }}>Limpiar búsqueda<X size={15} /></button></div>}
            {/* Estado sin resultados: ocupa el lugar de los carruseles si no coincide ninguna ciudad. */}
          {filteredCities.length === 0 && <div className="empty-state"><Search size={40} /><h2>No encontramos alojamientos aquí</h2><p>Prueba con Viña del Mar, Santiago o Pucón.</p><button className="primary-button" onClick={() => openModal("search")}>Cambiar destino</button></div>}
            {/* Filas por ciudad: StayRow se apila verticalmente dentro del main.
              title depende del filtro; items contiene los alojamientos de city;
              saved comparte los favoritos; onSave={toggleSave} persiste el cambio;
              onOpen={setSelectedStay} abre el detalle en el diálogo de Home. */}
                      {filteredCities.map((city, index) => <StayRow key={city} title={searchCity ? `Encuentra tu estancia en ${city}` : index === 0 ? "Sugerencias basadas en tu búsqueda en Viña del Mar" : `Alojamientos populares en ${city}`} items={visibleStays.filter((stay) => stay.city === city)} saved={saved} onSave={toggleSave} />)}
            {/* Explorar más: cierre del main sin filtro; texto y botón se apilan en móvil
              y se colocan en una fila desde 900px. Abre la búsqueda compartida. */}
          {!searchCity && <section className="explore-more"><div><span className="eyebrow">TU PRÓXIMA ESCAPADA</span><h2>Un lugar para cada forma de viajar</h2><p>De la costa a la montaña, encuentra dónde sentirte en casa.</p></div><button className="outline-button" onClick={() => openModal("search")}>Explorar destinos<ArrowRight size={17} /></button></section>}
        </>}
      </main>

        {/* Pie de página: hermano posterior del main, en el flujo normal del documento.
          Los enlaces abren ayuda/idioma; el padding móvil reserva espacio para bottom-nav. */}
        <footer className="site-footer"><div className="footer-links"><span>© 2026 Airbnb, Inc.</span><button onClick={() => openModal("help")}>Privacidad</button><button onClick={() => openModal("help")}>Términos</button><button onClick={() => openModal("help")}>Ayuda</button></div><button className="footer-locale" onClick={() => openModal("language")}><Globe size={16} />Español (CL)<strong>$ CLP</strong></button></footer>
        {/* Navegación móvil: fija al borde inferior, fuera del flujo; oculta desde 900px.
          view determina selected; los botones cambian la vista o abren login. */}
      <nav className="bottom-nav" aria-label="Navegación principal"><button className={view === "explore" ? "selected" : ""} onClick={() => setView("explore")}><Search size={29} strokeWidth={1.8} /><span>Explora</span></button><button className={view === "favorites" ? "selected" : ""} onClick={() => setView("favorites")}><Heart size={28} strokeWidth={1.5} /><span>Favoritos</span></button><button onClick={() => openModal("login")}><CircleUserRound size={27} strokeWidth={1.5} /><span>Iniciar sesión</span></button></nav>

        {/* Diálogo compartido: elemento HTML dialog, no componente React independiente.
          ref permite showModal/close; onCancel cierra con Escape; onClick cierra el exterior.
          Vive en la capa modal sobre la página, centrado y con scroll propio;
          modal elige el contenido y selectedStay activa el detalle de mayor ancho. */}
      <dialog ref={dialog} className={`app-dialog ${selectedStay ? "detail-dialog" : ""} ${modal === "dates" ? "date-picker-dialog" : ""}`} onCancel={closeDialog} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        {/* Cabecera del diálogo: título variable y cierre; sticky sobre el contenido desplazable. */}
        {modal !== "dates" && <div className="dialog-header"><button className="round-button" aria-label="Cerrar" title="Cerrar" onClick={closeDialog}><X size={20} /></button><h2>{selectedStay ? selectedStay.title : modal === "search" ? "Encuentra tu próxima escapada" : modal === "language" ? "Idioma y moneda" : modal === "host" ? "Comparte tu espacio" : modal === "help" ? "Centro de ayuda" : "Inicia sesión o regístrate"}</h2></div>}
        {modal === "dates" && <div className="date-picker-content">
          <div className="date-picker-tabs" role="tablist" aria-label="Tipo de fechas">
            <button type="button" role="tab" aria-selected={datePickerMode === "dates"} className={datePickerMode === "dates" ? "active" : ""} onClick={() => setDatePickerMode("dates")}>Fechas</button>
            <button type="button" role="tab" aria-selected={datePickerMode === "flexible"} className={datePickerMode === "flexible" ? "active" : ""} onClick={() => setDatePickerMode("flexible")}>Flexible</button>
          </div>
          {datePickerMode === "dates" ? <>
            <div className="calendar-layout">
              <button type="button" className="calendar-arrow calendar-previous" aria-label="Mes anterior" onClick={() => setCalendarMonth((month) => shiftMonth(month, -1))}><ArrowLeft size={18} /></button>
              <div className="calendar-months">
                <CalendarMonth month={calendarMonth} arrival={arrival} departure={departure} onSelect={selectCalendarDate} />
                <CalendarMonth month={shiftMonth(calendarMonth, 1)} arrival={arrival} departure={departure} onSelect={selectCalendarDate} />
              </div>
              <button type="button" className="calendar-arrow calendar-next" aria-label="Mes siguiente" onClick={() => setCalendarMonth((month) => shiftMonth(month, 1))}><ArrowRight size={18} /></button>
            </div>
            <div className="date-flexibility-options" aria-label="Flexibilidad de fechas">
              {[0, 1, 2, 3, 7, 14].map((days) => <button type="button" key={days} aria-pressed={dateFlexibility === days} className={dateFlexibility === days ? "active" : ""} onClick={() => setDateFlexibility(days)}>{days === 0 ? "Fechas exactas" : `± ${days} ${days === 1 ? "día" : "días"}`}</button>)}
            </div>
          </> : <div className="flexible-date-content">
            <section className="flexible-duration"><h3>¿Cuánto tiempo quieres quedarte?</h3><div>{flexibleDurations.map((option) => <button type="button" key={option.label} aria-pressed={flexibleDuration === option.label} className={flexibleDuration === option.label ? "active" : ""} onClick={() => setFlexibleDuration(option.label)}>{option.label}</button>)}</div></section>
            <section className="flexible-month-selection"><h3>¿Cuándo quieres ir?</h3><div className="flexible-months">{flexibleMonthOptions.map((month) => <button type="button" key={month} aria-pressed={flexibleMonths.includes(month)} className={flexibleMonths.includes(month) ? "selected" : ""} onClick={() => toggleFlexibleMonth(month)}><CalendarDays size={26} /><strong>{formatCalendarMonth(month).split(" ")[0]}</strong><span>{month.slice(0, 4)}</span></button>)}</div></section>
            <div className="flexible-date-footer"><button type="button" className="primary-button" disabled={!flexibleMonths.length} onClick={applyFlexibleSelection}>Aplicar fechas</button></div>
          </div>}
        </div>}
        {/* Formulario de búsqueda: bloque controlado por destination, arrival, departure y guests.
          Campos en columna, fechas en dos columnas y contador en fila; onSubmit aplica runSearch. */}
        {modal === "search" && <form className="search-form" onSubmit={(event) => { event.preventDefault(); searchLink.current?.click(); }}>
          <label className="field-label">¿A dónde quieres ir?<div className="input-with-icon"><Search size={19} /><input autoComplete="off" placeholder="Busca un destino" value={destination} onChange={(event) => updateDestination(event.target.value)} /></div></label>
          <div className="destination-options">{cities.map((city) => <button type="button" className={destination === city ? "chosen" : ""} key={city} onClick={() => updateDestination(city)}>{city}{destination === city && <Check size={14} />}</button>)}</div>
          <div className="date-fields"><label className="field-label">Llegada<input type="date" value={arrival} min="2026-10-10" required onChange={(event) => { setArrival(event.target.value); if (event.target.value >= departure) setDeparture(""); }} /></label><label className="field-label">Salida<input type="date" value={departure} min={arrival} required onChange={(event) => setDeparture(event.target.value)} /></label></div>
          <div className="guest-counter-modal"><h3>Huéspedes</h3><GuestCounterList items={guestCounterItems} /></div>
          <button type="submit" className="primary-button"><Search size={18} />Buscar</button>
        </form>}
        {/* Formulario de acceso: bajo la cabecera modal; select usa defaultValue,
            input usa validación HTML y onSubmit solo informa del modo demostración. */}
        {modal === "login" && <form className="dialog-body login-form" onSubmit={(event) => { event.preventDefault(); setNotice("Esta es una demostración: no se ha creado una cuenta ni enviado información."); closeDialog(); }}><h3>Te damos la bienvenida a Airbnb</h3><label className="field-label">País o región<select defaultValue="Chile (+56)"><option>Chile (+56)</option><option>Argentina (+54)</option><option>España (+34)</option></select></label><label className="field-label">Número de teléfono<input type="tel" placeholder="Número de teléfono" required pattern="[0-9 +()-]{7,20}" /></label><p className="fine-print">La autenticación no está conectada en esta demostración.</p><button className="primary-button" type="submit">Continuar<ArrowRight size={18} /></button></form>}
        {/* Idioma y moneda: dos bloques verticales con valores fijos, no selectores funcionales. */}
        {modal === "language" && <div className="dialog-body"><h3>Idioma y región</h3><div className="locale-option"><div><strong>Español</strong><p>Chile</p></div><Check size={19} /></div><h3>Moneda</h3><div className="locale-option"><div><strong>Peso chileno</strong><p>CLP – $</p></div><Check size={19} /></div></div>}
        {/* Anfitrión: contenido vertical dentro del mismo diálogo; Empezar cambia modal a login. */}
        {modal === "host" && <div className="dialog-body"><Tent size={44} className="pink-icon" /><h3>Tu espacio puede ser su próximo destino</h3><p>Comparte una habitación, una casa o ese rincón especial con viajeros de todo el mundo.</p><p className="fine-print">El registro de anfitriones no está disponible en esta demostración.</p><button className="primary-button" onClick={() => { setModal("login"); }}>Empezar<ArrowRight size={18} /></button></div>}
        {/* Ayuda: preguntas apiladas con details/summary, cuyo despliegue lo gestiona HTML. */}
        {modal === "help" && <div className="dialog-body"><h3>¿Cómo podemos ayudarte?</h3><details><summary>¿Cómo guardo un alojamiento?</summary><p>Selecciona el corazón de un alojamiento. Puedes encontrarlo después en Favoritos.</p></details><details><summary>¿Puedo realizar una reserva?</summary><p>Esta página es un proyecto de interfaz con datos de ejemplo. No procesa reservas ni pagos.</p></details><details><summary>¿Cómo busco un destino?</summary><p>Abre la búsqueda y elige Viña del Mar, Santiago o Pucón, las fechas y el número de huéspedes.</p></details></div>}
        {/* Ficha de alojamiento: bloque JSX alimentado por selectedStay, no una ruta aparte.
            StayImage recibe stay={selectedStay}; saved controla el corazón y toggleSave lo actualiza.
            Layout vertical: foto, valoración/título/capacidad, anfitrión, descripción,
            servicios y fila de precio/acción. Ver disponibilidad reemplaza el detalle por búsqueda. */}
        {selectedStay && <div className="detail-body"><div className="detail-photo"><StayImage stay={selectedStay} /><button className={`heart-button ${saved.includes(selectedStay.id) ? "is-saved" : ""}`} aria-label="Guardar alojamiento" aria-pressed={saved.includes(selectedStay.id)} onClick={() => toggleSave(selectedStay.id)}><Heart size={26} /></button></div><div className="detail-content"><span className="detail-rating"><Star size={15} fill="currentColor" /> {selectedStay.rating} · Favorito entre huéspedes</span><h3>Alojamiento entero en {selectedStay.city}, Chile</h3><p>4 huéspedes · 2 habitaciones · 2 camas · 1 baño</p><hr /><div className="host-info"><CircleUserRound size={40} /><div><strong>Anfitrión: Catalina</strong><p>Superanfitriona · 4 años de experiencia</p></div></div><hr /><p>Disfruta de unos días de descanso en un espacio luminoso y acogedor. Una ubicación ideal para descubrir {selectedStay.city} y sentirte como en casa.</p><div className="amenities"><span><Wifi size={19} />Wifi</span><span><Users size={19} />Hasta 4 huéspedes</span></div><div className="booking-row"><div><strong>${money(selectedStay.price)} CLP</strong><p>por 9 noches</p></div><button className="primary-button" onClick={() => { setSelectedStay(null); updateDestination(selectedStay.city); setModal("search"); }}>Ver disponibilidad<ChevronDown size={17} /></button></div><p className="fine-print">Alojamiento de ejemplo. No se realizan reservas ni cobros.</p></div></div>}
      </dialog>
      {/* Aviso flotante: notice aporta el mensaje; role="status" anuncia el cambio.
          Posición fija sobre la navegación móvil; se cierra por botón o temporizador. */}
      {notice && <div className="toast" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice("")}><X size={17} /></button></div>}
    </>
  );
}
