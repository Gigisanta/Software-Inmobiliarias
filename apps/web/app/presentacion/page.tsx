"use client";

/**
 * Presentación interactiva para la demo comercial.
 * Objetivo: que quien administra el CRM entienda en una sola lectura qué
 * le resuelve. Estructura: hero → antes/después → simulación de WhatsApp
 * en vivo (chat + lo que hace el CRM en paralelo) → cuándo entra la
 * persona → una tarjeta por pantalla del CRM con acceso a la app → cierre.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  House,
  Columns3,
  Users,
  Handshake,
  CalendarDays,
  MessageSquareText,
  Moon,
  Zap,
  ListChecks,
  BellRing,
  ArrowRight,
  Play,
  RotateCcw,
  Check,
  UserRound,
  Banknote,
  Sparkles,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Guión de la conversación simulada                                   */
/* ------------------------------------------------------------------ */

interface CrmEffect {
  icon: LucideIcon;
  label: string;
  detail: string;
  highlight?: boolean;
}

interface ChatStep {
  from: "lead" | "bot";
  text: string;
  time: string;
  effect?: CrmEffect;
}

const SCRIPT: ChatStep[] = [
  {
    from: "lead",
    text: "Hola! Vi el depto de 2 ambientes en Palermo en el portal, ¿sigue disponible?",
    time: "22:47",
    effect: {
      icon: UserRound,
      label: "Se crea el contacto solo",
      detail: "Sofía entra al sistema como lead nuevo, con la propiedad que consultó.",
    },
  },
  {
    from: "bot",
    text: "¡Hola! Sí, está disponible 😊 Es un 2 ambientes con balcón, en US$ 145.000. ¿Lo buscás para mudarte o como inversión?",
    time: "22:47",
    effect: {
      icon: Zap,
      label: "Respuesta en segundos",
      detail: "Son las 22:47. Nadie del equipo tuvo que hacer nada.",
    },
  },
  {
    from: "lead",
    text: "Para mudarme con mi pareja",
    time: "22:48",
  },
  {
    from: "bot",
    text: "¡Genial! ¿En qué presupuesto se están moviendo? Así te confirmo si esta propiedad les cierra o te muestro otras opciones.",
    time: "22:48",
    effect: {
      icon: ListChecks,
      label: "El asistente averigua lo importante",
      detail: "Uso, presupuesto, forma de pago: las preguntas que vos hacés siempre.",
    },
  },
  {
    from: "lead",
    text: "Hasta 150 mil. Tenemos un crédito aprobado",
    time: "22:50",
    effect: {
      icon: Banknote,
      label: "Queda clasificado como comprador serio",
      detail: "Presupuesto definido + crédito aprobado → prioridad alta en el tablero.",
    },
  },
  {
    from: "bot",
    text: "Perfecto, están dentro del rango 👌 ¿Querés venir a verlo? Tengo lugar el jueves a las 15:00 o el sábado a las 10:30.",
    time: "22:50",
  },
  {
    from: "lead",
    text: "El sábado a las 10:30 va perfecto!",
    time: "22:51",
    effect: {
      icon: CalendarDays,
      label: "Visita agendada",
      detail: "Sábado 10:30 queda en la agenda, con cliente y propiedad cargados.",
    },
  },
  {
    from: "bot",
    text: "¡Listo, Sofía! Quedó agendado para el sábado a las 10:30. Tu asesora te confirma por acá y te espera en la propiedad 🏠",
    time: "22:51",
    effect: {
      icon: BellRing,
      label: "Recién acá entrás vos",
      detail:
        "A la mañana encontrás la tarea lista: “Confirmar visita con Sofía — sáb 10:30”, con toda la charla y los datos ya cargados.",
      highlight: true,
    },
  },
];

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function PresentacionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Hero />
      <BeforeAfter />
      <LiveDemo />
      <HandoffSection />
      <ScreensSection />
      <ClosingSection />
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
          <span className="hidden text-sm text-muted-2 sm:inline">· RealEstate OS</span>
        </div>
        <Link href="/" target="_blank">
          <Button variant="secondary" size="sm">
            Abrir el CRM en vivo
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
      <FadeIn>
        <Badge variant="sage" className="mx-auto">
          <Sparkles className="h-3 w-3" />
          Demo interactiva del CRM
        </Badge>
        <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Cada consulta se responde sola.
          <br />
          <span className="text-primary">Vos hablás solo con los que van a comprar.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Hoy cada mensaje que llega depende de vos: responderlo, anotarlo, acordarte de hacer el
          seguimiento. Este sistema responde al instante a cualquier hora, averigua qué busca cada
          persona, agenda la visita y te avisa recién cuando hay alguien listo para avanzar.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="#demo">
            <Button size="lg">
              <Play className="h-4 w-4" />
              Ver cómo trabaja
            </Button>
          </a>
        </div>
      </FadeIn>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Antes / Después                                                     */
