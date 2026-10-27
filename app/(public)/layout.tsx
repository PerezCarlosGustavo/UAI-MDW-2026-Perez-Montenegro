// Layout de lo que se ve sin sesión (hoy, el login). No lleva la barra: un
// "Cerrar sesión" en una pantalla sin sesión sería una promesa que el sistema
// no puede cumplir.
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
