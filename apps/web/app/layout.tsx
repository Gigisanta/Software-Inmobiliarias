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


/** maatwork-brand-metadata: maatwork-mw-20260901 */
const maatWorkBrandMetadata: Metadata = {
  metadataBase: new URL("https://realestate-os-demo.vercel.app"),
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/icon-mw.svg?v=maatwork-mw-20260901', type: 'image/svg+xml' },
      { url: '/favicon-mw-32.png?v=maatwork-mw-20260901', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-mw.ico?v=maatwork-mw-20260901', type: 'image/x-icon' },
    ],
    shortcut: ['/favicon-mw.ico?v=maatwork-mw-20260901'],
    apple: [{ url: '/apple-touch-mw.png?v=maatwork-mw-20260901', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/mask-mw.svg?v=maatwork-mw-20260901', color: '#0A0A11' }],
  },
  manifest: '/manifest.webmanifest?v=maatwork-mw-20260901',
  openGraph: {
    type: 'website',
    siteName: 'MaatWork',
    title: "RealEstate OS",
    description: "Sistema operativo inmobiliario",
    images: [{ url: '/og-image.png?v=maatwork-mw-20260901', width: 1200, height: 630, alt: "RealEstate OS · MaatWork" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "RealEstate OS",
    description: "Sistema operativo inmobiliario",
    images: ['/twitter-image.png?v=maatwork-mw-20260901'],
  },
}
Object.assign(metadata, maatWorkBrandMetadata)
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
