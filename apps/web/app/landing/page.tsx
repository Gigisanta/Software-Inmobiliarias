"use client";

import Link from "next/link";
import {
  Radar,
  Flame,
  Bot,
  Share2,
  MessageCircle,
  LayoutDashboard,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { BgAnimateButton } from "@/components/ui/bg-animate-button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ColorPanelsBg } from "@/components/color-panels-bg";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Radar,
    title: "Centro de Operaciones",
    desc: "Una torre de control en tiempo real, no un dashboard. La pantalla que el dueño deja abierta todo el día.",
  },
  {
    icon: Flame,
    title: "Lead Score explicable",
    desc: "Priorización automática que siempre explica el porqué y sugiere la próxima acción. 🔥 Oportunidades del día.",
  },
  {
    icon: Bot,
    title: "Automatizaciones + IA",
    desc: "Seguimientos que se disparan solos, respuestas, clasificación y resúmenes. La IA trabaja, no decora.",
  },
  {
    icon: Share2,
    title: "Distribución inteligente",
    desc: "Asignación por carga, zona y rendimiento, con reasignación automática si nadie responde a tiempo.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp + Landings",
    desc: "Cada asesor conecta su número. La IA responde, crea el lead, lo clasifica y agenda la visita.",
  },
  {
    icon: LayoutDashboard,
    title: "Pipeline centrado en el lead",
    desc: "La propiedad es un atributo del recorrido del cliente. Todo gira alrededor del ciclo de vida del lead.",
  },
];

const STATS = [
  { value: 73, suffix: "%", label: "menos tiempo de respuesta" },
  { value: 3, suffix: "×", label: "más conversión de leads" },
  { value: 0, prefix: "", suffix: " perdidos", label: "leads sin seguimiento" },
  { value: 24, suffix: "/7", label: "atención automatizada" },
];

export default function LandingPage() {
  return (
    <div className="landing-legacy dark relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/50 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand font-bold text-white shadow-lg shadow-primary/30">
              R
            </div>
            <span className="font-display text-[15px] font-semibold">RealEstate OS</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#producto" className="hover:text-foreground">Producto</a>
            <a href="#modulos" className="hover:text-foreground">Módulos</a>
            <a href="#numeros" className="hover:text-foreground">Resultados</a>
          </nav>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="producto" className="relative">
        <ColorPanelsBg />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              La IA que trabaja por tu inmobiliaria
            </span>
            <GradientHeading variant="light" size="xxl" className="mt-5 leading-[1.02]">
              El sistema operativo
              <br />
              para inmobiliarias
            </GradientHeading>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              No es otro CRM centrado en propiedades. Es el lugar donde ocurre toda la operación
              comercial: conversaciones, oportunidades y equipos, alrededor del{" "}
              <span className="text-gradient-brand font-semibold">lead</span>.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/">
                <BgAnimateButton gradient="brand" rounded="full" size="lg">
                  Probar gratis <ArrowRight className="h-4 w-4" />
                </BgAnimateButton>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium transition-colors hover:bg-white/8"
              >
                Ver el Centro de Operaciones
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-muted-2">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> Sin tarjeta
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> Multi-sucursal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> En español
              </span>
            </div>
          </div>

          {/* Preview del producto (glass, flotando) */}
          <div className="animate-float">
            <div className="glass rounded-2xl p-4 shadow-2xl shadow-primary/10">
              <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-hot/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-2 text-xs text-muted">Centro de Operaciones</span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" /> En vivo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: "Nuevos hoy", v: 12, c: "text-accent" },
                  { l: "Hot leads", v: 7, c: "text-hot" },
                  { l: "Visitas", v: 5, c: "text-foreground" },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted">{k.l}</div>
                    <div className={cn("font-display mt-1 text-2xl font-semibold", k.c)}>
                      <AnimatedNumber value={k.v} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { n: "Nuevo Lead", w: "38%" },
                  { n: "Interesado", w: "62%" },
                  { n: "Visita realizada", w: "80%" },
                  { n: "Negociación", w: "45%" },
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-muted">{s.n}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-brand" style={{ width: s.w }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="numeros" className="relative border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-14 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-bold md:text-5xl">
                <span className="text-gradient-brand">
                  {s.prefix}
                  <AnimatedNumber value={s.value} />
                  {s.suffix}
                </span>
              </div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="modulos" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <GradientHeading variant="light" size="lg">
            Todo lo que tu equipo comercial necesita
          </GradientHeading>
          <p className="mt-3 text-muted">
            Seis piezas que se integran alrededor del ciclo de vida del lead — para responder más
            rápido, no perder clientes y decidir con datos en tiempo real.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group glass animate-in rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-white shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden border-t border-white/[0.06]">
        <ColorPanelsBg className="opacity-70" />
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
          <GradientHeading variant="brand" size="xl">
            Empezá a vender más rápido hoy
          </GradientHeading>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Conectá tu WhatsApp, cargá tu equipo y mirá cómo el sistema prioriza el trabajo por vos.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/">
              <BgAnimateButton gradient="brand" rounded="full" size="lg">
                Entrar a RealEstate OS <ArrowRight className="h-4 w-4" />
              </BgAnimateButton>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted-2 md:flex-row">
          <span>© 2026 RealEstate OS — El SO para inmobiliarias.</span>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">Términos</a>
            <a href="#" className="hover:text-foreground">Privacidad</a>
            <Link href="/" className="hover:text-foreground">Ingresar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
