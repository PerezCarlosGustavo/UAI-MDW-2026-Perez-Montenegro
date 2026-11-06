"use client";


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
      {activo ? (
        <Button type="submit" variant="outline" size="sm" disabled={pendiente} aria-label={"Dar de baja " + nombre}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg>
          {pendiente ? "Guardando…" : "Dar de baja"}
        </Button>
      ) : (
        <Button type="submit" variant="outline" size="sm" disabled={pendiente} aria-label={"Reactivar " + nombre}>
          {pendiente ? "Guardando…" : "Reactivar"}
        </Button>
      )}
      {estado.mensaje ? (
        <p role="alert" className="mt-1 text-sm text-destructive">{estado.mensaje}</p>
      ) : null}
    </form>
  );
}
