import { revalidatePath } from "next/cache";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { crearCategoria } from "@/lib/db/categorias";
import { responderError } from "@/lib/errores";
import { crearCategoriaSchema } from "@/lib/schemas/categoria";
import { responderJson } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    await verificarPermiso("categoria", "crear");
    const resultado = crearCategoriaSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const categoria = await crearCategoria(resultado.data);
    revalidatePath("/categorias");
    return responderJson(categoria, 201);
  } catch (error) {
    return responderError("POST /api/categorias", error);
  }
}
