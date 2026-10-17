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
 * Layout: html establece el idioma y body contiene children. La importación de
 * globals.css aplica los estilos de Tailwind y las reglas responsive a sus descendientes.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
