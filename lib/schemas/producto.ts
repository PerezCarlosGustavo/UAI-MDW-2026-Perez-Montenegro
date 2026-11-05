import { z } from "zod";

// Los topes salen de las columnas Decimal(12,2) y Decimal(12,3) del schema de
// Prisma: pasarse daría un error de la base en vez de un mensaje útil.
const camposProductoSchema = z.object({
  categoriaid: z.coerce
    .number({ invalid_type_error: "Elegí una categoría" })
    .int("Elegí una categoría")
    .positive("Elegí una categoría"),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar los 150 caracteres"),
  codigobarra: z
    .string()
    .trim()
    .max(50, "El código de barras no puede superar los 50 caracteres")
    .optional()
    .nullable(),
  preciolista: z.coerce
    .number({ invalid_type_error: "Ingresá un precio válido" })
    .nonnegative("El precio no puede ser negativo")
    .max(9_999_999_999.99, "El precio es demasiado alto"),
  permitestock: z.boolean(),
  stockactual: z.coerce
    .number({ invalid_type_error: "Ingresá un stock válido" })
    .nonnegative("El stock no puede ser negativo")
    .max(999_999_999.999, "El stock es demasiado alto"),
  stockminimo: z.coerce
    .number({ invalid_type_error: "Ingresá un stock mínimo válido" })
    .finite("Ingresá un stock mínimo válido")
    .nonnegative("El stock mínimo no puede ser negativo")
    .max(999_999_999.999, "El stock mínimo es demasiado alto")
    .multipleOf(0.001, "El stock mínimo admite hasta tres decimales")
    .nullable(),
  activo: z.boolean(),
});

export const crearProductoSchema = camposProductoSchema.extend({
  permitestock: z.boolean().optional().default(true),
  stockactual: camposProductoSchema.shape.stockactual.optional().default(0),
  stockminimo: camposProductoSchema.shape.stockminimo.optional().default(null),
  activo: z.boolean().optional().default(true),
});

export const actualizarProductoSchema = camposProductoSchema.partial();

// Lo que completa el formulario de alta y edición. `activo` no está porque la
// baja es otra operación, y `stockactual` es opcional porque al editar sin
// tocarlo no se manda (ver datosDeFormularioProducto).
export const formularioProductoSchema = camposProductoSchema.omit({ activo: true }).extend({
  stockactual: camposProductoSchema.shape.stockactual.optional(),
  stockminimo: camposProductoSchema.shape.stockminimo.optional().default(null),
});

// Un formulario manda texto; acá se pasa a la forma que espera el schema, sin
// validar nada todavía.
//
// El stock que no se tocó se omite a propósito: si mientras el administrador
// edita el precio entra una venta, guardar el número viejo pisaría ese
// descuento. Por eso también se puede cambiar el precio de un producto con
// stock negativo (ADR 0004) sin que el stock frene el formulario.
export function datosDeFormularioProducto(formData: FormData, stockAlAbrir?: number) {
  const texto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" ? valor.trim() : "";
  };

  const permitestock = formData.get("permitestock") === "on";
  const stock = texto("stockactual");
  const stockSinCambios = stock === "" || Number(stock) === stockAlAbrir;

  return {
    nombre: texto("nombre"),
    categoriaid: texto("categoriaid"),
    // Vacío va como null: la columna es única y dos "" chocarían entre sí.
    codigobarra: texto("codigobarra") || null,
    preciolista: texto("preciolista") || undefined,
    permitestock,
    stockminimo: !permitestock ? null : texto("stockminimo") || null,
    // Sin control de stock el campo viene deshabilitado y el stock es 0.
    stockactual: !permitestock ? 0 : stockSinCambios ? undefined : stock,
  };
}

export const idProductoSchema = z.coerce.number().int().positive();

export const buscarProductosQuerySchema = z.object({
  q: z.string().trim().max(150, "La búsqueda es demasiado larga").optional(),
});

export const listarProductosQuerySchema = z.object({
  q: buscarProductosQuerySchema.shape.q.catch(undefined),
  pagina: z.coerce.number().int().positive().catch(1),
});

// Lo que el buscador del punto de venta usa de la respuesta de la API. Prisma
// serializa los Decimal como texto, de ahí el coerce.
export const productoBuscadoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  codigobarra: z.string().nullable(),
  preciolista: z.coerce.number(),
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
export type ProductoBuscado = z.infer<typeof productoBuscadoSchema>;
