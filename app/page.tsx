"use client";

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
  Globe, Heart, MapPin, Menu, Search, Star, Tent, Users, Wifi, X,
} from "lucide-react";
import { cities, stays } from "./stays";
import type { Stay } from "./stays";
import { CalendarMonth } from "./components/home/CalendarMonth";
import { GuestCounterList } from "./components/home/GuestCounterList";
import { HomeLoading } from "./components/home/HomeLoading";
import { StayImage } from "./components/home/StayImage";
import { StayRow } from "./components/home/StayRow";

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
 * Home: componente cliente de la ruta "/"; no recibe props.
 * RootLayout lo inserta como children. Es el padre de StayRow y de los usos
 * directos de StayImage; administra filtros, vistas, favoritos, diálogos y avisos.
 * Layout en orden: cabecera, main variable, footer, navegación móvil fija,
 * diálogo modal y aviso flotante. Los últimos tres no forman filas del main.
 * Los nombres de bloques en los comentarios JSX son descriptivos: no representan
 * componentes React extraídos ni contratos de props independientes.
 */
export default function Home() {
  const [initialLoading, setInitialLoading] = useState(true);
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
    const timer = window.setTimeout(() => setInitialLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

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
      <header className="bg-white px-7 pt-[14px] max-[370px]:px-5 min-[900px]:border-b min-[900px]:border-[#ebebeb] min-[900px]:bg-[#fcfcfc] min-[900px]:px-10 min-[900px]:pb-6 min-[1200px]:px-12">
        <div className="flex flex-col min-[900px]:h-[100px] min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-5 min-[1200px]:h-[105px]">
          {/* Marca: visible en escritorio, restablece la portada al hacer clic. */}
          <button className="hidden items-center gap-1 text-[#ff385c] min-[900px]:flex" aria-label="Airbnb, volver al inicio" onClick={() => { setView("explore"); setSearchCity(""); updateDestination(""); setCategory("Todo"); }}><Tent size={36} strokeWidth={1.8} /><span className="text-[30px] font-extrabold">airbnb</span></button>
          {/* Búsqueda móvil: ocupa el ancho disponible y abre el formulario compartido. */}
          <button className="flex h-[63px] w-full items-center justify-center gap-[9px] rounded-[40px] border border-[#dedede] text-base font-semibold shadow-[0_5px_19px_#00000010] min-[900px]:hidden" onClick={() => openModal("search")}><Search size={19} strokeWidth={2.5} /><span>{searchCity || "Empieza la búsqueda"}</span></button>
          {/* Categorías: categories aporta nombre/icono; category determina active.
              Fila desplazable en móvil y navegación central en escritorio. */}
          <nav className="mt-5 -mx-7 flex gap-3 overflow-x-auto px-7 pb-[9px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[370px]:-mx-5 max-[370px]:px-5 min-[900px]:m-0 min-[900px]:gap-6 min-[900px]:overflow-visible min-[900px]:p-0 min-[1200px]:gap-7" aria-label="Tipo de viaje">
            {categories.map((item) => <button key={item.name} className={`relative flex h-[43px] shrink-0 items-center justify-center gap-[5px] whitespace-nowrap rounded-[28px] bg-[linear-gradient(#fff,#f5f5f5)] px-[14px] py-2 text-base shadow-[0_2px_3px_#00000026,inset_0_-1px_3px_#0000000a] min-[900px]:h-[77px] min-[900px]:gap-[7px] min-[900px]:rounded-none min-[900px]:bg-transparent min-[900px]:p-0 min-[900px]:text-[13px] min-[900px]:text-[#6a6a6a] min-[900px]:shadow-none min-[1200px]:text-sm ${category === item.name ? "bg-[linear-gradient(#eaeaea,#fff)] shadow-[inset_0_2px_4px_#00000020,0_1px_3px_#0000000c] min-[900px]:bg-transparent min-[900px]:font-bold min-[900px]:text-[#222] min-[900px]:shadow-none min-[900px]:after:absolute min-[900px]:after:inset-x-0 min-[900px]:after:bottom-[9px] min-[900px]:after:h-[3px] min-[900px]:after:rounded-sm min-[900px]:after:bg-[#222] min-[900px]:after:content-['']" : ""}`} onClick={() => { setCategory(item.name); setView("explore"); setSearchCity(""); updateDestination(""); }}><span className="text-[23px] leading-none transition-transform min-[900px]:text-[31px] min-[900px]:hover:-translate-y-[3px]" aria-hidden="true">{item.icon}</span><span>{item.name}</span></button>)}
          </nav>
            {/* Acciones de escritorio: a la derecha de las categorías.
              El menú se ancla a menu-wrap; menu-dismiss cubre el exterior para cerrarlo. */}
            <div className="hidden items-center gap-[10px] min-[900px]:flex">
            <button className="hidden rounded-[30px] p-[11px] text-xs font-semibold hover:bg-[#eee] min-[1200px]:block" onClick={() => openModal("host")}>Conviértete en anfitrión</button>
            <button className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] hover:bg-[#e8e8e8]" aria-label="Idioma y moneda" title="Idioma y moneda" onClick={() => openModal("language")}><Globe size={18} /></button>
            <div className="relative">
              <button className="flex h-[39px] w-[39px] shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] hover:bg-[#e8e8e8]" aria-label="Abrir menú" title="Menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={19} /></button>
              {menuOpen && <><button className="fixed inset-0 z-[29] cursor-default" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} /><div className="absolute right-0 top-[49px] z-[30] w-[275px] rounded-xl border border-[#ebebeb] bg-white py-2 shadow-[0_6px_30px_#0002]">
                <button className="flex w-full items-center gap-[10px] px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => openModal("login")}><CircleUserRound size={18} />Iniciar sesión o registrarse</button>
                <button className="flex w-full items-center gap-[10px] px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => { setView("favorites"); setMenuOpen(false); }}><Heart size={18} />Favoritos</button>
                <button className="flex w-full items-center gap-[10px] px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => openModal("language")}><Globe size={18} />Idiomas y moneda</button>
                <hr className="my-[6px] border-0 border-t border-[#ebebeb]" /><button className="w-full px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => openModal("host")}>Conviértete en anfitrión</button>
                <button className="w-full px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => openModal("host")}>Invita a un anfitrión</button>
                <button className="w-full px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => openModal("host")}>Encuentra a un coanfitrión</button>
                <hr className="my-[6px] border-0 border-t border-[#ebebeb]" /><button className="w-full px-5 py-[13px] text-left text-[13px] hover:bg-[#f7f7f7]" onClick={() => openModal("help")}>Centro de ayuda</button>
              </div></>}
            </div>
          </div>
        </div>
        {/* Búsqueda de escritorio: destino editable con sugerencias en vivo; fechas y huéspedes
          conservan el formulario compartido con mobile-search. */}
        <div className="relative mx-auto hidden h-[66px] max-w-[790px] items-center rounded-[40px] border border-[#ddd] bg-white shadow-[0_3px_12px_#0000000c] min-[900px]:flex">
          <div className="relative flex h-[66px] min-w-[160px] flex-1 flex-col justify-center gap-[3px] rounded-[40px] border-r border-[#ddd] bg-[#f0f0f0] px-[26px] focus-within:z-[3] focus-within:bg-white focus-within:shadow-[0_4px_15px_#0002]" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDestinationOpen(false); }}>
            <label htmlFor="desktop-destination"><strong>Dónde</strong></label>
            <input className="w-full min-w-0 border-0 bg-transparent p-0 text-[13px] text-[#222] outline-0 placeholder:text-[#6a6a6a]" id="desktop-destination" type="text" role="combobox" aria-haspopup="listbox" autoComplete="off" placeholder="Explora destinos" value={destination} aria-autocomplete="list" aria-expanded={destinationOpen} aria-controls="destination-suggestions" onFocus={() => setDestinationOpen(true)} onChange={(event) => { applyDestination(event.target.value); setDestinationOpen(true); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchLink.current?.click(); } if (event.key === "Escape") setDestinationOpen(false); }} />
            {destinationOpen && <div className="absolute left-0 top-[calc(100%+13px)] z-40 max-h-[min(540px,calc(100dvh-140px))] w-[min(425px,calc(100vw-32px))] overflow-y-auto rounded-[28px] bg-white px-[18px] pb-[17px] pt-6 shadow-[0_10px_32px_#0002]" id="destination-suggestions" role="listbox" aria-label="Destinos sugeridos">
              <p className="mx-3 mb-[17px] text-xs font-semibold text-[#6a6a6a]">Destinos sugeridos</p>
              {matchingDestinations.length ? matchingDestinations.map((item, index) => <button key={item.city} type="button" role="option" aria-selected={destination === item.city} className="flex min-h-[72px] w-full items-center gap-4 rounded-[13px] px-3 py-2 text-left hover:bg-[#f7f7f7]" onPointerDown={(event) => event.preventDefault()} onClick={() => { applyDestination(item.city); setDestinationOpen(false); }}>
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${index % 3 === 0 ? "bg-[#eef4f9] text-[#598eb7]" : index % 3 === 1 ? "bg-[#fff0ed] text-[#df756b]" : "bg-[#edf6f0] text-[#479776]"}`}><MapPin size={22} strokeWidth={1.8} /></span>
                <span className="flex min-w-0 flex-col gap-[3px]"><strong className="text-sm leading-[18px] text-[#222]">{item.label}</strong><span className="text-[13px] leading-[17px] text-[#6a6a6a]">{item.detail}</span></span>
              </button>) : <span className="block px-3 py-[10px] text-[#6a6a6a]">No hay destinos sugeridos</span>}
            </div>}
          </div>
          <button className="flex min-w-[140px] flex-col gap-[3px] border-r border-[#ddd] px-[26px] text-left [&_strong]:text-xs [&_span]:text-[13px] [&_span]:text-[#6a6a6a]" onClick={() => { setDatePickerMode("dates"); openModal("dates"); }}><strong>Fechas</strong><span>{dateSummary}</span></button>
          <div className="relative h-[66px] min-w-[145px] flex-1" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setGuestsOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setGuestsOpen(false); }}>
            <button type="button" className="flex h-[66px] w-full flex-col justify-center gap-[3px] px-[26px] text-left hover:rounded-[40px] hover:bg-[#f7f7f7] [&_strong]:text-xs [&_span]:text-[13px] [&_span]:text-[#6a6a6a]" aria-haspopup="dialog" aria-expanded={guestsOpen} aria-controls="guest-picker" onClick={() => setGuestsOpen(true)}><strong>Quién</strong><span>{guestSummary}</span></button>
            {guestsOpen && <div className="absolute right-0 top-[calc(100%+13px)] z-[45] w-[min(425px,calc(100vw-32px))] rounded-[25px] bg-white px-[25px] py-[10px] shadow-[0_8px_24px_#0002]" id="guest-picker" role="dialog" aria-label="Seleccionar huéspedes"><GuestCounterList items={guestCounterItems} /></div>}
          </div>
          <Link ref={searchLink} className="mr-[9px] flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full bg-[#ff385c] text-white hover:bg-[#e31c5f]" aria-label="Buscar alojamientos" href={catalogHref} onClick={navigateToCatalog}><Search size={21} /></Link>
        </div>
      </header>

      {/* Contenido principal: debajo de la cabecera. Renderiza una sola rama según
          view/category y suministra datos y callbacks a los componentes StayRow. */}
      <main className="min-h-[75vh] overflow-hidden px-7 pb-10 pt-[25px] max-[370px]:px-5 min-[900px]:px-10 min-[900px]:pb-9 min-[900px]:pt-[30px] min-[1200px]:px-12" aria-busy={initialLoading}>
        {initialLoading ? <HomeLoading /> : <>
        {view === "favorites" ? <>
          {/* Vista de favoritos: savedStays se deriva de saved. Reutiliza StayRow
              con toggleSave y setSelectedStay; si no hay datos muestra un estado vacío. */}
            <div className="mb-7 [&_h1]:mb-[9px] [&_h1]:text-[27px] [&_h1]:font-extrabold [&_h1]:leading-[1.2] [&_p]:text-[#6a6a6a]"><h1>Tus favoritos</h1><p>Los lugares a los que quieres volver.</p></div>
              {savedStays.length ? <StayRow title={`${savedStays.length} alojamientos guardados`} items={savedStays} saved={saved} onSave={toggleSave} /> : <div className="flex flex-col items-center gap-[17px] px-[10px] py-[55px] text-center"><Heart size={42} /><h2 className="text-[23px] font-bold">Guarda tu próximo destino</h2><p className="text-[#6a6a6a]">Tus alojamientos favoritos aparecerán aquí.</p><button className="flex min-h-12 items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] font-bold text-white hover:bg-[#cf1649]" onClick={() => setView("explore")}>Explorar alojamientos</button></div>}
        </> : category === "Experiencias" || category === "Servicios" ? <>
          {/* Vista de experiencias/servicios: título y rejilla de bloques JSX.
              Una columna base y tres desde 640px; cada tarjeta contiene StayImage
              y muestra un aviso de demostración en lugar de abrir un alojamiento. */}
          <div className="mb-7 [&_h1]:mb-[9px] [&_h1]:text-[27px] [&_h1]:font-extrabold [&_h1]:leading-[1.2] [&_p]:text-[#6a6a6a]"><h1>{category === "Experiencias" ? "Descubre algo nuevo" : "Haz tu estancia especial"}</h1><p>{category === "Experiencias" ? "Momentos que te conectan con cada destino." : "Pequeños detalles para un gran viaje."}</p></div>
          <div className="grid grid-cols-1 gap-[25px] min-[640px]:grid-cols-3">{(category === "Experiencias" ? ["Sabores de Santiago", "Una escapada a la naturaleza", "Descubre la costa"] : ["Chef en tu alojamiento", "Fotografía de tu viaje", "Bienestar y relajación"]).map((title, index) => <button className="text-left" key={title} onClick={() => { setNotice("Esta actividad todavía no está disponible en esta demostración."); }}><div className="relative aspect-[1.3] overflow-hidden rounded-lg"><StayImage stay={stays[index + 13]} className="object-cover" /></div><h2 className="mt-3 text-xl font-bold">{title}</h2><p className="mt-1 text-[#6a6a6a]">{category === "Experiencias" ? "Experiencia local" : "Servicio a domicilio"}</p></button>)}</div>
        </> : <>
          {/* Búsqueda reciente: primer bloque de la portada sin filtro aplicado.
              Texto a la izquierda, StayImage con stay={stays[4]} a la derecha;
              el clic preselecciona Viña del Mar en el formulario. */}
          {!searchCity && <button className="mb-[26px] flex min-h-[132px] w-full items-center justify-between gap-5 rounded-[27px] border border-[#f1f1f1] px-[22px] py-[18px] text-left shadow-[0_8px_25px_#00000010] max-[370px]:gap-[10px] max-[370px]:pl-[15px] min-[900px]:mb-[30px] min-[900px]:min-h-[98px] min-[900px]:max-w-[465px] min-[900px]:gap-4 min-[900px]:rounded-2xl min-[900px]:px-[19px] min-[900px]:py-[14px]" onClick={() => { updateDestination("Viña del Mar"); openModal("search"); }}>
            <div><h1 className="mb-[7px] max-w-[228px] text-lg font-semibold leading-[23px] max-[370px]:text-base max-[370px]:leading-[21px] min-[640px]:max-w-none min-[900px]:max-w-[270px] min-[900px]:text-[15px] min-[900px]:leading-5">Sigue buscando<br className="min-[640px]:hidden" /> alojamientos en Viña del Mar</h1><p className="flex items-center text-sm text-[#6a6a6a] min-[900px]:text-xs">12 – 21 de oct · 2 huéspedes<ChevronRight size={14} /></p></div>
            <div className="relative h-[86px] w-[83px] shrink-0 rotate-2 overflow-hidden rounded-[18px] border-[3px] border-white shadow-[0_4px_7px_#00000035] max-[370px]:h-[75px] max-[370px]:w-[66px] min-[900px]:h-[66px] min-[900px]:w-[65px] min-[900px]:rounded-[13px]"><StayImage stay={stays[4]} className="object-cover" /></div>
            <ChevronRight className="hidden min-[900px]:block" size={20} />
          </button>}
            {/* Resumen de búsqueda: sustituye la tarjeta reciente cuando existe searchCity.
              Muestra los campos del formulario y permite restablecer el destino. */}
          {searchCity && <div className="mb-7 min-[900px]:flex min-[900px]:items-center min-[900px]:justify-between [&_h1]:mb-[9px] [&_h1]:text-[27px] [&_h1]:font-extrabold [&_h1]:leading-[1.2] [&_p]:text-[#6a6a6a] [&_button]:mt-0"><div><h1>Alojamientos en {searchCity}</h1><p>{arrival} – {departure} · {guests} {guests === 1 ? "huésped" : "huéspedes"}</p></div><button className="mt-[18px] inline-flex items-center justify-center gap-[10px] rounded-lg border border-[#ddd] px-[17px] py-3 font-semibold hover:bg-[#f7f7f7]" onClick={() => { setSearchCity(""); updateDestination(""); }}>Limpiar búsqueda<X size={15} /></button></div>}
            {/* Estado sin resultados: ocupa el lugar de los carruseles si no coincide ninguna ciudad. */}
          {filteredCities.length === 0 && <div className="flex flex-col items-center gap-[17px] px-[10px] py-[55px] text-center"><Search size={40} /><h2 className="text-[23px] font-bold">No encontramos alojamientos aquí</h2><p className="text-[#6a6a6a]">Prueba con Viña del Mar, Santiago o Pucón.</p><button className="flex min-h-12 items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] font-bold text-white hover:bg-[#cf1649]" onClick={() => openModal("search")}>Cambiar destino</button></div>}
            {/* Filas por ciudad: StayRow se apila verticalmente dentro del main.
              title depende del filtro; items contiene los alojamientos de city;
              saved comparte los favoritos; onSave={toggleSave} persiste el cambio;
              onOpen={setSelectedStay} abre el detalle en el diálogo de Home. */}
                      {filteredCities.map((city, index) => <StayRow key={city} title={searchCity ? `Encuentra tu estancia en ${city}` : index === 0 ? "Sugerencias basadas en tu búsqueda en Viña del Mar" : `Alojamientos populares en ${city}`} items={visibleStays.filter((stay) => stay.city === city)} saved={saved} onSave={toggleSave} />)}
            {/* Explorar más: cierre del main sin filtro; texto y botón se apilan en móvil
              y se colocan en una fila desde 900px. Abre la búsqueda compartida. */}
          {!searchCity && <section className="mt-5 border-t border-[#ebebeb] py-[27px] min-[900px]:flex min-[900px]:items-center min-[900px]:justify-between min-[900px]:pt-[30px] min-[900px]:pb-[5px]"><div><span className="text-[10px] font-extrabold text-[#6a6a6a]">TU PRÓXIMA ESCAPADA</span><h2 className="my-[9px] text-[23px] font-bold leading-[1.3] min-[900px]:text-2xl">Un lugar para cada forma de viajar</h2><p className="leading-[1.6] text-[#6a6a6a]">De la costa a la montaña, encuentra dónde sentirte en casa.</p></div><button className="mt-[18px] inline-flex items-center justify-center gap-[10px] rounded-lg border border-[#ddd] px-[17px] py-3 font-semibold hover:bg-[#f7f7f7]" onClick={() => openModal("search")}>Explorar destinos<ArrowRight size={17} /></button></section>}
        </>}
        </>}
      </main>

        {/* Pie de página: hermano posterior del main, en el flujo normal del documento.
          Los enlaces abren ayuda/idioma; el padding móvil reserva espacio para bottom-nav. */}
        <footer className="flex flex-col gap-5 border-t border-[#ebebeb] bg-[#f7f7f7] px-7 py-[25px] pb-[104px] text-xs text-[#6a6a6a] min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:px-10 min-[900px]:py-[23px] min-[900px]:pb-[23px] min-[1200px]:px-12"><div className="flex flex-wrap gap-[14px]"><span>© 2026 Airbnb, Inc.</span><button className="hover:underline" onClick={() => openModal("help")}>Privacidad</button><button className="hover:underline" onClick={() => openModal("help")}>Términos</button><button className="hover:underline" onClick={() => openModal("help")}>Ayuda</button></div><button className="mt-5 flex items-center gap-[10px] text-[#222] min-[900px]:m-0" onClick={() => openModal("language")}><Globe size={16} />Español (CL)<strong>$ CLP</strong></button></footer>
        {/* Navegación móvil: fija al borde inferior, fuera del flujo; oculta desde 900px.
          view determina selected; los botones cambian la vista o abren login. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-[calc(76px+env(safe-area-inset-bottom))] justify-center gap-[37px] border-t border-[#eee] bg-white/95 px-[10px] pt-[11px] pb-[calc(9px+env(safe-area-inset-bottom))] min-[900px]:hidden" aria-label="Navegación principal"><button className={`flex min-w-[49px] flex-col items-center justify-center gap-1 text-[11px] ${view === "explore" ? "text-[#ff0050]" : "text-[#747474]"}`} onClick={() => setView("explore")}><Search size={29} strokeWidth={1.8} /><span>Explora</span></button><button className={`flex min-w-[49px] flex-col items-center justify-center gap-1 text-[11px] ${view === "favorites" ? "text-[#ff0050]" : "text-[#747474]"}`} onClick={() => setView("favorites")}><Heart size={28} strokeWidth={1.5} /><span>Favoritos</span></button><button className="flex min-w-[49px] flex-col items-center justify-center gap-1 text-[11px] text-[#747474]" onClick={() => openModal("login")}><CircleUserRound size={27} strokeWidth={1.5} /><span>Iniciar sesión</span></button></nav>

        {/* Diálogo compartido: elemento HTML dialog, no componente React independiente.
          ref permite showModal/close; onCancel cierra con Escape; onClick cierra el exterior.
          Vive en la capa modal sobre la página, centrado y con scroll propio;
          modal elige el contenido y selectedStay activa el detalle de mayor ancho. */}
      <dialog ref={dialog} className={`fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-32px)] max-w-[530px] overflow-auto rounded-2xl border border-[#ebebeb] bg-white p-0 text-[#222] shadow-[0_20px_80px_#0003] backdrop:bg-black/45 backdrop:backdrop-blur-[3px] ${selectedStay ? "min-[900px]:max-w-[680px]" : ""} ${modal === "dates" ? "h-[min(630px,calc(100dvh-30px))] max-h-[calc(100dvh-30px)] max-w-[850px] rounded-[28px] max-[640px]:h-[min(650px,calc(100dvh-16px))] max-[640px]:max-h-[calc(100dvh-16px)] max-[640px]:w-[calc(100%-16px)] max-[640px]:rounded-[22px]" : ""}`} onCancel={closeDialog} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        {/* Cabecera del diálogo: título variable y cierre; sticky sobre el contenido desplazable. */}
        {modal !== "dates" && <div className="sticky top-0 z-[2] flex items-center gap-[15px] border-b border-[#ebebeb] bg-white px-5 py-[17px]"><button className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] hover:bg-[#e8e8e8]" aria-label="Cerrar" title="Cerrar" onClick={closeDialog}><X size={20} /></button><h2 className="text-[15px] font-bold leading-[1.4]">{selectedStay ? selectedStay.title : modal === "search" ? "Encuentra tu próxima escapada" : modal === "language" ? "Idioma y moneda" : modal === "host" ? "Comparte tu espacio" : modal === "help" ? "Centro de ayuda" : "Inicia sesión o regístrate"}</h2></div>}
        {modal === "dates" && <div className="px-7 pb-[26px] pt-5 max-[370px]:px-3 max-[370px]:pb-5 max-[370px]:pt-4 max-[640px]:px-[15px] max-[640px]:pb-[22px] max-[640px]:pt-4">
          <div className="mx-auto mb-[27px] flex w-[min(310px,100%)] gap-1 rounded-[28px] bg-[#ededed] p-[5px]" role="tablist" aria-label="Tipo de fechas">
            <button type="button" role="tab" aria-selected={datePickerMode === "dates"} className={`h-[38px] flex-1 rounded-[22px] border border-transparent text-sm ${datePickerMode === "dates" ? "border-[#e1e1e1] bg-white shadow-[0_1px_2px_#0000000c]" : ""}`} onClick={() => setDatePickerMode("dates")}>Fechas</button>
            <button type="button" role="tab" aria-selected={datePickerMode === "flexible"} className={`h-[38px] flex-1 rounded-[22px] border border-transparent text-sm ${datePickerMode === "flexible" ? "border-[#e1e1e1] bg-white shadow-[0_1px_2px_#0000000c]" : ""}`} onClick={() => setDatePickerMode("flexible")}>Flexible</button>
          </div>
          {datePickerMode === "dates" ? <>
            <div className="relative">
              <button type="button" className="absolute -left-0.5 top-0 z-[1] grid h-[34px] w-[34px] place-items-center rounded-full hover:bg-[#f7f7f7]" aria-label="Mes anterior" onClick={() => setCalendarMonth((month) => shiftMonth(month, -1))}><ArrowLeft size={18} /></button>
              <div className="grid grid-cols-2 gap-10 px-[22px] max-[640px]:grid-cols-[repeat(2,minmax(250px,1fr))] max-[640px]:gap-[22px] max-[640px]:overflow-x-auto max-[640px]:px-5 max-[640px]:[scrollbar-width:thin]">
                <CalendarMonth month={calendarMonth} title={formatCalendarMonth(calendarMonth)} arrival={arrival} departure={departure} onSelect={selectCalendarDate} />
                <CalendarMonth month={shiftMonth(calendarMonth, 1)} title={formatCalendarMonth(shiftMonth(calendarMonth, 1))} arrival={arrival} departure={departure} onSelect={selectCalendarDate} />
              </div>
              <button type="button" className="absolute -right-0.5 top-0 z-[1] grid h-[34px] w-[34px] place-items-center rounded-full hover:bg-[#f7f7f7]" aria-label="Mes siguiente" onClick={() => setCalendarMonth((month) => shiftMonth(month, 1))}><ArrowRight size={18} /></button>
            </div>
            <div className="mt-[29px] mr-[5px] ml-[5px] flex gap-[9px] overflow-x-auto pt-0.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[640px]:mt-[22px]" aria-label="Flexibilidad de fechas">
              {[0, 1, 2, 3, 7, 14].map((days) => <button type="button" key={days} aria-pressed={dateFlexibility === days} className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-[22px] border px-[14px] text-xs ${dateFlexibility === days ? "border-[#222]" : "border-[#ddd]"}`} onClick={() => setDateFlexibility(days)}>{days === 0 ? "Fechas exactas" : `± ${days} ${days === 1 ? "día" : "días"}`}</button>)}
            </div>
          </> : <div className="px-2 pb-1 pt-[27px] max-[640px]:px-0 max-[640px]:pt-[22px]">
            <section><h3 className="mb-[17px] text-center text-lg font-semibold max-[640px]:mb-[17px]">¿Cuánto tiempo quieres quedarte?</h3><div className="flex justify-center gap-[9px]">{flexibleDurations.map((option) => <button type="button" key={option.label} aria-pressed={flexibleDuration === option.label} className={`min-h-[42px] shrink-0 rounded-[22px] border px-[17px] text-sm ${flexibleDuration === option.label ? "border-[#222]" : "border-[#ddd]"}`} onClick={() => setFlexibleDuration(option.label)}>{option.label}</button>)}</div></section>
            <section className="mt-[50px] max-[640px]:mt-9"><h3 className="mb-[17px] text-center text-lg font-semibold">¿Cuándo quieres ir?</h3><div className="grid grid-cols-6 gap-[9px] max-[640px]:grid-cols-3">{flexibleMonthOptions.map((month) => <button type="button" key={month} aria-pressed={flexibleMonths.includes(month)} className={`flex min-h-[137px] min-w-0 flex-col items-center justify-center gap-[5px] rounded-2xl border px-[5px] py-3 hover:border-[#222] max-[640px]:min-h-[110px] ${flexibleMonths.includes(month) ? "border-[#222]" : "border-[#ddd]"}`} onClick={() => toggleFlexibleMonth(month)}><CalendarDays className="mb-1 text-[#6a6a6a]" size={26} /><strong className="max-w-full overflow-hidden text-ellipsis text-sm font-semibold capitalize whitespace-nowrap">{formatCalendarMonth(month).split(" ")[0]}</strong><span className="text-xs text-[#6a6a6a]">{month.slice(0, 4)}</span></button>)}</div></section>
            <div className="mt-6 flex justify-end"><button type="button" className="flex min-h-[42px] items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[19px] py-[10px] font-bold text-white hover:bg-[#cf1649] disabled:opacity-35" disabled={!flexibleMonths.length} onClick={applyFlexibleSelection}>Aplicar fechas</button></div>
          </div>}
        </div>}
        {/* Formulario de búsqueda: bloque controlado por destination, arrival, departure y guests.
          Campos en columna, fechas en dos columnas y contador en fila; onSubmit aplica runSearch. */}
        {modal === "search" && <form className="p-[25px] max-[370px]:p-[18px] [&>button[type=submit]]:w-full" onSubmit={(event) => { event.preventDefault(); searchLink.current?.click(); }}>
          <label className="flex flex-col gap-[9px] text-sm font-bold">¿A dónde quieres ir?<div className="relative flex items-center"><Search className="absolute left-[13px]" size={19} /><input className="w-full min-w-0 rounded-lg border border-[#b0b0b0] bg-white px-3 py-[14px] pl-[41px] font-normal text-[#222]" autoComplete="off" placeholder="Busca un destino" value={destination} onChange={(event) => updateDestination(event.target.value)} /></div></label>
          <div className="my-[14px] mb-6 flex flex-wrap gap-2">{cities.map((city) => <button type="button" className={`flex items-center gap-1.5 rounded-[7px] border px-[11px] py-2 text-xs ${destination === city ? "border-[#222] bg-[#f7f7f7]" : "border-[#ddd]"}`} key={city} onClick={() => updateDestination(city)}>{city}{destination === city && <Check size={14} />}</button>)}</div>
          <div className="grid grid-cols-2 gap-3"><label className="flex flex-col gap-[9px] text-sm font-bold">Llegada<input className="min-h-[46px] min-w-0 rounded-lg border border-[#b0b0b0] bg-white px-2 py-[13px] text-xs font-normal" type="date" value={arrival} min="2026-10-10" required onChange={(event) => { setArrival(event.target.value); if (event.target.value >= departure) setDeparture(""); }} /></label><label className="flex flex-col gap-[9px] text-sm font-bold">Salida<input className="min-h-[46px] min-w-0 rounded-lg border border-[#b0b0b0] bg-white px-2 py-[13px] text-xs font-normal" type="date" value={departure} min={arrival} required onChange={(event) => setDeparture(event.target.value)} /></label></div>
          <div className="mt-6"><h3 className="mb-1 text-lg font-semibold">Huéspedes</h3><GuestCounterList items={guestCounterItems} /></div>
          <button type="submit" className="mt-4 flex min-h-12 w-full items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] font-bold text-white hover:bg-[#cf1649]"><Search size={18} />Buscar</button>
        </form>}
        {/* Formulario de acceso: bajo la cabecera modal; select usa defaultValue,
            input usa validación HTML y onSubmit solo informa del modo demostración. */}
        {modal === "login" && <form className="p-[25px] max-[370px]:p-[18px] [&>button[type=submit]]:w-full" onSubmit={(event) => { event.preventDefault(); setNotice("Esta es una demostración: no se ha creado una cuenta ni enviado información."); closeDialog(); }}><h3 className="mb-5 text-[21px] leading-[1.4] font-bold">Te damos la bienvenida a Airbnb</h3><label className="mb-4 flex flex-col gap-[9px] text-sm font-bold">País o región<select className="w-full min-w-0 rounded-lg border border-[#b0b0b0] bg-white px-3 py-[14px] font-normal text-[#222]" defaultValue="Chile (+56)"><option>Chile (+56)</option><option>Argentina (+54)</option><option>España (+34)</option></select></label><label className="mb-4 flex flex-col gap-[9px] text-sm font-bold">Número de teléfono<input className="w-full min-w-0 rounded-lg border border-[#b0b0b0] bg-white px-3 py-[14px] font-normal text-[#222]" type="tel" placeholder="Número de teléfono" required pattern="[0-9 +()-]{7,20}" /></label><p className="my-[13px] text-[11px] leading-[1.5] text-[#6a6a6a]">La autenticación no está conectada en esta demostración.</p><button className="flex min-h-12 w-full items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] font-bold text-white hover:bg-[#cf1649]" type="submit">Continuar<ArrowRight size={18} /></button></form>}
        {/* Idioma y moneda: dos bloques verticales con valores fijos, no selectores funcionales. */}
        {modal === "language" && <div className="p-[25px] [&_h3]:mb-5 [&_h3]:text-[21px] [&_h3]:font-bold"><h3>Idioma y región</h3><div className="mb-[25px] flex items-center justify-between rounded-lg border border-[#222] p-[17px]"><div><strong>Español</strong><p className="mt-[5px] text-[#6a6a6a]">Chile</p></div><Check size={19} /></div><h3>Moneda</h3><div className="mb-[25px] flex items-center justify-between rounded-lg border border-[#222] p-[17px]"><div><strong>Peso chileno</strong><p className="mt-[5px] text-[#6a6a6a]">CLP – $</p></div><Check size={19} /></div></div>}
        {/* Anfitrión: contenido vertical dentro del mismo diálogo; Empezar cambia modal a login. */}
        {modal === "host" && <div className="p-[25px] [&_h3]:mb-5 [&_h3]:text-[21px] [&_h3]:font-bold [&_p]:mb-5 [&_p]:leading-[1.6] [&_p]:text-[#6a6a6a]"><Tent size={44} className="mb-5 text-[#ff385c]" /><h3>Tu espacio puede ser su próximo destino</h3><p>Comparte una habitación, una casa o ese rincón especial con viajeros de todo el mundo.</p><p className="my-[13px] text-[11px] leading-[1.5] text-[#6a6a6a]">El registro de anfitriones no está disponible en esta demostración.</p><button className="flex min-h-12 items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] font-bold text-white hover:bg-[#cf1649]" onClick={() => { setModal("login"); }}>Empezar<ArrowRight size={18} /></button></div>}
        {/* Ayuda: preguntas apiladas con details/summary, cuyo despliegue lo gestiona HTML. */}
        {modal === "help" && <div className="p-[25px] [&_h3]:mb-5 [&_h3]:text-[21px] [&_h3]:font-bold [&_details]:border-t [&_details]:border-[#ebebeb] [&_details]:py-[17px] [&_summary]:cursor-pointer [&_summary]:font-semibold [&_details_p]:mt-[15px] [&_details_p]:mb-0 [&_details_p]:leading-[1.6] [&_details_p]:text-[#6a6a6a]"><h3>¿Cómo podemos ayudarte?</h3><details><summary>¿Cómo guardo un alojamiento?</summary><p>Selecciona el corazón de un alojamiento. Puedes encontrarlo después en Favoritos.</p></details><details><summary>¿Puedo realizar una reserva?</summary><p>Esta página es un proyecto de interfaz con datos de ejemplo. No procesa reservas ni pagos.</p></details><details><summary>¿Cómo busco un destino?</summary><p>Abre la búsqueda y elige Viña del Mar, Santiago o Pucón, las fechas y el número de huéspedes.</p></details></div>}
        {/* Ficha de alojamiento: bloque JSX alimentado por selectedStay, no una ruta aparte.
            StayImage recibe stay={selectedStay}; saved controla el corazón y toggleSave lo actualiza.
            Layout vertical: foto, valoración/título/capacidad, anfitrión, descripción,
            servicios y fila de precio/acción. Ver disponibilidad reemplaza el detalle por búsqueda. */}
        {selectedStay && <div><div className="relative h-[250px] min-[900px]:h-[335px]"><StayImage stay={selectedStay} className="object-cover" /><button className={`absolute right-[11px] top-3 p-0.5 text-white drop-shadow-[0_1px_2px_#0005] transition-transform hover:scale-110 [&_svg]:fill-black/40 [&_svg]:stroke-[1.9px] min-[900px]:right-[9px] min-[900px]:top-[9px] min-[900px]:[&_svg]:w-[23px] ${saved.includes(selectedStay.id) ? "[&_svg]:fill-[#ff385c]" : ""}`} aria-label="Guardar alojamiento" aria-pressed={saved.includes(selectedStay.id)} onClick={() => toggleSave(selectedStay.id)}><Heart size={26} /></button></div><div className="p-[23px]"><span className="flex items-center gap-[6px] text-xs"><Star size={15} fill="currentColor" /> {selectedStay.rating} · Favorito entre huéspedes</span><h3 className="my-[15px] mb-2 text-[23px] leading-[1.3] font-extrabold">Alojamiento entero en {selectedStay.city}, Chile</h3><p className="leading-[1.6] text-[#6a6a6a]">4 huéspedes · 2 habitaciones · 2 camas · 1 baño</p><hr className="my-5 border-0 border-t border-[#ebebeb]" /><div className="flex items-center gap-3"><CircleUserRound size={40} /><div><strong>Anfitrión: Catalina</strong><p className="text-xs text-[#6a6a6a]">Superanfitriona · 4 años de experiencia</p></div></div><hr className="my-5 border-0 border-t border-[#ebebeb]" /><p className="leading-[1.6] text-[#6a6a6a]">Disfruta de unos días de descanso en un espacio luminoso y acogedor. Una ubicación ideal para descubrir {selectedStay.city} y sentirte como en casa.</p><div className="flex gap-[25px] py-5"><span className="flex items-center gap-[7px] text-xs"><Wifi size={19} />Wifi</span><span className="flex items-center gap-[7px] text-xs"><Users size={19} />Hasta 4 huéspedes</span></div><div className="flex flex-wrap items-center justify-between gap-[15px] border-t border-[#ebebeb] pt-5"><div><strong>${money(selectedStay.price)} CLP</strong><p className="text-xs text-[#6a6a6a]">por 9 noches</p></div><button className="flex min-h-12 items-center justify-center gap-[10px] rounded-lg bg-[#e51d53] px-[21px] py-[14px] text-xs font-bold text-white hover:bg-[#cf1649]" onClick={() => { setSelectedStay(null); updateDestination(selectedStay.city); setModal("search"); }}>Ver disponibilidad<ChevronDown size={17} /></button></div><p className="my-[13px] text-[11px] leading-[1.5] text-[#6a6a6a]">Alojamiento de ejemplo. No se realizan reservas ni cobros.</p></div></div>}
      </dialog>
      {/* Aviso flotante: notice aporta el mensaje; role="status" anuncia el cambio.
          Posición fija sobre la navegación móvil; se cierra por botón o temporizador. */}
      {notice && <div className="fixed bottom-24 left-1/2 z-50 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-[18px] rounded-lg bg-[#222] px-5 py-4 text-[13px] text-white shadow-[0_5px_25px_#0003] min-[900px]:bottom-[30px]" role="status">{notice}<button className="shrink-0" aria-label="Cerrar aviso" onClick={() => setNotice("")}><X size={17} /></button></div>}
    </>
  );
}
