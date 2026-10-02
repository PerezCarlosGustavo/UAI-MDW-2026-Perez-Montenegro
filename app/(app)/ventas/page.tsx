"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Producto = {
  id: string | number;
  nombre: string;
  preciolista: number;
  permitestock: boolean;
  stockactual: number;
  activo: boolean;
  codigobarra?: string | null;
};

type ClienteResumen = {
  id: string | number;
  nombre: string;
};

type DetalleForm = {
  productoid: string;
  cantidad: string;
  preciounitario: string;
  subtotal: string;
};

type Venta = {
  id: string | number;
  fecha?: string;
  total?: number | string;
  tipopago?: number;
  cliente?: { nombre?: string } | null;
  detalleventa?: Array<{
    productoid: string | number;
    cantidad: number | string;
    preciounitario: number | string;
    subtotal: number | string;
  }>;
};

const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const detalleBase: DetalleForm = {
  productoid: "",
  cantidad: "1",
  preciounitario: "0",
  subtotal: "0",
};

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [form, setForm] = useState({
    clienteid: "",
    tipopago: "0",
    detalles: [detalleBase],
  });

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const [productosRes, clientesRes, ventasRes] = await Promise.all([
        fetch("/api/productos"),
        fetch("/api/clientes"),
        fetch("/api/ventas"),
      ]);

      if (!productosRes.ok) {
        throw new Error("No se pudieron cargar los productos");
      }

      if (!clientesRes.ok) {
        throw new Error("No se pudieron cargar los clientes");
      }

      if (!ventasRes.ok) {
        throw new Error("No se pudieron cargar las ventas");
      }

      const productosData = (await productosRes.json()) as Producto[];
      const clientesData = (await clientesRes.json()) as ClienteResumen[];
      const ventasData = (await ventasRes.json()) as Venta[];

      setProductos(productosData);
      setClientes(clientesData);
      setVentas(ventasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const totalVenta = useMemo(() => {
    return form.detalles.reduce((total, detalle) => {
      const numero = Number(detalle.subtotal || 0);
      return total + (Number.isFinite(numero) ? numero : 0);
    }, 0);
  }, [form.detalles]);

  const actualizarDetalle = (index: number, campo: keyof DetalleForm, valor: string) => {
    setForm((prev) => {
      const detalles = [...prev.detalles];
      const item = detalles[index];

      if (!item) {
        return prev;
      }

      detalles[index] = { ...item, [campo]: valor };

      if (campo === "productoid") {
        const productoSeleccionado = productos.find((producto) => String(producto.id) === String(valor));
        if (productoSeleccionado) {
          const cantidad = Number(detalles[index]?.cantidad || 0);
          const precio = Number(productoSeleccionado.preciolista);
          detalles[index] = {
            ...detalles[index],
            productoid: String(valor),
            preciounitario: String(precio),
            subtotal: String(precio * cantidad),
          };
        }
      }

      if (campo === "cantidad" || campo === "preciounitario") {
        const cantidad = Number(detalles[index]?.cantidad || 0);
        const precio = Number(detalles[index]?.preciounitario || 0);
        detalles[index] = {
          ...detalles[index],
          subtotal: String(cantidad * precio),
        };
      }

      return { ...prev, detalles };
    });
  };

  const agregarLinea = () => {
    setForm((prev) => ({ ...prev, detalles: [...prev.detalles, { ...detalleBase }] }));
  };

  const eliminarLinea = (index: number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, indice) => indice !== index),
    }));
  };

  const enviarVenta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);
    setAdvertencias([]);

    try {
      // Solo qué y cuánto: precios y total los calcula el servidor.
      const payload = {
        clienteid: form.clienteid ? Number(form.clienteid) : null,
        tipopago: Number(form.tipopago || 0),
        detalles: form.detalles.map((detalle) => ({
          productoid: Number(detalle.productoid),
          cantidad: Number(detalle.cantidad),
        })),
      };

      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result?.detalles)
            ? result.detalles.join(" ")
            : result?.error || "No se pudo registrar la venta"
        );
      }

      setMensaje(`Venta registrada correctamente con ID ${result.id ?? "n/d"}.`);
      setAdvertencias(Array.isArray(result.advertencias) ? result.advertencias : []);
      setForm({
        clienteid: "",
        tipopago: "0",
        detalles: [{ ...detalleBase }],
      });
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la venta");
    } finally {
      setGuardando(false);
    }
  };

  const claseCampo =
    "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const claseCampoSoloLectura =
    "mt-1.5 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm tabular-nums text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300";
  const claseEtiqueta = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300">← Inicio</Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Punto de venta</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">Ventas</h1>
        </div>
        <div className="min-w-44 border-l-4 border-emerald-600 pl-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total de esta venta</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{moneda.format(totalVenta)}</p>
        </div>
      </header>

      {error ? (
        <div role="alert" className="mb-5 border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      {mensaje ? (
        <div role="status" className="mb-5 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
          {mensaje}
        </div>
      ) : null}

      {/* Stock negativo: la venta se hizo igual (ADR 0004), pero se avisa
          para que el administrador ajuste el inventario. */}
      {advertencias.length > 0 ? (
        <div role="status" className="mb-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-semibold">Atención</p>
          <ul className="mt-1 list-disc pl-5">
            {advertencias.map((advertencia) => (
              <li key={advertencia}>{advertencia}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
        <form onSubmit={enviarVenta} aria-labelledby="nueva-venta">
          <h2 id="nueva-venta" className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nueva venta</h2>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <label className={claseEtiqueta}>
              Cliente
              <select
                value={form.clienteid}
                onChange={(event) => setForm((prev) => ({ ...prev, clienteid: event.target.value }))}
                className={claseCampo}
              >
                <option value="">Sin cliente</option>
                {clientes.map((cliente) => (
                  <option key={String(cliente.id)} value={String(cliente.id)}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className={claseEtiqueta}>
              Tipo de pago
              <select
                value={form.tipopago}
                onChange={(event) => setForm((prev) => ({ ...prev, tipopago: event.target.value }))}
                className={claseCampo}
              >
                <option value="0">Contado</option>
                <option value="1">Cuenta corriente</option>
              </select>
            </label>
          </div>

          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Productos</h3>
            <button
              type="button"
              onClick={agregarLinea}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              + Agregar producto
            </button>
          </div>

          <ul>
            {form.detalles.map((detalle, index) => (
              <li
                key={index}
                className="grid gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1.8fr)_6rem_8rem_8rem_auto] sm:items-end"
              >
                <label className={claseEtiqueta}>
                  Producto
                  <select
                    value={detalle.productoid}
                    onChange={(event) => actualizarDetalle(index, "productoid", event.target.value)}
                    className={claseCampo}
                  >
                    <option value="">Seleccionar</option>
                    {productos.map((producto) => (
                      <option key={String(producto.id)} value={String(producto.id)}>
                        {producto.nombre} — {moneda.format(Number(producto.preciolista))}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={claseEtiqueta}>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={detalle.cantidad}
                    onChange={(event) => actualizarDetalle(index, "cantidad", event.target.value)}
                    className={`${claseCampo} tabular-nums`}
                  />
                </label>

                <label className={claseEtiqueta}>
                  Precio unit.
                  {/* Solo lectura: el servidor cobra el precio de lista del
                      catálogo, así que editarlo acá no tendría efecto. */}
                  <input value={moneda.format(Number(detalle.preciounitario || 0))} readOnly className={claseCampoSoloLectura} />
                </label>

                <label className={claseEtiqueta}>
                  Subtotal
                  <input value={moneda.format(Number(detalle.subtotal || 0))} readOnly className={claseCampoSoloLectura} />
                </label>

                <button
                  type="button"
                  onClick={() => eliminarLinea(index)}
                  disabled={form.detalles.length === 1}
                  className="rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-700 hover:border-rose-400 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:text-rose-300"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Los precios salen del catálogo y los confirma el servidor al registrar.
            </p>
            <button
              type="submit"
              disabled={guardando || loading}
              className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {guardando ? "Registrando…" : "Registrar venta"}
            </button>
          </div>
        </form>

        <aside aria-labelledby="ventas-recientes" className="min-w-0 border-t border-slate-200 pt-6 dark:border-slate-800 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="ventas-recientes" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ventas recientes</h2>
            <span className="text-xs text-slate-500">{ventas.length} ventas</span>
          </div>

          {loading ? (
            <p className="py-6 text-sm text-slate-500">Cargando ventas…</p>
          ) : ventas.length === 0 ? (
            <p className="border-y border-slate-200 py-5 text-sm text-slate-500 dark:border-slate-800">Todavía no hay ventas registradas.</p>
          ) : (
            <ul className="border-y border-slate-200 dark:border-slate-800">
              {ventas.slice(0, 8).map((venta) => (
                <li key={String(venta.id)} className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Venta #{venta.id}</span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {moneda.format(Number(venta.total ?? 0))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{venta.cliente?.nombre ?? "Sin cliente"}</span>
                    <span className={Number(venta.tipopago) === 1 ? "font-medium text-amber-700 dark:text-amber-400" : ""}>
                      {Number(venta.tipopago) === 1 ? "Cuenta corriente" : "Contado"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
