"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { StayCard } from "../components/StayCard";
import type { Stay } from "../stays";

export default function CatalogStayList({ items }: { items: Stay[] }) {
  const [priceOrder, setPriceOrder] = useState("ascending");
  const sortedStays = [...items].sort((first, second) => priceOrder === "ascending" ? first.price - second.price : second.price - first.price);

  return <section className="min-w-0" aria-label="Resultados de alojamientos">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold" aria-live="polite">{items.length} {items.length === 1 ? "resultado" : "resultados"}</h2>
      <label className="flex flex-wrap items-center gap-2 text-sm" htmlFor="price-order">
        Precio
        <select id="price-order" className="max-w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={priceOrder} onChange={(event) => setPriceOrder(event.target.value)}>
          <option value="ascending">Ascendente</option>
          <option value="descending">Descendente</option>
        </select>
      </label>
    </header>
    <div className="catalog-grid">
      {sortedStays.map((stay) => <StayCard key={stay.id} stay={stay} variant="catalog" />)}
      {!items.length && <div className="catalog-empty"><MapPin size={35} /><h2>No encontramos alojamientos</h2><p>Prueba con Viña del Mar, Santiago o Pucón.</p><Link href="/">Volver a buscar</Link></div>}
    </div>
  </section>;
}