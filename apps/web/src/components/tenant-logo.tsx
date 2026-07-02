"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

/** Logo de la inmobiliaria (tenant) — esquina superior izquierda. */
export function TenantLogo() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.health.me.queryOptions());
  const tenant = data?.tenant;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  const name = tenant?.name ?? "RealEstate OS";
  const monogram = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent font-bold text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
        {monogram}
      </div>
      <div className="hidden leading-tight sm:block">
        <div className="text-sm font-semibold">{name}</div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success live-dot" />
          RealEstate OS · {tenant?.plan ?? "—"}
        </div>
      </div>
    </Link>
  );
}
