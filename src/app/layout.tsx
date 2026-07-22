import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Reservas",
  description: "Reservas claras para negocios que trabajan con su tiempo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
