import { notFound } from "next/navigation";
import FormularioProducto from "@/components/FormularioProducto";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { listarCategorias } from "@/lib/db/categorias";
import { crearProductoAction } from "../acciones";

export const dynamic = "force-dynamic";

// La página prepara, el formulario muestra, la acción decide (clase 12).
export default async function NuevoProductoPage() {
  const usuario = await requerirUsuario();

  if (!PERMISOS.producto.crear.includes(usuario.rol)) notFound();

  const categorias = await listarCategorias();

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catálogo</p>
      <h1 className="mt-1 mb-6 text-3xl font-semibold">Nuevo producto</h1>
      <FormularioProducto
        accion={crearProductoAction}
        categorias={categorias.map((c) => ({ id: Number(c.id), nombre: c.nombre }))}
        etiquetaGuardar="Crear producto"
      />
    </main>
  );
}
