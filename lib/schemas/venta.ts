import { z } from "zod";

// Del cliente solo se acepta QUÉ se vende y CUÁNTO. El precio, el subtotal y
// el total los calcula el servidor con el precio de lista del catálogo: si
// vinieran del body, un vendedor podría vender cualquier cosa a $1.
// (Si el body trae esos campos, Zod los descarta.)
const detallePedidoSchema = z.object({
  productoid: z.coerce.number().int().positive("Producto inválido"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
});

export const crearVentaSchema = z.object({
  clienteid: z.coerce.number().int().positive().optional().nullable(),
  // 0 = contado, 1 = cuenta corriente. El 0 es un valor válido: no se puede
  // chequear con `!tipopago`, porque rechazaría todas las ventas al contado.
  tipopago: z.coerce
    .number()
    .int()
    .refine((valor) => valor === 0 || valor === 1, "El tipo de pago debe ser 0 (contado) o 1 (cuenta corriente)"),
  detalles: z.array(detallePedidoSchema).min(1, "La venta debe tener al menos un producto"),
});

// Query string de GET /api/ventas: ?pagina=2
export const listarVentasQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1, "La página empieza en 1").default(1),
});

export type CrearVentaInput = z.infer<typeof crearVentaSchema>;
