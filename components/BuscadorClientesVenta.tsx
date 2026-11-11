"use client";

import { useEffect, useState } from "react";
import { buscarClientesParaVentaAction } from "@/app/(app)/ventas/buscarClientes";
import Campo from "@/components/Campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clienteParaVentaSchema, type ClienteSeleccionable } from "@/lib/schemas/cliente";

type Props = {
  cliente: ClienteSeleccionable | null;
  onSeleccionar: (cliente: ClienteSeleccionable | null) => void;
  error?: string;
};

export default function BuscadorClientesVenta({ cliente, onSeleccionar, error }: Props) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ClienteSeleccionable[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  useEffect(() => {
    const buscado = texto.trim();
    if (cliente || !buscado) return;
    let vigente = true;
    const espera = setTimeout(async () => {
      setCargando(true);
      setErrorBusqueda(null);
      try {
        const respuesta = await buscarClientesParaVentaAction(buscado);
        if (!vigente) return;
        if (!respuesta.ok) {
          setErrorBusqueda(respuesta.mensaje);
          return;
        }
        setResultados(clienteParaVentaSchema.array().parse(respuesta.clientes));
      } catch {
        if (vigente) setErrorBusqueda("No se pudo buscar clientes. Probá de nuevo.");
      } finally {
        if (vigente) setCargando(false);
      }
    }, 250);
    return () => { vigente = false; clearTimeout(espera); };
  }, [texto, cliente]);

  function cambiarTexto(valor: string) {
    setTexto(valor);
    if (cliente) onSeleccionar(null);
    setResultados(null);
    setErrorBusqueda(null);
    setCargando(false);
  }

  return (
    <div className="grid gap-2 self-start">
      <Campo etiqueta="Cliente" errores={error ? [error] : undefined}>
        {(control) => <Input {...control} type="search" autoComplete="off" value={cliente?.nombre ?? texto}
          onChange={(evento) => cambiarTexto(evento.target.value)} placeholder="Buscar por nombre o documento" />}
      </Campo>
      {cliente ? <Button type="button" variant="outline" size="sm" onClick={() => { onSeleccionar(null); setTexto(""); }}>
        Quitar cliente
      </Button> : null}
      <p role="status" className="text-sm text-muted-foreground">
        {cargando ? "Buscando clientes…" : !cliente && resultados?.length === 0 ? "No se encontraron clientes." : null}
      </p>
      {errorBusqueda ? <p role="alert" className="text-sm text-destructive">{errorBusqueda}</p> : null}
      {!cliente && resultados?.length ? (
        <ul aria-label="Resultados de clientes" className="max-h-48 divide-y overflow-y-auto rounded-md border">
          {resultados.map((resultado) => <li key={resultado.id}>
            <Button type="button" variant="ghost" className="h-auto w-full justify-start whitespace-normal text-left"
              onClick={() => { onSeleccionar(resultado); setResultados(null); setTexto(""); }}>
              {resultado.nombre}
            </Button>
          </li>)}
        </ul>
      ) : null}
    </div>
  );
}
