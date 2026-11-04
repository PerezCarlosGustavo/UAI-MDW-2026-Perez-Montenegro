"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Campo from "@/components/Campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearClienteSchema } from "@/lib/schemas/cliente";
import { crearClienteAction } from "@/app/(app)/clientes/acciones";


export default function FormularioCliente() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<z.inferFlattenedErrors<typeof crearClienteSchema>["fieldErrors"]>({});

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;
    setError(null);
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
      router.push("/clientes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
          <form
            onSubmit={(evento) => void guardar(evento)}
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
              <Button asChild variant="outline" disabled={guardando}>
                {guardando ? <span>Cancelar</span> : <Link href="/clientes">Cancelar</Link>}
              </Button>
            </div>
          </form>
  );
}
