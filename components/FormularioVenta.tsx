"use client";

// Client Component porque tiene estado (las líneas de la venta, si está
// guardando, el resultado) y eventos. Los productos y clientes NO los pide: se
// los pasa la página, que los leyó en el servidor desde lib/db (clase 8).
// Escribir sí va por la API (POST /api/ventas), donde están las reglas.

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import { formatearPesos } from "@/lib/utils";

export type ProductoDelCatalogo = { id: number; nombre: string; preciolista: number };
export type ClienteSeleccionable = { id: number; nombre: string };

type Linea = { productoid: string; cantidad: string };

type Resultado =
  | { tipo: "ok"; ventaId: number; advertencias: string[] }
  | { tipo: "error"; mensaje: string };

const lineaVacia: Linea = { productoid: "", cantidad: "1" };

type Props = {
  productos: ProductoDelCatalogo[];
  clientes: ClienteSeleccionable[];
};

export default function FormularioVenta({ productos, clientes }: Props) {
  const router = useRouter();
  const [clienteid, setClienteid] = useState("");
  const [tipopago, setTipopago] = useState("0");
  const [lineas, setLineas] = useState<Linea[]>([{ ...lineaVacia }]);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const precioPorId = useMemo(
    () => new Map(productos.map((producto) => [String(producto.id), producto.preciolista])),
    [productos]
  );

  // Solo para mostrar: el total que vale es el que calcula el servidor.
  const subtotal = (linea: Linea) =>
    (precioPorId.get(linea.productoid) ?? 0) * (Number(linea.cantidad) || 0);
  const total = lineas.reduce((suma, linea) => suma + subtotal(linea), 0);

  const cambiarLinea = (indice: number, cambios: Partial<Linea>) =>
    setLineas((actuales) => actuales.map((linea, i) => (i === indice ? { ...linea, ...cambios } : linea)));

  async function registrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setResultado(null);

    try {
      // Solo qué y cuánto: precios y total los calcula el servidor.
      const respuesta = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteid: clienteid ? Number(clienteid) : null,
          tipopago: Number(tipopago),
          detalles: lineas.map((linea) => ({
            productoid: Number(linea.productoid),
            cantidad: Number(linea.cantidad),
          })),
        }),
      });
      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        const mensaje = Array.isArray(datos?.detalles)
          ? datos.detalles.join(" ")
          : datos?.error ?? "No se pudo registrar la venta.";
        setResultado({ tipo: "error", mensaje });
        return;
      }

      setResultado({
        tipo: "ok",
        ventaId: datos.id,
        advertencias: Array.isArray(datos.advertencias) ? datos.advertencias : [],
      });
      setClienteid("");
      setTipopago("0");
      setLineas([{ ...lineaVacia }]);
      // Vuelve a pedirle la página al servidor: así "Ventas recientes" ya
      // incluye la que se acaba de registrar, sin un fetch de lectura acá.
      router.refresh();
    } catch {
      setResultado({ tipo: "error", mensaje: "No hubo respuesta del servidor. Probá de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={registrar} aria-labelledby="nueva-venta" className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="nueva-venta" className="text-lg font-semibold">Nueva venta</h2>
        <p className="text-sm text-muted-foreground">
          Total: <span className="text-xl font-semibold tabular-nums text-foreground">{formatearPesos(total)}</span>
        </p>
      </div>

      {resultado?.tipo === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo registrar la venta</AlertTitle>
          <AlertDescription>{resultado.mensaje}</AlertDescription>
        </Alert>
      ) : null}

      {resultado?.tipo === "ok" ? (
        <Alert>
          <AlertTitle>Venta registrada</AlertTitle>
          <AlertDescription>
            <Link href={`/ventas/${resultado.ventaId}`} className="font-medium text-primary underline-offset-4 hover:underline">
              Ver la venta #{resultado.ventaId}
            </Link>
            {/* Stock negativo: la venta se hizo igual (ADR 0004), pero se
                avisa para que el administrador ajuste el inventario. */}
            {resultado.advertencias.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-amber-700 dark:text-amber-400">
                {resultado.advertencias.map((advertencia) => (
                  <li key={advertencia}>{advertencia}</li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Cliente
          <SelectNativo value={clienteid} onChange={(e) => setClienteid(e.target.value)}>
            <option value="">Sin cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={String(cliente.id)}>
                {cliente.nombre}
              </option>
            ))}
          </SelectNativo>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Tipo de pago
          <SelectNativo value={tipopago} onChange={(e) => setTipopago(e.target.value)}>
            <option value="0">Contado</option>
            <option value="1">Cuenta corriente</option>
          </SelectNativo>
        </label>
      </div>

      <fieldset className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3 border-b pb-2">
          <legend className="font-semibold">Productos</legend>
          <Button type="button" variant="link" size="sm" onClick={() => setLineas((a) => [...a, { ...lineaVacia }])}>
            + Agregar producto
          </Button>
        </div>

        <ul className="grid gap-4">
          {lineas.map((linea, indice) => (
            <li
              key={indice}
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_auto] sm:items-end"
            >
              <label className="grid gap-1.5 text-sm font-medium">
                Producto
                <SelectNativo
                  required
                  value={linea.productoid}
                  onChange={(e) => cambiarLinea(indice, { productoid: e.target.value })}
                >
                  <option value="">Seleccionar</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={String(producto.id)}>
                      {producto.nombre} — {formatearPesos(producto.preciolista)}
                    </option>
                  ))}
                </SelectNativo>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Cantidad
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0.001"
                  step="any"
                  required
                  value={linea.cantidad}
                  onChange={(e) => cambiarLinea(indice, { cantidad: e.target.value })}
                  className="tabular-nums"
                />
              </label>
              <div className="grid gap-1.5 text-sm font-medium">
                <span>Subtotal</span>
                <span className="flex h-9 items-center tabular-nums text-muted-foreground">
                  {formatearPesos(subtotal(linea))}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={lineas.length === 1}
                onClick={() => setLineas((a) => a.filter((_, i) => i !== indice))}
                aria-label={`Quitar el producto ${indice + 1}`}
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-sm text-muted-foreground">
          Los precios salen del catálogo y los confirma el servidor al registrar.
        </p>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Registrando…" : "Registrar venta"}
        </Button>
      </div>
    </form>
  );
}
