"use client";

import { useEffect } from "react";
import { motion, type MotionValue, useSpring, useTransform } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  mass?: number;
  stiffness?: number;
  damping?: number;
  precision?: number;
  format?: (value: number) => string;
  className?: string;
}

/**
 * Número que cuenta hacia su valor con física de resorte (cult-ui / motion).
 * Ideal para KPIs del Centro de Operaciones.
 */
export function AnimatedNumber({
  value,
  mass = 0.8,
  stiffness = 80,
  damping = 16,
  precision = 0,
  format = (num) => num.toLocaleString("es-AR"),
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(value, { mass, stiffness, damping });
  const display: MotionValue<string> = useTransform(spring, (current) =>
    format(parseFloat(current.toFixed(precision))),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
