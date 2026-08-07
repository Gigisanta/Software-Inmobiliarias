"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";

/** Logo de la inmobiliaria (tenant): imagen propia si la cargó, o monograma sobrio. */
export function TenantLogo() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.health.me.queryOptions());
  const tenant = data?.tenant;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-28" />
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
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      {tenant?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.logoUrl}
          alt={name}
          className="h-8 w-8 shrink-0 rounded-lg object-contain"
        />
      ) : (
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold text-primary-foreground"
          style={{ backgroundColor: tenant?.brandColor ?? "var(--color-primary)" }}
        >
          {monogram}
        </div>
      )}
      <span className="truncate text-sm font-semibold text-foreground">{name}</span>
    </Link>
  );
}
