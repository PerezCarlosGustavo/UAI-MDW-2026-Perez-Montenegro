import BotonAgregar from "@/components/BotonAgregar";
import BuscadorClientes from "@/components/BuscadorClientes";
import SinDatos from "@/components/SinDatos";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { listarClientes } from "@/lib/db/clientes";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  await verificarPermiso("cliente", "ver");
  const clientes = await listarClientes({ incluirInactivos: true });
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-semibold">Clientes</h1>
      <div className="flex justify-end">
        <BotonAgregar href="/clientes/nuevo" titulo="Agregar cliente" />
      </div>
      {clientes.length === 0 ? (
        <SinDatos titulo="No hay clientes" descripcion="Agregá un cliente para comenzar." />
      ) : (
        <BuscadorClientes clientes={clientes.map((cliente) => ({ id: String(cliente.id), nombre: cliente.nombre }))} />
      )}
    </main>
  );
}
