"use client";

// Un formulario que es solo un botón: es de cliente porque necesita acordarse
// de si está guardando y de lo que contestó el servidor. Todo lo demás (qué
// producto, darlo de baja o reactivarlo) lo fija la página en el servidor.

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR, type EstadoProducto } from "@/lib/formularios";

type Props = {
  accion: () => Promise<EstadoProducto>;
  activo: boolean;
  nombre: string;
};

export default function CambiarEstadoProducto({ accion, activo, nombre }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, SIN_ENVIAR);

  return (
    <form action={enviar}>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pendiente}
        aria-label={`${activo ? "Dar de baja" : "Reactivar"} ${nombre}`}
      >
        {pendiente ? "Guardando…" : activo ? "Dar de baja" : "Reactivar"}
      </Button>
      {estado.mensaje ? (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  );
}
