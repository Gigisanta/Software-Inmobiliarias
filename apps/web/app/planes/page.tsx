"use client";

/**
 * Página de planes comercial e interactiva.
 * Dos planes: Básico (clasificación manual) y Pro (IA que responde y clasifica).
 * Piezas: hero → toggle mensual/anual → dos tarjetas de precio → comparador
 * en vivo "Con el Básico vs Con el Pro" → tabla completa de funciones → cierre.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X,
  Sparkles,
  Bot,
  Users,
  House,
  CalendarDays,
  Handshake,
  MessageSquareText,
  ListChecks,
  Zap,
  ArrowRight,
  Clock,
  Star,
  Headphones,
  Hand,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Datos de los planes                                                 */
/* ------------------------------------------------------------------ */

type Billing = "mensual" | "anual";

const PRICES = {
  basico: { mensual: 150, anualMes: 125, anualTotal: 1500 },
  pro: { mensual: 250, anualMes: 208, anualTotal: 2500 },
};

const BASICO_INCLUYE = [
  "CRM completo: pipeline, fichas y agenda",
  "Panel «Hoy» con visitas y seguimientos del día",
  "Priorización de leads y oportunidades",
  "Tareas y recordatorios",
  "Multiusuario con roles",
  "Recorrido guiado y soporte por chat",
];

const BASICO_LIMITE = [
  "Respondés cada consulta a mano",
  "Clasificás cada lead manualmente",
  "Cargás los contactos vos",
];

const PRO_SUMA = [
  "IA entrenada que responde mensajes precisos, 24/7",
  "Clasificación automática y perfecta de cada lead",
  "Creación automática de leads desde WhatsApp",
  "Agenda de visitas gestionada por el asistente",
  "Seguimientos automáticos que nadie olvida",
  "Derivación inteligente a vos en el momento justo",
  "Bandeja de conversaciones unificada",
];

/* ------------------------------------------------------------------ */
/* Tabla de funciones                                                  */
/* ------------------------------------------------------------------ */

type Cell = boolean | string;

interface Feature {
  name: string;
  desc: string;
  basico: Cell;
  pro: Cell;
}

interface FeatureGroup {
  category: string;
  icon: LucideIcon;
  highlight?: boolean;
  features: Feature[];
}

