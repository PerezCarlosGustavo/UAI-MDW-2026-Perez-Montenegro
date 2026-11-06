"use client";

import { useActionState } from "react";
import Link from "next/link";
import { crearCategoriaAction } from "@/app/(app)/categorias/acciones";
import Campo from "@/components/Campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoCategoria } from "@/lib/categoria/categoria";

const estadoInicial: EstadoCategoria = {};

export default function FormularioCategoria() {
  const [estado, accion, guardando] = useActionState(crearCategoriaAction, estadoInicial);

  return (
    <form action={accion} className="grid gap-4" noValidate aria-busy={guardando}>
      <Campo etiqueta="Nombre" errores={estado.errores?.nombre}>
        {(control) => <Input key={estado.nombre} {...control} name="nombre" required defaultValue={estado.nombre} disabled={guardando} />}
      </Campo>
      {estado.mensaje ? <p role="alert" className="text-sm text-destructive">{estado.mensaje}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
        <Button asChild variant="outline"><Link href="/categorias">Cancelar</Link></Button>
      </div>
    </form>
  );
}
