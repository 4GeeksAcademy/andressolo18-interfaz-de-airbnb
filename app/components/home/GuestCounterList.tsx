import { Minus, Plus } from "lucide-react";

type GuestCounterItem = {
  id: string;
  title: string;
  description: string;
  count: number;
  max: number;
  setCount: (count: number) => void;
};

export function GuestCounterList({ items }: { items: GuestCounterItem[] }) {
  return <div>{items.map((item, index) => <div className={`flex min-h-[91px] items-center justify-between gap-[18px] border-b border-[#ebebeb] ${index === items.length - 1 ? "border-b-0" : ""}`} key={item.id}>
    <div className="flex min-w-0 flex-col gap-1"><strong className="text-base font-semibold">{item.title}</strong><span className="text-sm leading-[18px] text-[#6a6a6a]">{item.description}</span></div>
    <div className="flex shrink-0 items-center gap-[14px]">
      <button type="button" className="grid h-[33px] w-[33px] place-items-center rounded-full border border-[#bdbdbd] text-[#222] hover:not-disabled:border-[#222] disabled:cursor-default disabled:opacity-30" aria-label={`Quitar ${item.title}`} disabled={item.count === 0} onClick={() => item.setCount(item.count - 1)}><Minus size={15} /></button>
      <span className="min-w-4 text-center text-[15px]" aria-live="polite">{item.count}</span>
      <button type="button" className="grid h-[33px] w-[33px] place-items-center rounded-full border border-[#bdbdbd] text-[#222] hover:not-disabled:border-[#222] disabled:cursor-default disabled:opacity-30" aria-label={`Añadir ${item.title}`} disabled={item.count >= item.max} onClick={() => item.setCount(item.count + 1)}><Plus size={15} /></button>
    </div>
  </div>)}</div>;
}