import { redirect } from "next/navigation";

/** Unificado en la sección Clientes (vista Tablero). */
export default function PipelineRedirect() {
  redirect("/clientes?vista=tablero");
}
