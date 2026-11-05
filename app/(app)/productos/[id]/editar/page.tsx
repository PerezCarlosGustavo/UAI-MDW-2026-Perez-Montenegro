import { notFound } from "next/navigation";
import FormularioProducto from "@/components/FormularioProducto";
import { requerirUsuario } from "@/lib/auth";
import { PERMISOS } from "@/lib/auth/permisos";
import { listarCategorias } from "@/lib/db/categorias";
import { obtenerProducto } from "@/lib/db/productos";
import { idProductoSchema } from "@/lib/schemas/producto";
import { editarProductoAction } from "../../acciones";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarProductoPage({ params }: Props) {
  const usuario = await requerirUsuario();

  if (!PERMISOS.producto.editar.includes(usuario.rol)) notFound();

  const id = idProductoSchema.safeParse((await params).id);
  if (!id.success) notFound();

  const [producto, categorias] = await Promise.all([obtenerProducto(BigInt(id.data)), listarCategorias()]);
  if (!producto) notFound();

  const stock = Number(producto.stockactual);

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catálogo</p>
      <h1 className="mt-1 mb-6 text-3xl font-semibold break-words">Editar {producto.nombre}</h1>
      <FormularioProducto
        accion={editarProductoAction.bind(null, id.data, stock)}
        categorias={categorias.map((c) => ({ id: Number(c.id), nombre: c.nombre }))}
        etiquetaGuardar="Guardar cambios"
        inicial={{
          nombre: producto.nombre,
          categoriaid: String(producto.categoriaid),
          codigobarra: producto.codigobarra ?? "",
          preciolista: String(producto.preciolista),
          stockactual: String(stock),
          stockminimo: producto.stockminimo === null ? "" : String(producto.stockminimo),
          permitestock: producto.permitestock,
        }}
      />
    </main>
  );
}
