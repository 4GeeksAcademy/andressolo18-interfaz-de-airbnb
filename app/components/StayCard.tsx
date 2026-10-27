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
    <article className={`min-w-0 ${isCatalog ? "" : "snap-start"}`}>
      <div className={`group relative overflow-hidden bg-[#eee] ${isCatalog ? "aspect-[1.15] rounded-[9px] min-[900px]:rounded-[13px]" : "aspect-[1.055] rounded-[22px] min-[900px]:aspect-square min-[900px]:rounded-[17px]"}`}>
        <Link className="absolute inset-0 block h-full w-full" aria-label={`Ver ${stay.title}, $${money(stay.price)} CLP`} href={`/rooms/${stay.id}`}>
          <Image className={`object-cover transition-transform ${isCatalog ? "duration-[250ms] group-hover:scale-[1.035]" : "duration-300 group-hover:scale-[1.045]"}`} src={stay.image} alt={`Interior de ${stay.title.toLowerCase()}`} fill sizes={isCatalog ? "(max-width: 700px) 46vw, (max-width: 1100px) 25vw, 18vw" : "(max-width: 640px) 46vw, (max-width: 1100px) 25vw, 15vw"} unoptimized />
        </Link>
        {stay.favorite && <span className={`pointer-events-none absolute left-[13px] top-[14px] max-w-[112px] rounded-[15px] bg-white/95 px-[11px] py-[7px] text-xs font-extrabold leading-[14px] ${isCatalog ? "max-w-[calc(100%-70px)]" : "min-[900px]:left-[9px] min-[900px]:top-[10px] min-[900px]:max-w-24 min-[900px]:rounded-xl min-[900px]:px-2 min-[900px]:py-[5px] min-[900px]:text-[10px] min-[900px]:leading-3"}`}>Favorito entre huéspedes</span>}
        {!isCatalog && onToggleSave && <button className={`absolute right-[11px] top-3 p-0.5 text-white drop-shadow-[0_1px_2px_#0005] transition-transform hover:scale-110 min-[900px]:right-[9px] min-[900px]:top-[9px] [&_svg]:fill-black/40 [&_svg]:stroke-[1.9px] min-[900px]:[&_svg]:w-[23px] ${saved ? "[&_svg]:fill-[#ff385c]" : ""}`} aria-label={saved ? `Quitar ${stay.title} de favoritos` : `Guardar ${stay.title}`} aria-pressed={saved} title="Guardar en favoritos" onClick={() => onToggleSave(stay.id)}><Heart size={25} /></button>}
      </div>
      {isCatalog ? <Link className="block text-inherit" href={`/rooms/${stay.id}`}>
        <div className="mt-[10px] flex justify-between gap-2"><h2 className="overflow-hidden text-xs font-semibold text-ellipsis whitespace-nowrap min-[900px]:text-sm">{stay.title}</h2><span className="flex shrink-0 items-center gap-1 text-xs"><Star size={13} fill="currentColor" />{stay.rating}</span></div>
        <p className="mt-1 text-[11px] text-[#6a6a6a] min-[900px]:text-xs">Estadía completa · En {stay.city}</p>
        <p className="mt-[9px] text-[11px] text-[#6a6a6a] min-[900px]:text-xs"><strong className="text-[#222] underline">${money(stay.price)} CLP</strong> por 9 noches</p>
      </Link> : <Link className="block w-full px-[5px] pt-[9px] text-left min-[900px]:px-px" href={`/rooms/${stay.id}`}>
        <h3 className="mb-1 text-[15px] leading-[18px] font-semibold min-[900px]:mb-0.5 min-[900px]:text-xs min-[900px]:leading-4 min-[1200px]:text-[13px]">{stay.title}</h3>
        <p className="text-[13px] leading-[17px] text-[#6a6a6a] min-[900px]:text-[10px] min-[900px]:leading-[15px] min-[1200px]:text-[11px]">${money(stay.price)} CLP <span>por 9 noches</span></p>
        <span className="flex items-center gap-[3px] text-xs leading-[17px] text-[#6a6a6a] min-[900px]:text-[10px] min-[900px]:leading-[15px] min-[1200px]:text-[11px]"><Star size={10} fill="currentColor" /> {stay.rating}</span>
      </Link>}
    </article>
  );
}