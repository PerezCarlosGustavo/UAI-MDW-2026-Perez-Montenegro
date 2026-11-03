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

async function pedirProductos(texto: string, signal?: AbortSignal) {
  const respuesta = await fetch(`/api/productos?q=${encodeURIComponent(texto)}`, { signal });
  if (!respuesta.ok) throw new Error("La búsqueda falló");
  return productoBuscadoSchema.array().parse(await respuesta.json());
}

type Props = { onElegir: (producto: ProductoBuscado) => void };

export default function BuscadorProductos({ onElegir }: Props) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ProductoBuscado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Un contador y no un booleano: puede haber varios pedidos a la vez.
  const [pedidosEnCurso, setPedidosEnCurso] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const esperaAlEscribir = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busquedaAlEscribir = useRef<AbortController | null>(null);

  function cancelarBusquedaAlEscribir() {
    if (esperaAlEscribir.current) clearTimeout(esperaAlEscribir.current);
    busquedaAlEscribir.current?.abort();
  }

  function elegirDeLaLista(producto: ProductoBuscado) {
    onElegir(producto);
    cancelarBusquedaAlEscribir();
    setTexto("");
    setResultados(null);
    setError(null);
    // El foco vuelve acá para poder escanear el siguiente sin tocar el mouse.
    entrada.current?.focus();
  }

  // Mientras se escribe: cada búsqueda cancela la anterior, para que una
  // respuesta vieja no pise a una más nueva.
  useEffect(() => {
    const buscado = texto.trim();
    if (!buscado) return;

    esperaAlEscribir.current = setTimeout(async () => {
      busquedaAlEscribir.current?.abort();
      const controlador = new AbortController();
      busquedaAlEscribir.current = controlador;

      setPedidosEnCurso((actual) => actual + 1);
      try {
        const encontrados = await pedirProductos(buscado, controlador.signal);
        setResultados(encontrados);
        setError(null);
      } catch {
        if (!controlador.signal.aborted) setError("No se pudo buscar. Probá de nuevo.");
      } finally {
        setPedidosEnCurso((actual) => actual - 1);
      }
    }, ESPERA_AL_ESCRIBIR_MS);

    return () => {
      if (esperaAlEscribir.current) clearTimeout(esperaAlEscribir.current);
    };
  }, [texto]);

  async function alApretarEnter(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    // Enter acá busca: no tiene que registrar la venta.
    evento.preventDefault();

    const buscado = texto.trim();
    if (!buscado) return;

    // La búsqueda al escribir ya no hace falta, y cancelaría a esta si arranca
    // después. El campo se vacía enseguida porque el lector puede mandar el
    // próximo código antes de que vuelva la respuesta; por eso este pedido
    // tampoco se cancela con el siguiente.
    cancelarBusquedaAlEscribir();
    setTexto("");
    setResultados(null);
    setError(null);

    setPedidosEnCurso((actual) => actual + 1);
    try {
      const encontrados = await pedirProductos(buscado);
      const exacto = encontrados.find((producto) => producto.codigobarra === buscado);
      const unico = encontrados.length === 1 ? encontrados[0] : undefined;
      const elegido = exacto ?? unico;

      if (elegido) {
        onElegir(elegido);
        return;
      }
      // No se pudo decidir solo: vuelve lo buscado, salvo que ya esté escribiendo otra cosa.
      setTexto((actual) => actual || buscado);
      setResultados(encontrados);
    } catch {
      setTexto((actual) => actual || buscado);
      setError("No se pudo buscar. Probá de nuevo.");
    } finally {
      setPedidosEnCurso((actual) => actual - 1);
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
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {pedidosEnCurso > 0
          ? "Buscando…"
          : resultados?.length === 0
            ? `No hay productos que coincidan con “${texto.trim()}”.`
            : null}
      </p>

      {resultados?.length ? (
        <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
          {resultados.map((producto) => (
            <li key={producto.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => elegirDeLaLista(producto)}
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
