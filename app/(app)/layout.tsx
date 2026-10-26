import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import Navegacion from "@/components/Navegacion";

// Layout de todo lo que requiere sesión: pone la barra y manda al login a
// quien no está logueado.
//
// Ojo: este redirect es experiencia de uso, NO seguridad. Un layout no se
// vuelve a ejecutar en cada navegación del lado del cliente, así que cada
// página y cada endpoint siguen verificando quién mira (requerirUsuario /
// verificarPermiso). La autorización vive donde vivía.
export default async function LayoutConSesion({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuario();

  if (!usuario) redirect("/ingresar");

  return (
    <>
      <Navegacion usuario={usuario} />
      {children}
    </>
  );
}
