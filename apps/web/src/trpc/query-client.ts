import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Volver a una sección visitada hace poco es instantáneo (usa caché).
        // Es seguro subirlo porque las mutaciones invalidan explícitamente lo
        // que cambian (ver useInvalidate); no dependemos de que expire solo.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
