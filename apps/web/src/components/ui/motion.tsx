"use client";

/**
 * Presets de animación del sistema: 180–250ms, easeOut, sin rebotes.
 * Un solo lugar para mantener consistencia en todas las páginas.
 */
import { motion, type Variants } from "motion/react";

export const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

export const staggerList: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

/** Contenedor que anima su entrada al montar (fade + slide sutil). */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  // Se acota el delay para que el escalonado entre secciones se sienta inmediato
  // (antes llegaba a 0.2s y demoraba la aparición de las últimas tarjetas al navegar).
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay: Math.min(delay, 0.06) }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { motion };
