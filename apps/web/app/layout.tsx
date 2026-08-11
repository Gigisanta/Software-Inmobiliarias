import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Valida el entorno del servidor al arrancar (falla rápido si falta seguridad).
import "@/lib/env";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antelo Negocios Inmobiliarios · CRM",
  description: "CRM de Antelo Negocios Inmobiliarios — Neuquén. Leads, visitas y operaciones en un solo lugar.",
};

/** Aplica el tema guardado antes del primer paint (evita el flash de tema). */
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem("reos-theme");
  if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
