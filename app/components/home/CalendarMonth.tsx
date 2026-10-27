export function CalendarMonth({ month, title, arrival, departure, onSelect }: {
  month: string; title: string; arrival: string; departure: string; onSelect: (date: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const emptyDays = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array.from({ length: emptyDays }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`)];
  const weekdays = ["L", "Ma", "Mi", "J", "V", "S", "D"];

  return (
    <section aria-label={title}>
      <h3 className="mb-4 text-center text-base font-semibold">{title}</h3>
      <div className="mb-[9px] grid grid-cols-7">{weekdays.map((day) => <span className="grid h-[30px] place-items-center text-xs font-semibold text-[#6a6a6a]" key={day}>{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, index) => {
          if (!date) return <span className="grid aspect-square min-w-0 place-items-center" key={`empty-${index}`} />;
          const selected = date === arrival || date === departure;
          const inRange = Boolean(arrival && departure && date > arrival && date < departure);
          return <button type="button" key={date} className={`relative grid aspect-square min-w-0 place-items-center rounded-full text-[13px] hover:outline hover:outline-1 hover:outline-[#222] ${inRange ? "rounded-[5px] bg-[#f4f4f4]" : ""} ${selected ? "z-[1] bg-[#222] font-bold text-white outline-0 hover:outline-0" : ""}`} aria-label={date} aria-pressed={selected} onClick={() => onSelect(date)}>{Number(date.slice(-2))}</button>;
        })}
      </div>
    </section>
  );
}