const GROUPS: FeatureGroup[] = [
  {
    category: "Gestión de clientes",
    icon: Users,
    features: [
      {
        name: "Ficha completa del cliente",
        desc: "Qué busca, cuánto tiene, qué visitó y toda su historia en un solo lugar.",
        basico: true,
        pro: true,
      },
      {
        name: "Pipeline de ventas",
        desc: "Cada operación es una tarjeta que avanza de «Nuevo» a «Vendido», arrastrando.",
        basico: true,
        pro: true,
      },
      {
        name: "Buscador y filtros",
        desc: "Encontrá cualquier cliente por nombre, teléfono o etapa al instante.",
        basico: true,
        pro: true,
      },
    ],
  },
  {
    category: "Tu día de trabajo",
    icon: House,
    features: [
      {
        name: "Panel «Hoy»",
        desc: "Visitas del día, seguimientos pendientes y operaciones en curso al abrir.",
        basico: true,
        pro: true,
      },
      {
        name: "Agenda de visitas",
        desc: "Todas tus visitas y reuniones con cliente, propiedad y horario.",
        basico: true,
        pro: true,
      },
      {
        name: "Tareas y recordatorios",
        desc: "Los pendientes que hacen avanzar cada operación, con fecha y responsable.",
        basico: true,
        pro: true,
      },
    ],
  },
  {
    category: "Inteligencia comercial",
    icon: Handshake,
    features: [
      {
        name: "Priorización de leads",
        desc: "El sistema ordena tus contactos por probabilidad de cierre.",
        basico: true,
        pro: true,
      },
      {
        name: "Oportunidades del día",
        desc: "A quién llamar primero cada mañana, con la próxima acción sugerida.",
        basico: true,
        pro: true,
      },
    ],
  },
  {
    category: "Respuesta y clasificación con IA",
    icon: Sparkles,
    highlight: true,
    features: [
      {
        name: "Respuesta a las consultas",
        desc: "Quién le contesta al cliente cuando escribe, a cualquier hora.",
        basico: "Manual",
        pro: "IA 24/7",
      },
      {
        name: "Clasificación del lead",
        desc: "Detectar si compra o alquila, presupuesto y si es prioridad alta.",
        basico: "Manual",
        pro: "Automática",
      },
      {
        name: "Carga de nuevos contactos",
        desc: "Que el cliente que escribe entre solo al sistema como lead.",
        basico: "Manual",
        pro: "Automática",
      },
      {
        name: "Agenda de visitas por el asistente",
        desc: "La IA propone horarios y agenda la visita dentro de la conversación.",
        basico: false,
        pro: true,
      },
      {
        name: "Seguimientos automáticos",
        desc: "El sistema retoma solo a los que se enfrían, sin que te acuerdes.",
        basico: false,
        pro: true,
      },
      {
        name: "Derivación inteligente a humano",
        desc: "Cuando el cliente está listo o pide una persona, te lo pasa a vos.",
        basico: false,
        pro: true,
      },
      {
        name: "Bandeja de WhatsApp unificada",
        desc: "Todos los chats que manejó el asistente, en una sola pantalla.",
        basico: false,
        pro: true,
      },
    ],
  },
  {
    category: "Equipo y soporte",
    icon: Headphones,
    features: [
      {
        name: "Usuarios y roles",
        desc: "Dueño, gerente y asesores, cada uno con su vista y permisos.",
        basico: "Hasta 2",
        pro: "Hasta 5",
      },
      {
        name: "Recorrido guiado en la app",
        desc: "La plataforma se explica sola, pantalla por pantalla.",
        basico: true,
        pro: true,
      },
      {
        name: "Soporte",
        desc: "Ayuda cuando la necesitás.",
        basico: "Por chat",
        pro: "Prioritario",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function PlanesPage() {
  const [billing, setBilling] = useState<Billing>("mensual");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Hero billing={billing} onBilling={setBilling} />
      <PlanCards billing={billing} />
      <LiveComparison />
      <FeatureTable />
      <Closing />
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            ID
          </div>
          <span className="text-sm font-semibold">Inmobiliaria Demo</span>
          <span className="hidden text-sm text-muted-2 sm:inline">· Planes</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/presentacion" target="_blank">
            <Button variant="ghost" size="sm">
              Ver la presentación
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="secondary" size="sm">
              Abrir el CRM
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero + toggle                                                       */
/* ------------------------------------------------------------------ */

function Hero({ billing, onBilling }: { billing: Billing; onBilling: (b: Billing) => void }) {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-10 pt-20 text-center">
      <FadeIn>
        <Badge variant="sage" className="mx-auto">
          <Sparkles className="h-3 w-3" />
          Elegí tu plan
        </Badge>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Un plan que te ordena.
          <br />
          <span className="text-primary">Otro que trabaja por vos.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Los dos incluyen el CRM completo. La diferencia es quién responde y clasifica las
          consultas: vos a mano, o una IA entrenada que lo hace al instante y sin errores.
        </p>

        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <BillingBtn active={billing === "mensual"} onClick={() => onBilling("mensual")}>
            Mensual
          </BillingBtn>
          <BillingBtn active={billing === "anual"} onClick={() => onBilling("anual")}>
            Anual
            <span className="ml-1.5 rounded-full bg-(--badge-sage-bg) px-1.5 py-0.5 text-[10px] font-semibold text-(--badge-sage-fg)">
              2 meses gratis
            </span>
          </BillingBtn>
        </div>
      </FadeIn>
    </section>
  );
}

function BillingBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-[180ms] ease-out",
        active ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjetas de precio                                                  */
/* ------------------------------------------------------------------ */

function PlanCards({ billing }: { billing: Billing }) {
  const basico = billing === "mensual" ? PRICES.basico.mensual : PRICES.basico.anualMes;
  const pro = billing === "mensual" ? PRICES.pro.mensual : PRICES.pro.anualMes;

  return (
    <section className="mx-auto max-w-4xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Básico */}
        <FadeIn>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-8 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted">
                <Hand className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Básico</h2>
                <p className="text-xs text-muted-2">Ordená tu inmobiliaria</p>
              </div>
            </div>

            <PriceTag amount={basico} billing={billing} total={PRICES.basico.anualTotal} />

            <p className="mt-2 text-sm text-muted">Todo el CRM para trabajar ordenado.</p>

            <div className="my-6 h-px bg-border" />

            <ul className="flex flex-col gap-3">
              {BASICO_INCLUYE.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl bg-surface-2/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-2">
                Lo hacés vos, a mano
              </p>
              <ul className="mt-2.5 flex flex-col gap-2">
                {BASICO_LIMITE.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                    <Hand className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-2" strokeWidth={1.75} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Button variant="secondary" size="lg" className="w-full">
                Elegir Básico
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Pro */}
        <FadeIn delay={0.08}>
          <div className="relative flex h-full flex-col rounded-2xl border-2 border-primary bg-surface p-8 shadow-card-hover">
            <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
              <Star className="h-3 w-3" strokeWidth={2} />
              Recomendado
            </span>

            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Bot className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Pro</h2>
                <p className="text-xs text-primary">Con IA que responde por vos</p>
              </div>
            </div>

            <PriceTag amount={pro} billing={billing} total={PRICES.pro.anualTotal} />

            <p className="mt-2 text-sm text-muted">Todo el Básico, y la IA hace el trabajo pesado.</p>

            <div className="my-6 h-px bg-border" />

            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Todo lo del Básico, más:
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {PRO_SUMA.map((f, i) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                  {i === 0 || i === 1 ? (
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                  )}
                  <span className={cn(i <= 1 && "font-medium")}>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button size="lg" className="w-full">
                Elegir Pro
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>

      <p className="mt-6 text-center text-xs text-muted-2">
        Precios en USD. Puesta en marcha única (alta, número de WhatsApp y capacitación) según plan.
      </p>
    </section>
  );
}

function PriceTag({
  amount,
  billing,
  total,
}: {
  amount: number;
  billing: Billing;
  total: number;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-muted-2">US$</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={amount}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-4xl font-semibold tabular-nums"
          >
            {amount}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-muted">/ mes</span>
      </div>
      <p className="mt-1 h-4 text-xs text-muted-2">
        {billing === "anual" ? `Facturado US$ ${total} al año` : "Facturación mensual"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Comparador en vivo                                                  */
/* ------------------------------------------------------------------ */

function LiveComparison() {
  const [plan, setPlan] = useState<"basico" | "pro">("pro");

  return (
    <section className="border-y border-border bg-surface py-20">
      <div className="mx-auto max-w-4xl px-6">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              La misma consulta, un domingo a la noche
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Mirá qué pasa con cada plan cuando entra un mensaje y no estás mirando el teléfono.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
              <PlanToggle active={plan === "basico"} onClick={() => setPlan("basico")}>
                <Hand className="h-3.5 w-3.5" strokeWidth={1.75} />
                Con el Básico
              </PlanToggle>
              <PlanToggle active={plan === "pro"} onClick={() => setPlan("pro")}>
                <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
                Con el Pro
              </PlanToggle>
            </div>
          </div>
        </FadeIn>

        <div className="mx-auto mt-10 max-w-md">
          <div className="overflow-hidden rounded-[24px] border border-border bg-background shadow-overlay">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-xs font-semibold">
                SG
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Sofía Giménez</p>
                <p className="text-[11px] leading-tight text-white/70">Domingo · 23:14</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-[#efeae2] px-3 py-4 dark:bg-[#1d1f23]">
              <div className="max-w-[85%] self-start rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-card">
                Hola! Vi el depto de Palermo, ¿sigue disponible?
                <span className="mt-1 block text-right text-[10px] text-muted-2">23:14</span>
              </div>

              {plan === "pro" ? (
                <motion.div
                  key="pro-reply"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="max-w-[85%] self-end rounded-2xl rounded-tr-md bg-[#d9fdd3] px-3.5 py-2.5 text-sm text-[#111b21] shadow-card dark:bg-[#005c4b] dark:text-white"
                >
                  ¡Hola! Sí, está disponible 😊 Es un 2 ambientes con balcón, US$ 145.000. ¿Lo buscás
                  para mudarte o como inversión?
                  <span className="mt-1 block text-right text-[10px] text-[#111b21]/50 dark:text-white/50">
                    23:14
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="basico-wait"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22 }}
                  className="self-center rounded-full bg-surface px-3 py-1 text-[11px] text-muted-2 shadow-card"
                >
                  Sin respuesta — esperando a mañana
                </motion.div>
              )}
            </div>
          </div>

          {/* Resultado en el CRM */}
          <motion.div
            key={plan}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "mt-4 rounded-2xl border p-5",
              plan === "pro" ? "border-primary/30 bg-primary-soft" : "border-border bg-surface",
            )}
          >
            {plan === "pro" ? (
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Zap className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Respondido y clasificado en 8 segundos
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      El lead entró solo al sistema, ya etiquetado como{" "}
                      <span className="font-medium text-foreground">comprador · prioridad alta</span>.
                      A la mañana te espera con la visita encaminada.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="sage">Comprador</Badge>
                      <Badge variant="amber">Prioridad alta</Badge>
                      <Badge variant="slate">Palermo</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                    <Clock className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Queda esperando a que lo veas
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      Mañana tenés que leerlo, responderlo y clasificarlo a mano. Si Sofía no espera,
                      escribe a otra inmobiliaria que le conteste antes.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="neutral">Sin clasificar</Badge>
                      <Badge variant="neutral">Sin responder</Badge>
                    </div>
                  </div>
                </div>
              )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PlanToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-[180ms] ease-out",
        active ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Tabla completa de funciones                                         */
/* ------------------------------------------------------------------ */

function FeatureTable() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <FadeIn>
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Todo lo que incluye cada plan</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Pasá el detalle completo. Lo verde es lo que trae cada uno; lo importante está en la
            fila de respuesta y clasificación.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          {/* Encabezado sticky de columnas */}
          <div className="sticky top-14 z-10 grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border bg-surface/95 px-6 py-4 backdrop-blur">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-2">
              Función
            </span>
            <span className="w-20 text-center text-sm font-semibold text-muted">Básico</span>
            <span className="w-20 text-center text-sm font-semibold text-primary">Pro</span>
          </div>

          {GROUPS.map((group) => (
            <div key={group.category}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3",
                  group.highlight ? "bg-primary-soft/60" : "bg-surface-2/40",
                )}
              >
                <group.icon
                  className={cn("h-4 w-4", group.highlight ? "text-primary" : "text-muted")}
                  strokeWidth={1.75}
                />
                <h3
                  className={cn(
                    "text-sm font-semibold",
                    group.highlight ? "text-primary" : "text-foreground",
                  )}
                >
                  {group.category}
                </h3>
                {group.highlight && (
                  <Badge variant="amber" className="ml-1">
                    La gran diferencia
                  </Badge>
                )}
              </div>

              {group.features.map((f) => (
                <div
                  key={f.name}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-border px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{f.desc}</p>
                  </div>
                  <div className="w-20 text-center">
                    <CellValue value={f.basico} />
                  </div>
                  <div className="w-20 text-center">
                    <CellValue value={f.pro} pro />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

function CellValue({ value, pro = false }: { value: Cell; pro?: boolean }) {
  if (value === true) {
    return (
      <Check
        className={cn("mx-auto h-4 w-4", pro ? "text-primary" : "text-success")}
        strokeWidth={2.5}
      />
    );
  }
  if (value === false) {
    return <X className="mx-auto h-4 w-4 text-muted-2" strokeWidth={2} />;
  }
  // Valor de texto (Manual / Automática / IA 24/7 …)
  const isManual = value === "Manual";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold",
        isManual
          ? "bg-(--badge-neutral-bg) text-(--badge-neutral-fg)"
          : pro
            ? "bg-(--badge-sage-bg) text-(--badge-sage-fg)"
            : "bg-(--badge-neutral-bg) text-(--badge-neutral-fg)",
      )}
    >
      {value}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Cierre                                                              */
/* ------------------------------------------------------------------ */

function Closing() {
  return (
    <section className="border-t border-border bg-surface py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <Bot className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            ¿Cuánto vale una venta que hoy se pierde?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Una sola operación rescatada por responder a tiempo paga el plan Pro por más de un año.
            El Básico te ordena; el Pro atiende por vos mientras dormís.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/presentacion" target="_blank">
              <Button variant="secondary" size="lg">
                Ver la presentación
              </Button>
            </Link>
            <Link href="/" target="_blank">
              <Button size="lg">
                Probar el CRM
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
