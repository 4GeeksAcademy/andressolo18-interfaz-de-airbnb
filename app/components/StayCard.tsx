import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Stay } from "../stays";

type StayCardProps = {
  stay: Stay;
  variant: "home" | "catalog";
  saved?: boolean;
  onToggleSave?: (id: number) => void;
};

function money(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

export function StayCard({ stay, variant, saved = false, onToggleSave }: StayCardProps) {
  const isCatalog = variant === "catalog";

  return (
    <article className={`stay-card ${isCatalog ? "catalog-stay-card" : ""}`}>
      <div className={`stay-photo ${isCatalog ? "catalog-stay-photo" : ""}`}>
        <Link className="photo-link" aria-label={`Ver ${stay.title}, $${money(stay.price)} CLP`} href={`/rooms/${stay.id}`}>
          <Image src={stay.image} alt={`Interior de ${stay.title.toLowerCase()}`} fill sizes={isCatalog ? "(max-width: 700px) 46vw, (max-width: 1100px) 25vw, 18vw" : "(max-width: 640px) 46vw, (max-width: 1100px) 25vw, 15vw"} unoptimized />
        </Link>
        {stay.favorite && <span className="guest-favorite">Favorito entre huéspedes</span>}
        {!isCatalog && onToggleSave && <button className={`heart-button ${saved ? "is-saved" : ""}`} aria-label={saved ? `Quitar ${stay.title} de favoritos` : `Guardar ${stay.title}`} aria-pressed={saved} title="Guardar en favoritos" onClick={() => onToggleSave(stay.id)}><Heart size={25} /></button>}
      </div>
      {isCatalog ? <Link className="catalog-stay-info" href={`/rooms/${stay.id}`}>
        <div className="catalog-stay-title"><h2>{stay.title}</h2><span><Star size={13} fill="currentColor" />{stay.rating}</span></div>
        <p>Estadía completa · En {stay.city}</p>
        <p className="catalog-price"><strong>${money(stay.price)} CLP</strong> por 9 noches</p>
      </Link> : <Link className="stay-info text-left" href={`/rooms/${stay.id}`}>
        <h3>{stay.title}</h3>
        <p>${money(stay.price)} CLP <span>por 9 noches</span></p>
        <span className="rating"><Star size={10} fill="currentColor" /> {stay.rating}</span>
      </Link>}
    </article>
  );
}