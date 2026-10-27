import Image from "next/image";
import type { Stay } from "../../stays";

export function StayImage({ stay, className = "" }: { stay: Stay; className?: string }) {
  return <Image src={stay.image} alt={`Interior de ${stay.title.toLowerCase()}`} fill sizes="(max-width: 640px) 46vw, (max-width: 1100px) 25vw, 15vw" className={className} unoptimized />;
}