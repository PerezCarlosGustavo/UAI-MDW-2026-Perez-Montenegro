"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearCobranzaSchema } from "@/lib/schemas/cuentacorriente";
import { errorClienteSchema } from "@/lib/schemas/cliente";

export default function FormularioCobro({ clienteid }: { clienteid: number }) {
  const router = useRouter();
  const enviando = useRef(false);
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cobrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
    const formulario = evento.currentTarget;
    const datos = crearCobranzaSchema.safeParse({ clienteid, monto: new FormData(formulario).get("monto") });
    setMensaje(null);
    setError(null);
    if (!datos.success) {
      setError(datos.error.issues.map((issue) => issue.message).join(" "));
      return;
    }
    enviando.current = true;
    setPendiente(true);
    try {
      const respuesta = await fetch("/api/cobranza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos.data),
      });
      if (!respuesta.ok) {
        const fallo = errorClienteSchema.safeParse(await respuesta.json());
        throw new Error(fallo.success ? fallo.data.detalles?.join(" ") || fallo.data.error : "No se pudo registrar el cobro.");
      }
      formulario.reset();
      setMensaje("Cobro registrado correctamente.");
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo registrar el cobro.");
    } finally {
      enviando.current = false;
      setPendiente(false);
    }
  }

  return (
    <form onSubmit={cobrar} className="space-y-4 border-t pt-5" aria-busy={pendiente}>
      <h2 className="text-lg font-semibold">Registrar cobro</h2>
      <p className="text-sm text-muted-foreground">Se aplica FIFO sin fraccionar. El sobrante queda como saldo a favor.</p>
      <label htmlFor="monto-cobro" className="block text-sm font-medium">Monto recibido</label>
      <Input id="monto-cobro" name="monto" type="number" min="0.01" step="0.01" required disabled={pendiente} aria-describedby={error ? "error-cobro" : undefined} />
      {error ? <p id="error-cobro" role="alert" className="text-sm text-destructive">{error}</p> : null}
      {mensaje ? <p role="status" className="text-sm">{mensaje}</p> : null}
      <Button type="submit" disabled={pendiente}>{pendiente ? "Registrando…" : "Registrar cobro"}</Button>
    </form>
  );
}
