export function HomeLoading() {
  return (
    <div role="status" aria-label="Cargando alojamientos">
      <p className="mb-[18px] font-semibold text-[#6a6a6a]">Preparando alojamientos...</p>
      <div className="mb-[26px] flex min-h-[132px] w-full items-center justify-between gap-5 rounded-[27px] border border-[#f1f1f1] px-[22px] py-[18px] shadow-[0_8px_25px_#00000010] min-[900px]:mb-[30px] min-[900px]:min-h-[98px] min-[900px]:max-w-[465px] min-[900px]:gap-4 min-[900px]:rounded-2xl min-[900px]:px-[19px] min-[900px]:py-[14px]" aria-hidden="true">
        <div className="grid w-[min(70%,300px)] gap-[10px]">
          <span className="h-[22px] w-full animate-pulse rounded-md bg-[#ededed] motion-reduce:animate-none" />
          <span className="h-[13px] w-[72%] animate-pulse rounded-md bg-[#ededed] motion-reduce:animate-none" />
        </div>
        <div className="h-[86px] w-[83px] shrink-0 rotate-2 animate-pulse overflow-hidden rounded-[18px] border-[3px] border-white bg-[#ededed] shadow-[0_4px_7px_#00000035] motion-reduce:animate-none min-[900px]:h-[66px] min-[900px]:w-[65px] min-[900px]:rounded-[13px]" />
      </div>
      {[0, 1].map((section) => <section className="mb-[31px] min-[900px]:mb-[33px]" key={section} aria-hidden="true">
        <div className="mb-[18px] ml-0.5 min-[900px]:mb-[15px] min-[900px]:ml-0"><span className="block h-[23px] w-[min(70vw,320px)] animate-pulse rounded-md bg-[#ededed] motion-reduce:animate-none" /></div>
        <div className="-mr-7 grid auto-cols-[calc((100%-14px)/2)] grid-flow-col gap-[14px] overflow-x-auto snap-x snap-mandatory pb-[3px] pr-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[640px]:auto-cols-[calc((100%-42px)/4)] min-[900px]:mr-0 min-[900px]:auto-cols-[calc((100%-80px)/6)] min-[900px]:gap-4 min-[900px]:pr-0 min-[1200px]:auto-cols-[calc((100%-96px)/7)]">
          {Array.from({ length: 7 }, (_, index) => <article className="min-w-0 snap-start" key={`${section}-${index}`}>
            <div className="aspect-[1.055] animate-pulse overflow-hidden rounded-[22px] bg-[#ededed] motion-reduce:animate-none min-[900px]:aspect-square min-[900px]:rounded-[17px]" />
            <div className="grid gap-2 px-[5px] pt-[9px] min-[900px]:px-px">
              <span className="h-[13px] w-[88%] animate-pulse rounded-md bg-[#ededed] motion-reduce:animate-none" />
              <span className="h-[13px] w-[58%] animate-pulse rounded-md bg-[#ededed] motion-reduce:animate-none" />
            </div>
          </article>)}
        </div>
      </section>)}
    </div>
  );
}