"use client";

// Client Component porque busca mientras se escribe. El catálogo tiene miles de
// productos: no se puede mandar entero a la pantalla, así que se le pregunta a
// la API (acá sí corresponde, el navegador no llega a lib/db).
//
// El lector de códigos es un teclado que escribe rápido y termina con Enter. Por
// eso Enter agrega directo si hay un código exacto o un único resultado.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productoBuscadoSchema, type ProductoBuscado } from "@/lib/schemas/producto";
import { formatearPesos } from "@/lib/utils";

const ESPERA_AL_ESCRIBIR_MS = 250;

async function pedirProductos(texto: string, signal: AbortSignal) {
  const respuesta = await fetch(`/api/productos?q=${encodeURIComponent(texto)}`, { signal });
  if (!respuesta.ok) throw new Error("La búsqueda falló");
  return productoBuscadoSchema.array().parse(await respuesta.json());
}

type Props = { onElegir: (producto: ProductoBuscado) => void };

export default function BuscadorProductos({ onElegir }: Props) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ProductoBuscado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const pedidoEnCurso = useRef<AbortController | null>(null);

  // Cada pedido cancela el anterior: una respuesta vieja no puede pisar a una
  // búsqueda más nueva.
  function nuevoPedido() {
    pedidoEnCurso.current?.abort();
    pedidoEnCurso.current = new AbortController();
    return pedidoEnCurso.current.signal;
  }

  function limpiar() {
    pedidoEnCurso.current?.abort();
    setTexto("");
    setResultados(null);
    setError(null);
  }

  function elegir(producto: ProductoBuscado) {
    onElegir(producto);
    limpiar();
    // El foco vuelve acá para poder escanear el siguiente sin tocar el mouse.
    entrada.current?.focus();
  }

  useEffect(() => {
    const buscado = texto.trim();
    if (!buscado) return;

    const espera = setTimeout(async () => {
      const signal = nuevoPedido();
      try {
        const encontrados = await pedirProductos(buscado, signal);
        setResultados(encontrados);
        setError(null);
      } catch {
        if (!signal.aborted) setError("No se pudo buscar. Probá de nuevo.");
      }
    }, ESPERA_AL_ESCRIBIR_MS);

    return () => clearTimeout(espera);
  }, [texto]);

  async function alApretarEnter(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    // Enter acá busca: no tiene que registrar la venta.
    evento.preventDefault();

    const buscado = texto.trim();
    if (!buscado) return;

    const signal = nuevoPedido();
    try {
      const encontrados = await pedirProductos(buscado, signal);
      const exacto = encontrados.find((producto) => producto.codigobarra === buscado);
      const unico = encontrados.length === 1 ? encontrados[0] : undefined;
      const elegido = exacto ?? unico;

      if (elegido) {
        elegir(elegido);
        return;
      }
      setResultados(encontrados);
      setError(null);
    } catch {
      if (!signal.aborted) setError("No se pudo buscar. Probá de nuevo.");
    }
  }

  return (
    <div className="grid gap-2">
      <label htmlFor="buscar-para-vender" className="text-sm font-medium">
        Escanear o buscar producto
      </label>
      <Input
        id="buscar-para-vender"
        ref={entrada}
        type="search"
        autoComplete="off"
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value);
          if (!evento.target.value.trim()) setResultados(null);
        }}
        onKeyDown={alApretarEnter}
        placeholder="Código de barras o nombre"
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* aria-live: quien usa lector de pantalla se entera sin mover el foco. */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {resultados?.length === 0 ? `No hay productos que coincidan con “${texto.trim()}”.` : null}
      </p>

      {resultados?.length ? (
        <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
          {resultados.map((producto) => (
            <li key={producto.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => elegir(producto)}
                className="h-auto w-full justify-between gap-3 whitespace-normal rounded-none py-2 text-left"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{producto.nombre}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {producto.codigobarra ?? "Sin código"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatearPesos(producto.preciolista)}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
