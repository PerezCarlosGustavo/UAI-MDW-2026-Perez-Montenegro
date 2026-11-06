import Link from "next/link";
import BotonAgregar from "@/components/BotonAgregar";
import SinDatos from "@/components/SinDatos";
import { Button } from "@/components/ui/button";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { listarCategoriasPaginadas } from "@/lib/db/categorias";
import { listarCategoriasQuerySchema } from "@/lib/schemas/categoria";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ pagina?: string }> };

export default async function CategoriasPage({ searchParams }: Props) {
  await verificarPermiso("categoria", "ver");

  const { pagina } = listarCategoriasQuerySchema.parse(await searchParams);
  const { categorias, total, totalPaginas } = await listarCategoriasPaginadas(pagina);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catálogo</p>
          <h1 className="mt-1 text-3xl font-semibold">Categorías</h1>
          <p className="mt-2 text-muted-foreground">
            {total} {total === 1 ? "categoría" : "categorías"}
          </p>
        </div>
        <BotonAgregar href="/categorias/nueva" titulo="Agregar categoría" />
      </div>

      {categorias.length === 0 ? (
        <SinDatos className="mt-6" titulo={total === 0 ? "Todavía no hay categorías" : "No hay categorías en esta página"} />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th scope="col" className="py-2 pr-3 font-medium">Categoría</th></tr>
            </thead>
            <tbody className="divide-y">
              {categorias.map((categoria) => (
                <tr key={String(categoria.id)}><td className="py-3 pr-3 font-medium">{categoria.nombre}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 || pagina > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-end gap-3">
          <span className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas || 1}</span>
          {pagina > 1 ? <Button asChild variant="outline" size="sm"><Link href={`/categorias?pagina=${pagina - 1}`}>Anterior</Link></Button> : null}
          {pagina < totalPaginas ? <Button asChild variant="outline" size="sm"><Link href={`/categorias?pagina=${pagina + 1}`}>Siguiente</Link></Button> : null}
        </nav>
      ) : null}
    </main>
  );
}
