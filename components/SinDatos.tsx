import { cn } from "@/lib/cn";

// El estado "vacío" de una pantalla, escrito una sola vez.
//
// Vacío NO es lo mismo que "sin resultados": vacío es que todavía no se cargó
// nada (lo sabe el servidor, la consulta trajo 0 filas); sin resultados es que
// hay datos pero la búsqueda no coincide (lo sabe el componente que tiene el
// filtro). Cada pantalla usa este componente con el texto que corresponde a
// su caso, nunca el mismo texto para los dos.

type Props = {
  titulo: string;
  descripcion?: string;
  // Lo que se puede hacer para salir del vacío (ej. un botón "Registrar venta").
  accion?: React.ReactNode;
  className?: string;
};

export default function SinDatos({ titulo, descripcion, accion, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center",
        className
      )}
    >
      <p className="font-medium">{titulo}</p>
      {descripcion ? <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p> : null}
      {accion ? <div className="mt-2">{accion}</div> : null}
    </div>
  );
}
