/** Rol simulado para desarrollo (mientras Clerk no está cableado). */
export type DevRole = "OWNER" | "MANAGER" | "ADVISOR";

const KEY = "reos-dev-role";

export const DEV_ROLE_LABELS: Record<DevRole, string> = {
  OWNER: "Dueño",
  MANAGER: "Gerente",
  ADVISOR: "Asesor",
};

export function getDevRole(): DevRole {
  if (typeof window === "undefined") return "OWNER";
  const v = window.localStorage.getItem(KEY);
  return v === "MANAGER" || v === "ADVISOR" ? v : "OWNER";
}

export function setDevRole(role: DevRole): void {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, role);
}
