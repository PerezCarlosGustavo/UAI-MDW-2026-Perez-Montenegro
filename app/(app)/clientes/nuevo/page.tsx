import FormularioCliente from "@/components/FormularioCliente";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  await verificarPermiso("cliente", "crear");

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold">Nuevo cliente</h1>
      <FormularioCliente />
    </main>
  );
}
