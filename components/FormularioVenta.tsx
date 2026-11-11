"use client";

// Client Component porque tiene estado (las líneas de la venta, si está
// guardando, el resultado) y eventos. Las búsquedas se hacen bajo demanda;
// la venta se registra mediante una Server Action.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BuscadorProductos from "@/components/BuscadorProductos";
import DescargarComprobante from "@/components/DescargarComprobante";
import Campo from "@/components/Campo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/ui/select-nativo";
import type { ProductoBuscado } from "@/lib/schemas/producto";
import type { ClienteSeleccionable } from "@/lib/schemas/cliente";
import { formatearPesos } from "@/lib/utils";
import { registrarVentaAction } from "@/app/(app)/ventas/acciones";
import BuscadorClientesVenta from "./BuscadorClientesVenta";

type Linea = { productoid: number; nombre: string; preciolista: number; cantidad: string };

type Resultado =
  | { tipo: "ok"; ventaId: number; advertencias: string[] }
  | { tipo: "error"; mensaje: string };

export default function FormularioVenta() {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteSeleccionable | null>(null);
  const [tipopago, setTipopago] = useState("0");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Solo para mostrar: el total que vale es el que calcula el servidor.
  const subtotal = (linea: Linea) => linea.preciolista * (Number(linea.cantidad) || 0);
  const total = lineas.reduce((suma, linea) => suma + subtotal(linea), 0);

  // H4: se avisa antes de enviar. Es cortesía: la regla la sigue haciendo
  // cumplir el servidor, que además rechaza a Consumidor Final.
  const faltaCliente = tipopago === "1" && (!cliente || cliente.esConsumidorFinal);

  // Escanear dos veces el mismo producto suma uno, no agrega otra línea.
  function agregarProducto(producto: ProductoBuscado) {
    setResultado(null);
    setLineas((actuales) => {
      const yaEsta = actuales.some((linea) => linea.productoid === producto.id);
      if (yaEsta) {
        return actuales.map((linea) =>
          linea.productoid === producto.id ? { ...linea, cantidad: String((Number(linea.cantidad) || 0) + 1) } : linea
        );
      }
      return [
        ...actuales,
        {
          productoid: producto.id,
          nombre: producto.nombre,
          preciolista: producto.preciolista,
          cantidad: "1"
        },
      ];
    });
  }

  const cambiarCantidad = (productoid: number, cantidad: string) =>
    setLineas((actuales) =>
      actuales.map((linea) => (linea.productoid === productoid ? { ...linea, cantidad } : linea))
    );

  async function registrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true);
    setResultado(null);

    try {
      // Solo qué y cuánto: precios y total los calcula el servidor.
      const respuesta = await registrarVentaAction({
        clienteid: cliente?.id ?? null,
        tipopago: Number(tipopago),
        detalles: lineas.map((linea) => ({
          productoid: linea.productoid,
          cantidad: Number(linea.cantidad),
        })),
      });

      if (!respuesta.ok) {
        setResultado({ tipo: "error", mensaje: respuesta.mensaje });
        return;
      }

      setResultado({
        tipo: "ok",
        ventaId: respuesta.ventaId,
        advertencias: respuesta.advertencias,
      });
      setCliente(null);
      setTipopago("0");
      setLineas([]);
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
            <Link
              href={`/ventas/${resultado.ventaId}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver la venta #{resultado.ventaId}
            </Link>
            {" · "}
            <DescargarComprobante url={`/api/ventas/${resultado.ventaId}/comprobante`} nombre={`ticket-venta-${resultado.ventaId}.pdf`} />
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
        <BuscadorClientesVenta cliente={cliente} onSeleccionar={setCliente}
          error={faltaCliente ? "Para vender en cuenta corriente elegí un cliente distinto de Consumidor Final." : undefined} />
        <label className="grid gap-1.5 self-start text-sm font-medium">
          Tipo de pago
          <SelectNativo value={tipopago} onChange={(e) => setTipopago(e.target.value)}>
            <option value="0">Contado</option>
            <option value="1">Cuenta corriente</option>
          </SelectNativo>
        </label>
      </div>

      {faltaCliente ? (
        <p className="text-sm text-muted-foreground">
          ¿No está en la lista?{" "}
          <Link href="/clientes/nuevo" className="font-medium text-primary underline-offset-4 hover:underline">
            Crear un cliente
          </Link>
        </p>
      ) : null}

      <BuscadorProductos onElegir={agregarProducto} />

      <fieldset className="grid gap-3">
        <legend className="w-full border-b pb-2 font-semibold">Productos</legend>

        {lineas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no agregaste productos.</p>
        ) : (
          <ul className="grid gap-4">
            {lineas.map((linea) => (
              <li
                key={linea.productoid}
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_auto] sm:items-end"
              >
                <div className="min-w-0 text-sm">
                  <span className="block font-medium break-words">{linea.nombre}</span>
                  <span className="text-muted-foreground tabular-nums">{formatearPesos(linea.preciolista)}</span>
                </div>
                <label className="grid gap-1.5 text-sm font-medium">
                  Cantidad
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0.001"
                    step="any"
                    required
                    value={linea.cantidad}
                    onChange={(e) => cambiarCantidad(linea.productoid, e.target.value)}
                    aria-label={`Cantidad de ${linea.nombre}`}
                    aria-invalid={Number(linea.cantidad) > 0 ? undefined : true}
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
                  onClick={() => setLineas((a) => a.filter((l) => l.productoid !== linea.productoid))}
                  aria-label={`Quitar ${linea.nombre}`}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-sm text-muted-foreground">
          Los precios salen del catálogo y los confirma el servidor al registrar.
        </p>
        <Button type="submit" disabled={guardando || lineas.length === 0 || faltaCliente}>
          {guardando ? "Registrando…" : "Registrar venta"}
        </Button>
      </div>
    </form>
  );
}
