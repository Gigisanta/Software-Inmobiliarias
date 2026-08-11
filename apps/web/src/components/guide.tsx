"use client";

/**
 * Guía integrada de la plataforma: explica cada pantalla en una lectura.
 *
 * Tres piezas que comparten el mismo contenido:
 *  - WelcomeModal: primera visita → ofrece el recorrido guiado.
 *  - Tour: tarjeta flotante que navega pantalla por pantalla explicando
 *    qué es cada una y qué le soluciona a quien administra el CRM.
 *  - PageGuide: tarjeta descartable al tope de cada pantalla con la misma
 *    explicación, para leer a su propio ritmo.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  House,
  Users,
  CalendarDays,
  MessageSquareText,
  ListChecks,
  BookOpen,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Contenido: una entrada por pantalla                                 */
/* ------------------------------------------------------------------ */

interface GuideEntry {
  route: string;
  name: string;
  icon: LucideIcon;
  /** Qué es esta pantalla, en una oración. */
  what: string;
  /** Qué le soluciona a quien administra el CRM, en una oración. */
  solves: string;
}

export const GUIDE: GuideEntry[] = [
  {
    route: "/",
    name: "Hoy",
    icon: House,
    what: "Tu día de trabajo en una sola pantalla: visitas, llamadas pendientes y operaciones en curso.",
    solves:
      "Reemplaza al cuaderno y a la memoria: abrís el sistema a la mañana y ya sabés qué hacer primero.",
  },
  {
    route: "/clientes",
    name: "Clientes",
    icon: Users,
    what: "Todos tus contactos y operaciones en un solo lugar, con tres vistas: Tablero (arrastrás por etapas), Lista (buscás y filtrás) y Prioridad (los más calientes primero).",
    solves:
      "Sabés en qué está cada operación, tenés la ficha completa de cada persona y empezás el día llamando al que está por decidir. Todo sin cambiar de pantalla.",
  },
  {
    route: "/agenda",
    name: "Agenda",
    icon: CalendarDays,
    what: "Tus visitas, llamadas y reuniones de los próximos días, con cliente, propiedad y horario.",
    solves: "El asistente las agenda por vos; acá solo confirmás y te presentás. Sin superposiciones ni olvidos.",
  },
  {
    route: "/conversaciones",
    name: "Conversaciones",
    icon: MessageSquareText,
    what: "Todos los chats de WhatsApp de la inmobiliaria en una sola bandeja, con IA que responde y clasifica (plan Pro).",
    solves:
      "Ves cada conversación que manejó el asistente y la retomás donde la dejó, desde la computadora.",
  },
  {
    route: "/tareas",
    name: "Tareas",
    icon: ListChecks,
    what: "Los pendientes que hacen avanzar cada operación: llamar, enviar documentación, coordinar.",
    solves: "Cada seguimiento con fecha y responsable. Si algo vence, el sistema te lo recuerda — no tu memoria.",
  },
];

function entryFor(pathname: string): GuideEntry | undefined {
  return GUIDE.find((e) => e.route === pathname);
}

/* ------------------------------------------------------------------ */
/* Contexto del recorrido                                              */
/* ------------------------------------------------------------------ */

interface GuideContextValue {
  tourStep: number | null;
  startTour: () => void;
}

const GuideContext = createContext<GuideContextValue>({ tourStep: null, startTour: () => {} });

export function useGuide(): GuideContextValue {
  return useContext(GuideContext);
}

const WELCOME_KEY = "reos-welcome-seen";

export function GuideProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Primera visita → ofrecer el recorrido.
  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_KEY)) setWelcomeOpen(true);
    } catch {
      /* sin almacenamiento: no ofrecemos la bienvenida */
    }
  }, []);

  function dismissWelcome() {
    setWelcomeOpen(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignorable */
    }
  }

  function startTour() {
    dismissWelcome();
    setTourStep(0);
    router.push(GUIDE[0].route);
  }

  function goTo(step: number) {
    if (step < 0 || step >= GUIDE.length) {
      setTourStep(null);
      return;
    }
    setTourStep(step);
    router.push(GUIDE[step].route);
  }

  return (
    <GuideContext.Provider value={{ tourStep, startTour }}>
      {children}
      <WelcomeModal open={welcomeOpen} onStart={startTour} onSkip={dismissWelcome} />
      <TourCard step={tourStep} onGo={goTo} onClose={() => setTourStep(null)} />
    </GuideContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Modal de bienvenida (primera visita)                                */
/* ------------------------------------------------------------------ */

function WelcomeModal({
  open,
  onStart,
  onSkip,
}: {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 bg-foreground/25 dark:bg-black/60"
            onMouseDown={onSkip}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-overlay"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Sparkles className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">
              Bienvenido a RealEstate OS
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              El sistema que responde tus consultas, ordena tus clientes y te dice a quién llamar
              primero. ¿Te mostramos la plataforma en un recorrido de un minuto?
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={onStart} size="lg">
                Empezar el recorrido
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={onSkip} variant="ghost">
                Explorar por mi cuenta
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta flotante del recorrido                                      */
/* ------------------------------------------------------------------ */

function TourCard({
  step,
  onGo,
  onClose,
}: {
  step: number | null;
  onGo: (step: number) => void;
  onClose: () => void;
}) {
  const entry = step != null ? GUIDE[step] : null;

  return (
    <AnimatePresence>
      {entry && step != null ? (
        <motion.div
          key={entry.route}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-3rem))] rounded-2xl border border-primary/30 bg-surface p-6 shadow-overlay"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <entry.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Recorrido · {step + 1} de {GUIDE.length}
                </p>
                <h3 className="text-base font-semibold text-foreground">{entry.name}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar recorrido"
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground">{entry.what}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{entry.solves}</p>

          {/* Progreso */}
          <div className="mt-5 flex items-center gap-1.5">
            {GUIDE.map((g, i) => (
              <button
                key={g.route}
                onClick={() => onGo(i)}
                aria-label={`Ir a ${g.name}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-[180ms]",
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-border-strong",
                )}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => onGo(step - 1)} disabled={step === 0}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
            {step < GUIDE.length - 1 ? (
              <Button size="sm" onClick={() => onGo(step + 1)}>
                Siguiente
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={onClose}>
                Terminar recorrido
              </Button>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta explicativa por pantalla (descartable)                      */
/* ------------------------------------------------------------------ */

export function PageGuide() {
  const pathname = usePathname();
  const { tourStep } = useGuide();
  const entry = entryFor(pathname);
  const [dismissed, setDismissed] = useState(true);

  const storageKey = entry ? `reos-guide-dismissed:${entry.route}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (!entry || dismissed || tourStep != null) return null;

  function dismiss() {
    setDismissed(true);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignorable */
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mb-8 flex items-start gap-4 rounded-2xl border border-primary/25 bg-primary-soft/50 px-5 py-4"
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-primary">
        <BookOpen className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-relaxed text-foreground">{entry.what}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{entry.solves}</p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Entendido, ocultar guía"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-2 transition-colors duration-[180ms] hover:bg-surface hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
