import { redirect } from "next/navigation";

/** Unificado en la sección Clientes (vista Prioridad). */
export default function OportunidadesRedirect() {
  redirect("/clientes?vista=prioridad");
}
