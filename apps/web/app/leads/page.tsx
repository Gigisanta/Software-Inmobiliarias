import { redirect } from "next/navigation";

/** Unificado en la sección Clientes (vista Lista). */
export default function LeadsRedirect() {
  redirect("/clientes?vista=lista");
}
