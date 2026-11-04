"use server";

import { revalidatePath } from "next/cache";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { mensajeErrorAccion } from "@/lib/acciones/errores";
import { crearVentaSchema } from "@/lib/schemas/venta";
import { armarVenta } from "@/lib/venta/reglas";
import { buscarClienteParaVenta, buscarProductosParaVenta, registrarVenta } from "@/lib/db/ventas";
import { generarTicketVentaPdf } from "@/lib/tickets/generarTicketVenta";

export async function registrarVentaAction(entrada: unknown) {
  try {
    const usuario = await verificarPermiso("venta", "crear");
    const datos = crearVentaSchema.safeParse(entrada);
    if (!datos.success) return { ok: false as const, mensaje: datos.error.issues.map((issue) => issue.message).join(" ") };
    const pedido = datos.data;
    const ids = [...new Set(pedido.detalles.map((detalle) => detalle.productoid))];
    const [productos, cliente] = await Promise.all([
      buscarProductosParaVenta(ids),
      pedido.clienteid ? buscarClienteParaVenta(pedido.clienteid) : Promise.resolve(undefined),
    ]);
    const armada = armarVenta(pedido, productos, cliente);
    if (!armada.ok) return { ok: false as const, mensaje: armada.errores.join(" ") };
    const venta = await registrarVenta({
      clienteid: pedido.clienteid ?? null, usuarioid: usuario.id, tipopago: pedido.tipopago,
      total: armada.total, lineas: armada.lineas, descuentosDeStock: armada.descuentosDeStock,
    });
    const advertencias = [...armada.advertencias];
    try {
      await generarTicketVentaPdf({
        ventaId: venta.id, total: Number(venta.total),
        productos: venta.detalleventa.map((detalle) => ({
          nombre: detalle.producto.nombre,
          cantidad: Number(detalle.cantidad),
          subtotal: Number(detalle.subtotal)
        })),
      });
    } catch (error) {
      console.error("registrarVentaAction: comprobante", error);
      advertencias.push("La venta se registró, pero no se pudo generar el comprobante.");
    }
    revalidatePath("/ventas");
    revalidatePath("/productos");
    revalidatePath("/clientes");
    return { ok: true as const, ventaId: Number(venta.id), advertencias };
  } catch (error) {
    return { ok: false as const, mensaje: mensajeErrorAccion("registrarVentaAction", error) };
  }
}
