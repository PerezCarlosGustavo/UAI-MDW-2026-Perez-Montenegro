"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Cliente = { id: number | string; nombre: string };
type Pendiente = {
  movimientoid: number;
  ventaid: number;
  productoid: number;
  nombre: string;
  cantidad: number;
  fecha: string;
  precioUnitario: number;
  subtotalActual: number;
};
type EstadoCuenta = {
  pendientes: Pendiente[];
  totalPendientes: number;
  totalDeuda: number;
  saldoAFavor: number;
  pagina: number;
  totalPaginas: number;
};
type ResultadoCobranza = {
  pagados: Array<{ nombre: string; cantidad: number; importe: number }>;
  saldoAFavorUsado: number;
  saldoAFavorGenerado: number;
  saldoAFavor: number;
};

const moneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

function textoError(datos: { error?: string; detalles?: string[] }, fallback: string) {
  return Array.isArray(datos.detalles) ? datos.detalles.join(" ") : datos.error || fallback;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
  const [pagina, setPagina] = useState(1);
  const [monto, setMonto] = useState("");
  const [resultado, setResultado] = useState<ResultadoCobranza | null>(null);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [cargandoCuenta, setCargandoCuenta] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function cargarClientes() {
      setCargandoClientes(true);
      try {
        const response = await fetch("/api/clientes?incluirInactivos=true", { signal: controller.signal });
        const datos = await response.json();
        if (!response.ok) throw new Error(textoError(datos, "No se pudieron cargar los clientes."));
        const lista = datos as Cliente[];
        setClientes(lista);
        setClienteId((actual) => lista.some((cliente) => String(cliente.id) === actual)
          ? actual
          : String(lista[0]?.id ?? ""));
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Error al cargar clientes.");
      } finally {
        if (!controller.signal.aborted) setCargandoClientes(false);
      }
    }
    void cargarClientes();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!clienteId) {
      setEstado(null);
      return;
    }
    const controller = new AbortController();
    async function cargarCuenta() {
      setCargandoCuenta(true);
      setError(null);
      try {
        const response = await fetch(`/api/cuentacorriente/${clienteId}?pagina=${pagina}`, {
          signal: controller.signal,
        });
        const datos = await response.json();
        if (!response.ok) throw new Error(textoError(datos, "No se pudo cargar la cuenta corriente."));
        setEstado(datos as EstadoCuenta);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Error al cargar la cuenta.");
      } finally {
        if (!controller.signal.aborted) setCargandoCuenta(false);
      }
    }
    void cargarCuenta();
    return () => controller.abort();
  }, [clienteId, pagina, refresh]);

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nombre.toLocaleLowerCase("es-AR").includes(busqueda.trim().toLocaleLowerCase("es-AR"))
  );
  const clienteSeleccionado = clientes.find((cliente) => String(cliente.id) === clienteId);

  async function registrarCobro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clienteId) return;
    setCobrando(true);
    setError(null);
    setMensaje(null);
    setResultado(null);
    try {
      const response = await fetch("/api/cobranza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteid: Number(clienteId), monto: Number(monto) }),
      });
      const datos = await response.json();
      if (!response.ok) throw new Error(textoError(datos, "No se pudo registrar el cobro."));
      setResultado(datos as ResultadoCobranza);
      setMensaje("Cobro registrado correctamente.");
      setMonto("");
      setPagina(1);
      setRefresh((actual) => actual + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el cobro.");
    } finally {
      setCobrando(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300">← Inicio</Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Gestión de cuentas</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">Clientes</h1>
        </div>
        <span className="text-sm text-slate-500">{clientes.length} clientes</span>
      </header>

      {error ? <div role="alert" className="mb-5 border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">{error}</div> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.6fr)]">
        <section aria-labelledby="clientes-listado">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="clientes-listado" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Listado</h2>
            <span className="text-xs text-slate-500">{clientesFiltrados.length} resultados</span>
          </div>
          <label htmlFor="buscar-cliente" className="sr-only">Buscar cliente</label>
          <input
            id="buscar-cliente"
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre"
            className="mb-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="max-h-[70vh] overflow-y-auto border-y border-slate-200 dark:border-slate-800">
            {cargandoClientes ? <p className="py-6 text-sm text-slate-500">Cargando clientes…</p> : clientesFiltrados.length === 0 ? <p className="py-6 text-sm text-slate-500">No hay clientes para mostrar.</p> : (
              <ul>
                {clientesFiltrados.map((cliente) => {
                  const seleccionado = String(cliente.id) === clienteId;
                  return (
                    <li key={String(cliente.id)} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <button
                        type="button"
                        aria-current={seleccionado ? "true" : undefined}
                        onClick={() => {
                          setClienteId(String(cliente.id));
                          setPagina(1);
                          setMensaje(null);
                          setResultado(null);
                        }}
                        className={`flex w-full items-center justify-between gap-3 border-l-4 px-3 py-3 text-left ${seleccionado ? "border-emerald-700 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100" : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900"}`}
                      >
                        <span className="min-w-0 truncate text-sm font-medium">{cliente.nombre}</span>
                        <span className="shrink-0 text-xs text-slate-500">{seleccionado ? "Seleccionado" : "Ver cuenta"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="cuenta-cliente" className="min-w-0 border-t border-slate-200 pt-6 dark:border-slate-800 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {clienteSeleccionado ? <>
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Cuenta corriente</p>
                <h2 id="cuenta-cliente" className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{clienteSeleccionado.nombre}</h2>
              </div>
              <div className="min-w-44 border-l-4 border-amber-500 pl-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Deuda actual</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{cargandoCuenta ? "…" : moneda.format(estado?.totalDeuda ?? 0)}</p>
              </div>
            </header>

            <div className="mb-6 grid gap-4 border-y border-slate-200 py-4 sm:grid-cols-2 dark:border-slate-800">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Saldo a favor</p>
                <p className="mt-1 text-lg font-medium tabular-nums text-emerald-700 dark:text-emerald-400">{cargandoCuenta ? "…" : moneda.format(estado?.saldoAFavor ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Productos pendientes</p>
                <p className="mt-1 text-lg font-medium tabular-nums text-slate-900 dark:text-slate-100">{cargandoCuenta ? "…" : estado?.totalPendientes ?? 0}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Deuda pendiente · FIFO</h3>
                {estado && estado.totalPaginas > 0 ? <span className="text-xs text-slate-500">Página {estado.pagina} de {estado.totalPaginas}</span> : null}
              </div>
              {cargandoCuenta ? <p className="py-4 text-sm text-slate-500">Actualizando cuenta…</p> : estado?.pendientes.length ? <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                      <tr><th className="py-2 pr-3 font-medium">Producto</th><th className="px-3 py-2 text-right font-medium">Cant.</th><th className="px-3 py-2 text-right font-medium">Precio actual</th><th className="py-2 pl-3 text-right font-medium">Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {estado.pendientes.map((pendiente) => <tr key={pendiente.movimientoid} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="py-3 pr-3"><span className="block font-medium text-slate-900 dark:text-slate-100">{pendiente.nombre}</span><span className="text-xs text-slate-500">Venta {pendiente.ventaid} · {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(pendiente.fecha))}</span></td>
                        <td className="px-3 py-3 text-right tabular-nums">{pendiente.cantidad}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{moneda.format(pendiente.precioUnitario)}</td>
                        <td className="py-3 pl-3 text-right font-medium tabular-nums">{moneda.format(pendiente.subtotalActual)}</td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
                {estado.totalPaginas > 1 ? <div className="mt-3 flex justify-end gap-2">
                  <button type="button" disabled={pagina <= 1} onClick={() => setPagina((actual) => Math.max(1, actual - 1))} className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700">Anterior</button>
                  <button type="button" disabled={pagina >= estado.totalPaginas} onClick={() => setPagina((actual) => Math.min(estado.totalPaginas, actual + 1))} className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-700">Siguiente</button>
                </div> : null}
              </> : <p className="border-y border-slate-200 py-5 text-sm text-slate-500 dark:border-slate-800">Este cliente no tiene productos pendientes.</p>}
            </div>

            <form onSubmit={registrarCobro} className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Registrar cobro</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Se aplica FIFO sin fraccionar. Si el monto no completa el próximo producto, queda como saldo a favor.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="monto-cobro" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Monto recibido</label>
                  <div className="flex rounded-md border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900">
                    <span className="border-r border-slate-200 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700">$</span>
                    <input id="monto-cobro" type="number" inputMode="decimal" min="0.01" step="0.01" required value={monto} onChange={(event) => setMonto(event.target.value)} placeholder="0,00" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={cobrando || cargandoCuenta || !monto || Number(monto) <= 0} className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500">{cobrando ? "Registrando…" : "Registrar cobro"}</button>
              </div>
            </form>

            {mensaje ? <div role="status" className="mt-4 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
              <p className="font-semibold">{mensaje}</p>
              {resultado ? <p className="mt-1">{resultado.pagados.length} producto(s) liquidados. Saldo a favor: {moneda.format(resultado.saldoAFavor)}.</p> : null}
            </div> : null}
          </> : <div className="flex min-h-64 items-center justify-center border-y border-dashed border-slate-300 text-center dark:border-slate-700"><p className="max-w-sm px-6 text-sm text-slate-500">{cargandoClientes ? "Cargando clientes…" : "Seleccioná un cliente para consultar su deuda y registrar un cobro."}</p></div>}
        </section>
      </div>
    </main>
  );
}