/* ------------------------------------------------------------------ */

const BEFORE = [
  "Respondés cada mensaje una por una, cuando podés.",
  "Las consultas de la noche y el fin de semana esperan hasta el día siguiente.",
  "El seguimiento vive en tu memoria, papeles y chats sueltos.",
  "Algunos interesados se enfrían sin que nadie lo note.",
];

const AFTER = [
  "El asistente responde en segundos, las 24 horas.",
  "Cada consulta queda anotada, clasificada y ordenada por importancia.",
  "Los seguimientos se disparan solos: nadie queda olvidado.",
  "Vos usás tu tiempo en visitas, negociaciones y cierres.",
];

function BeforeAfter() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-20">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FadeIn>
          <Card className="h-full">
            <CardContent className="px-7 py-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-2">Hoy</p>
              <h3 className="mt-1 text-lg font-semibold">Todo pasa por vos</h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {BEFORE.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.08}>
          <Card className="h-full border-primary/30 bg-primary-soft/40">
            <CardContent className="px-7 py-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Con RealEstate OS
              </p>
              <h3 className="mt-1 text-lg font-semibold">Vos decidís, el sistema trabaja</h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {AFTER.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Demo en vivo: chat + panel del CRM                                  */
/* ------------------------------------------------------------------ */

function LiveDemo() {
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const finished = stepIndex >= SCRIPT.length - 1;
  const started = stepIndex >= 0 || playing;

  // Avanza el guión: pausa breve entre mensajes + indicador "escribiendo…" del bot.
  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= SCRIPT.length - 1) {
      setPlaying(false);
      return;
    }
    const next = SCRIPT[stepIndex + 1];
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    const delay = stepIndex === -1 ? 500 : next.from === "lead" ? 1400 : 900;
    const timer = setTimeout(() => {
      if (next.from === "bot") {
        setTyping(true);
        typingTimer = setTimeout(() => {
          setTyping(false);
          setStepIndex((i) => i + 1);
        }, 1300);
      } else {
        setStepIndex((i) => i + 1);
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, [playing, stepIndex]);

  // Mantiene el chat scrolleado al último mensaje.
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [stepIndex, typing]);

  function start() {
    setStepIndex(-1);
    setTyping(false);
    setPlaying(true);
  }

  const visibleSteps = SCRIPT.slice(0, stepIndex + 1);
  const effects = visibleSteps.map((s) => s.effect).filter((e): e is CrmEffect => e != null);

  return (
    <section id="demo" className="border-y border-border bg-surface py-20">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Una consulta real, un martes a las 22:47
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              A la izquierda, el WhatsApp de la inmobiliaria. A la derecha, lo que el sistema hace
              solo mientras tanto. La oficina está cerrada y nadie tocó el teléfono.
            </p>
            <div className="mt-6">
              <Button onClick={start} size="lg" variant={started ? "secondary" : "primary"}>
                {started ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Repetir la demo
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Reproducir la conversación
                  </>
                )}
              </Button>
            </div>
          </div>
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          {/* Teléfono */}
          <FadeIn delay={0.05}>
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-border bg-background shadow-overlay">
              {/* Header estilo WhatsApp */}
              <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-xs font-semibold">
                  IN
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">Inmobiliaria Demo</p>
                  <p className="text-[11px] leading-tight text-white/70">
                    {typing ? "escribiendo…" : "en línea"}
                  </p>
                </div>
              </div>

              <div
                ref={chatRef}
                className="flex h-[420px] flex-col gap-2 overflow-y-auto bg-[#efeae2] px-3 py-4 dark:bg-[#1d1f23]"
              >
                <div className="mx-auto mb-1 rounded-lg bg-surface px-3 py-1 text-[11px] text-muted shadow-card">
                  Martes · 22:47
                </div>

                {!started && (
                  <p className="m-auto max-w-[220px] text-center text-sm text-muted-2">
                    Tocá «Reproducir la conversación» para ver al asistente en acción.
                  </p>
                )}

                <AnimatePresence>
                  {visibleSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card",
                        step.from === "lead"
                          ? "self-start rounded-tl-md bg-surface text-foreground"
                          : "self-end rounded-tr-md bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-white",
                      )}
                    >
                      {step.text}
                      <span
                        className={cn(
                          "mt-1 block text-right text-[10px]",
                          step.from === "lead" ? "text-muted-2" : "text-[#111b21]/50 dark:text-white/50",
                        )}
                      >
                        {step.time}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {typing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 self-end rounded-2xl rounded-tr-md bg-[#d9fdd3] px-4 py-3 shadow-card dark:bg-[#005c4b]"
                  >
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#111b21]/40 dark:bg-white/60"
                        style={{ animationDelay: `${d * 0.2}s` }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </FadeIn>

          {/* Panel: lo que hace el CRM */}
          <FadeIn delay={0.1}>
            <Card className="h-full">
              <CardContent className="px-7 py-7">
                <h3 className="text-sm font-semibold">Lo que el sistema hace mientras tanto</h3>
                {effects.length === 0 ? (
                  <p className="mt-6 text-sm text-muted-2">
                    Cuando arranque la conversación, acá vas a ver cómo el CRM trabaja solo: crea el
                    contacto, lo clasifica, agenda la visita y te deja la tarea lista.
                  </p>
                ) : (
                  <ol className="mt-6 flex flex-col gap-5">
                    <AnimatePresence>
                      {effects.map((effect, i) => {
                        const Icon = effect.icon;
                        return (
                          <motion.li
                            key={effect.label}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className={cn(
                              "flex items-start gap-3.5 rounded-2xl p-3.5",
                              effect.highlight
                                ? "border border-primary/30 bg-primary-soft"
                                : "bg-surface-2/60",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                                effect.highlight
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-surface text-primary",
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </span>
                            <div>
                              <p className="text-sm font-semibold leading-snug">{effect.label}</p>
                              <p className="mt-1 text-sm leading-relaxed text-muted">{effect.detail}</p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ol>
                )}

                {finished && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 rounded-2xl bg-surface-2/60 px-4 py-3 text-sm leading-relaxed text-muted"
                  >
                    Todo esto pasó <span className="font-semibold text-foreground">sin tocar el teléfono</span>.
                    Sofía se fue a dormir con su visita agendada, y vos empezás el día con una
                    compradora calificada en lugar de veinte chats sin leer.
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cuándo entra la persona que administra el CRM                       */
/* ------------------------------------------------------------------ */

const HANDOFF_RULES = [
  {
    icon: PhoneCall,
    title: "Si piden hablar con una persona",
    text: "El asistente se corre al instante y te avisa. Nadie queda atrapado hablando con un robot.",
  },
  {
    icon: Handshake,
    title: "Si quieren negociar o reservar",
    text: "Precio, contraofertas y reservas son siempre tuyos. El asistente junta los datos y te los sirve.",
  },
  {
    icon: BellRing,
    title: "Si el cliente está listo",
    text: "Visita agendada o interés fuerte → te crea la tarea con nombre, presupuesto y propiedad. Llegás con todo leído.",
  },
];

function HandoffSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <FadeIn>
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">El asistente no te reemplaza</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Hace el trabajo repetitivo y le pasa la posta en el momento justo. Las decisiones y la
            relación con el cliente siguen siendo suyas.
          </p>
        </div>
      </FadeIn>
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {HANDOFF_RULES.map((rule, i) => {
          const Icon = rule.icon;
          return (
            <FadeIn key={rule.title} delay={i * 0.06}>
              <Card className="h-full">
                <CardContent className="px-7 py-7">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{rule.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{rule.text}</p>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Una tarjeta por pantalla del CRM                                    */
/* ------------------------------------------------------------------ */

const SCREENS = [
  {
    icon: House,
    href: "/",
    name: "Hoy",
    what: "Tu día de trabajo en una sola pantalla.",
    solves:
      "Al abrirla ves las visitas de hoy, a quién tenés que llamar y qué operaciones necesitan atención. Reemplaza al cuaderno y a la memoria.",
  },
  {
    icon: Columns3,
    href: "/clientes?vista=tablero",
    name: "Pipeline",
    what: "Cada cliente es una tarjeta que avanza por etapas.",
    solves:
      "De «Nuevo» a «Vendido», arrastrando con el mouse. Con un vistazo sabés en qué está cada operación y cuánta plata hay en juego en cada etapa.",
  },
  {
    icon: Users,
    href: "/clientes?vista=lista",
    name: "Leads",
    what: "Todos tus contactos, con su historia completa.",
    solves:
      "Qué buscan, cuánto tienen, qué visitaron, qué dijo el asistente. Se acabó buscar en chats viejos quién era cada persona.",
  },
  {
    icon: Handshake,
    href: "/clientes?vista=prioridad",
    name: "Oportunidades",
    what: "A quién llamar primero cada mañana.",
    solves:
      "El sistema ordena tus contactos por probabilidad de cierre y te sugiere la próxima acción. Empezás el día por el que está por decidir, no por el último que escribió.",
  },
  {
    icon: CalendarDays,
    href: "/agenda",
    name: "Agenda",
    what: "Tus visitas confirmadas, listas para ir.",
    solves:
      "El asistente las agenda con cliente, propiedad y horario. Vos solo confirmás y te presentás.",
  },
  {
    icon: MessageSquareText,
    href: "/conversaciones",
    name: "Conversaciones",
    what: "Todos los chats de WhatsApp en una bandeja.",
    solves:
      "Vas a ver cada conversación que manejó el asistente y retomarla donde la dejó, desde la computadora.",
  },
];

function ScreensSection() {
  return (
    <section className="border-t border-border bg-surface py-20">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Las pantallas, explicadas en una oración</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Cada tarjeta abre la pantalla real del sistema, con datos de ejemplo cargados. Tocá y
              recorrelas: es la misma herramienta que vas a usar todos los días.
            </p>
          </div>
        </FadeIn>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map((screen, i) => {
            const Icon = screen.icon;
            return (
              <FadeIn key={screen.name} delay={i * 0.05}>
                <Link href={screen.href} target="_blank" className="group block h-full">
                  <Card interactive className="h-full">
                    <CardContent className="flex h-full flex-col px-7 py-7">
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-2 transition-transform duration-[180ms] group-hover:translate-x-0.5" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold">{screen.name}</h3>
                      <p className="mt-1 text-sm font-medium text-primary">{screen.what}</p>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{screen.solves}</p>
                      <p className="mt-4 text-xs font-medium text-muted-2">Verla en vivo →</p>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cierre                                                              */
/* ------------------------------------------------------------------ */

function ClosingSection() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <FadeIn>
        <Moon className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
        <h2 className="mt-5 text-3xl font-semibold tracking-tight">
          Mientras vos descansás, la inmobiliaria sigue atendiendo.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Cada consulta respondida al momento, cada interesado clasificado, cada visita agendada. Y
          cada mañana, una lista clara de con quién vale la pena hablar.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/planes" target="_blank">
            <Button size="lg">
              Ver planes y precios
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="secondary" size="lg">
              Recorrer el CRM en vivo
            </Button>
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
