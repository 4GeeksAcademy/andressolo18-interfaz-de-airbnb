import type { Metadata } from "next";
import "./globals.css";

// Configuración de Next.js para el título y la descripción; no es un componente ni recibe props.
export const metadata: Metadata = {
  title: "Airbnb | Alojamientos y escapadas en Chile",
  description: "Encuentra apartamentos, cabañas y lugares especiales para tu próxima escapada en Viña del Mar, Santiago y Pucón. Proyecto de interfaz con datos de ejemplo.",
};

/**
 * RootLayout: componente raíz del App Router, compartido por las páginas.
 * Prop children (ReactNode, tipada por LayoutProps<"/">): contenido de la ruta activa;
 * en la ruta "/" corresponde a Home, definido en page.tsx.
 * Layout: html establece el idioma y body contiene children. globals.css es el
 * punto de entrada requerido para que Tailwind genere las utilidades.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL">
      <body className="m-0 bg-white font-sans text-sm text-[#222] antialiased [-webkit-tap-highlight-color:transparent] [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-35 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#ff385c] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#ff385c] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-offset-4 [&_summary:focus-visible]:outline-[#ff385c] [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-[#222] [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-offset-2 [&_select:focus-visible]:outline-[#222]">{children}</body>
    </html>
  );
}
