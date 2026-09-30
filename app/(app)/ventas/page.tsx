"use client";

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

const detalleBase: DetalleForm = {
  productoid: "",
  cantidad: "1",
  preciounitario: "0",
  subtotal: "0",
};

export default function VentasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
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
      const [productosRes, ventasRes] = await Promise.all([
        fetch("/api/productos"),
        fetch("/api/ventas"),
      ]);

      if (!productosRes.ok) {
        throw new Error("No se pudieron cargar los productos");
      }

      if (!ventasRes.ok) {
        throw new Error("No se pudieron cargar las ventas");
      }

      const productosData = (await productosRes.json()) as Producto[];
      const ventasData = (await ventasRes.json()) as Venta[];

      setProductos(productosData);
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

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Punto de venta</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Ventas</h1>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
          Total en esta venta: ${totalVenta.toFixed(2)}
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {mensaje ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {mensaje}
        </div>
      ) : null}

      {/* Stock negativo: la venta se hizo igual (ADR 0004), pero se avisa
          para que el administrador ajuste el inventario. */}
      {advertencias.length > 0 ? (
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Atención:</p>
          <ul className="mt-1 list-disc pl-5">
            {advertencias.map((advertencia) => (
              <li key={advertencia}>{advertencia}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        {/* text-slate-900 explícito: con el sistema en modo oscuro el texto
            heredado es claro y sobre el fondo blanco no se leía. */}
        <form onSubmit={enviarVenta} className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Cliente ID (opcional)
              <input
                value={form.clienteid}
                onChange={(event) => setForm((prev) => ({ ...prev, clienteid: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 transition focus:border-slate-500"
                placeholder="Ej: 12"
                type="number"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Tipo de pago
              <select
                value={form.tipopago}
                onChange={(event) => setForm((prev) => ({ ...prev, tipopago: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              >
                <option value="0">Contado</option>
                <option value="1">Cuenta corriente</option>
              </select>
            </label>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Productos</h2>
            <button
              type="button"
              onClick={agregarLinea}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              + Agregar línea
            </button>
          </div>

          <div className="space-y-4">
            {form.detalles.map((detalle, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.6fr_0.7fr_0.9fr_0.9fr_auto]">
                <label className="text-sm font-medium text-slate-700">
                  Producto
                  <select
                    value={detalle.productoid}
                    onChange={(event) => actualizarDetalle(index, "productoid", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
                  >
                    <option value="">Seleccionar</option>
                    {productos.map((producto) => (
                      <option key={String(producto.id)} value={String(producto.id)}>
                        {producto.nombre} — ${Number(producto.preciolista).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={detalle.cantidad}
                    onChange={(event) => actualizarDetalle(index, "cantidad", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Precio unit.
                  {/* Solo lectura: el servidor cobra el precio de lista del
                      catálogo, así que editarlo acá no tendría efecto. */}
                  <input
                    value={detalle.preciounitario}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Subtotal
                  <input
                    value={detalle.subtotal}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => eliminarLinea(index)}
                  className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  disabled={form.detalles.length === 1}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Total estimado: ${totalVenta.toFixed(2)}</span>
            <button
              type="submit"
              disabled={guardando || loading}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {guardando ? "Guardando..." : "Registrar venta"}
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Ventas recientes</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : ventas.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay ventas registradas.</p>
          ) : (
            <ul className="space-y-3">
              {ventas.slice(0, 8).map((venta) => (
                <li key={String(venta.id)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">#{venta.id}</span>
                    <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                      {Number(venta.tipopago) === 1 ? "Cuenta Corriente" : "Contado"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Cliente: {venta.cliente?.nombre ?? "Sin cliente"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Total: ${Number(venta.total ?? 0).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
    </main>
  );
}
