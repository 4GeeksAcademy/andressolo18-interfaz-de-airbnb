import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import type { Stay } from "../../stays";
import { StayCard } from "../StayCard";

export function StayRow({ title, items, saved, onSave }: {
  title: string; items: Stay[]; saved: number[];
  onSave: (id: number) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const scroll = (direction: number) => row.current?.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mb-[31px] min-[900px]:mb-[33px]">
      <div className="mb-[18px] ml-0.5 flex items-start justify-between gap-4 min-[900px]:mb-[15px] min-[900px]:ml-0 min-[900px]:items-center">
        <h2 className="max-w-[320px] text-xl font-bold leading-[27px] min-[900px]:flex min-[900px]:max-w-none min-[900px]:items-center min-[900px]:gap-1.5 min-[900px]:text-xl min-[900px]:leading-[26px]">{title}<ChevronRight size={19} className="hidden min-[900px]:block" /></h2>
        <div className="flex shrink-0 gap-2">
          <button className="hidden h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] hover:enabled:bg-[#e8e8e8] min-[900px]:flex min-[900px]:h-7 min-[900px]:w-7" title="Alojamientos anteriores" aria-label="Alojamientos anteriores" disabled={atStart} onClick={() => scroll(-1)}><ArrowLeft size={17} /></button>
          <button className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] hover:enabled:bg-[#e8e8e8] min-[900px]:h-7 min-[900px]:w-7" title="Más alojamientos" aria-label="Más alojamientos" disabled={atEnd} onClick={() => scroll(1)}><ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="-mr-7 grid auto-cols-[calc((100%-14px)/2)] grid-flow-col gap-[14px] overflow-x-auto snap-x snap-mandatory pb-[3px] pr-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[640px]:auto-cols-[calc((100%-42px)/4)] min-[900px]:mr-0 min-[900px]:auto-cols-[calc((100%-80px)/6)] min-[900px]:gap-4 min-[900px]:pr-0 min-[1200px]:auto-cols-[calc((100%-96px)/7)]" ref={row} onScroll={() => {
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