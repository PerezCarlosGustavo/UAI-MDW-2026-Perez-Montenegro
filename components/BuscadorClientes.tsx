"use client";

import Link from "next/link";
import { useState } from "react";
import SinDatos from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { clientes: { id: string; nombre: string }[] };

export default function BuscadorClientes({ clientes }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const filtrados = clientes.filter((cliente) =>
    cliente.nombre.toLocaleLowerCase("es-AR").includes(busqueda.trim().toLocaleLowerCase("es-AR"))
  );
  return (
    <section aria-label="Listado de clientes" className="space-y-4">
      <label htmlFor="buscar-cliente" className="sr-only">Buscar cliente</label>
      <Input id="buscar-cliente" type="search" value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar por nombre" />
      <p className="text-sm text-muted-foreground">{filtrados.length} resultados</p>
      {filtrados.length === 0 ? (
        <SinDatos titulo="La búsqueda no coincide" descripcion="Probá con otro nombre." />
      ) : (
        <ul className="divide-y rounded-md border">
          {filtrados.map((cliente) => (
            <li key={cliente.id} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0 break-words font-medium">{cliente.nombre}</span>
              <div className="ml-auto flex shrink-0 gap-2" role="group" aria-label={"Acciones de " + cliente.nombre}>
                <Button variant="outline" size="icon" disabled title="Editar (próximamente)" aria-label="Editar">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16 3 5 5M4 20l4-1L21 6a2 2 0 0 0-5-5L3 14l-1 7Z" /></svg>
                </Button>
                <Button variant="outline" size="icon" disabled title="Eliminar (próximamente)" aria-label="Eliminar">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg>
                </Button>
                <Button asChild size="icon" variant="secondary" title="Mostrar deuda">
                  <Link href={"/clientes/" + cliente.id} aria-label={"Mostrar deuda de " + cliente.nombre}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
