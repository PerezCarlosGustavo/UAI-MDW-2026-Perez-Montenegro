"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import BotonAgregar from "@/components/BotonAgregar";
import Campo from "@/components/Campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearClienteSchema, clienteCreadoSchema } from "@/lib/schemas/cliente";
import { crearClienteAction } from "@/app/(app)/clientes/acciones";

type Props = { onCreado: (cliente: z.infer<typeof clienteCreadoSchema>) => void };

export default function AgregarCliente({ onCreado }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<z.inferFlattenedErrors<typeof crearClienteSchema>["fieldErrors"]>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function guardar(evento: FormEvent<HTMLFormElement>, cerrar: () => void) {
    evento.preventDefault();
    if (guardando) return;
    setError(null);
    setMensaje(null);
    const formulario = new FormData(evento.currentTarget);
    const resultado = crearClienteSchema.safeParse({
      nombre: formulario.get("nombre"),
      documento: formulario.get("documento") || null,
      telefono: formulario.get("telefono") || null,
    });
    if (!resultado.success) {
      setErrores(resultado.error.flatten().fieldErrors);
      return;
    }
    setErrores({});
    setGuardando(true);
    try {
      const respuesta = await crearClienteAction(resultado.data);
      if (!respuesta.ok) {
        setErrores(respuesta.errores ?? {});
        setError(respuesta.mensaje);
        return;
      }
      onCreado(respuesta.cliente);
      setMensaje("Cliente creado correctamente.");
      cerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mb-6 flex flex-col items-end">
      <BotonAgregar titulo="Agregar cliente" ocupado={guardando}>
        {(cerrar) => (
          <form
            onSubmit={(evento) => void guardar(evento, cerrar)}
            className="grid gap-4"
            noValidate
            aria-busy={guardando}
          >
            <Campo etiqueta="Nombre" errores={errores.nombre}>
              {(control) => <Input
                {...control}
                name="nombre"
                required
                autoComplete="name"
                disabled={guardando}
              />}
            </Campo>
            <Campo etiqueta="Documento (opcional)" errores={errores.documento}>
              {(control) => <Input {...control} name="documento" disabled={guardando} />}
            </Campo>
            <Campo etiqueta="Teléfono (opcional)" errores={errores.telefono}>
              {(control) => <Input
                {...control}
                name="telefono"
                type="tel"
                autoComplete="tel"
                disabled={guardando}
              />}
            </Campo>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button>
              <Button type="button" variant="outline" disabled={guardando} onClick={cerrar}>Cancelar</Button>
            </div>
          </form>
        )}
      </BotonAgregar>
      {mensaje ? <p role="status" className="mt-3 text-sm text-emerald-700">{mensaje}</p> : null}
    </div>
  );
}
