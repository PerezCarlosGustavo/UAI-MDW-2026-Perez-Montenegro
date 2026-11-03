"use client";

// Client Component por el estado: tiene que acordarse de lo que contestó el
// servidor y de si está guardando. Los valores los sigue guardando el
// navegador; lo único con useState es la casilla, porque habilita otro campo.

import Link from "next/link";
import { useActionState, useState } from "react";
import Campo from "@/components/Campo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import { SIN_ENVIAR, type EstadoProducto } from "@/lib/formularios";

type Props = {
  accion: (estado: EstadoProducto, formData: FormData) => Promise<EstadoProducto>;
  categorias: { id: number; nombre: string }[];
  etiquetaGuardar: string;
  // Lo que se muestra al abrir: vacío en el alta, el producto en la edición.
  inicial?: {
    nombre: string;
    categoriaid: string;
    codigobarra: string;
    preciolista: string;
    stockactual: string;
    permitestock: boolean;
  };
};

export default function FormularioProducto({ accion, categorias, etiquetaGuardar, inicial }: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, SIN_ENVIAR);
  const [controlaStock, setControlaStock] = useState(inicial?.permitestock ?? true);

  const valor = (campo: Exclude<keyof NonNullable<Props["inicial"]>, "permitestock">) =>
    estado.valores?.[campo] ?? inicial?.[campo] ?? "";

  return (
    // noValidate: los errores los decide el mismo schema en el servidor y se
    // muestran debajo de cada campo, no en el globo del navegador.
    <form action={enviar} noValidate className="grid gap-5">
      {estado.mensaje ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{estado.mensaje}</AlertDescription>
        </Alert>
      ) : null}

      <Campo etiqueta="Nombre" errores={estado.errores?.nombre}>
        {(control) => <Input {...control} name="nombre" defaultValue={valor("nombre")} maxLength={150} autoFocus />}
      </Campo>

      <Campo etiqueta="Categoría" errores={estado.errores?.categoriaid}>
        {(control) => (
          // Un <select> no toma un defaultValue nuevo después de montarse: la
          // key lo vuelve a crear para que conserve lo elegido si algo falla.
          <SelectNativo key={valor("categoriaid")} {...control} name="categoriaid" defaultValue={valor("categoriaid")}>
            <option value="">Seleccionar</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={String(categoria.id)}>
                {categoria.nombre}
              </option>
            ))}
          </SelectNativo>
        )}
      </Campo>

      <Campo
        etiqueta="Código de barras"
        ayuda="Opcional. Podés escanearlo con el lector."
        errores={estado.errores?.codigobarra}
      >
        {(control) => <Input {...control} name="codigobarra" defaultValue={valor("codigobarra")} maxLength={50} />}
      </Campo>

      <Campo etiqueta="Precio de lista" errores={estado.errores?.preciolista}>
        {(control) => (
          <Input
            {...control}
            name="preciolista"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={valor("preciolista")}
            className="tabular-nums"
          />
        )}
      </Campo>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="permitestock"
          checked={controlaStock}
          onChange={(evento) => setControlaStock(evento.target.checked)}
          className="size-4 accent-primary"
        />
        Gestiona stock
      </label>

      <Campo
        etiqueta="Stock actual"
        ayuda={controlaStock ? undefined : "Los productos pesables o sin control no descuentan stock."}
        errores={estado.errores?.stockactual}
      >
        {(control) => (
          <Input
            {...control}
            name="stockactual"
            type="number"
            inputMode="decimal"
            step="any"
            disabled={!controlaStock}
            defaultValue={valor("stockactual")}
            className="tabular-nums"
          />
        )}
      </Campo>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : etiquetaGuardar}
        </Button>
        <Button asChild variant="outline">
          <Link href="/productos">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
