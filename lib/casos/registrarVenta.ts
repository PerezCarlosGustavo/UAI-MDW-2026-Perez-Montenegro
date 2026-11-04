import type { CrearVentaInput } from "@/lib/schemas/venta";
import { armarVenta } from "@/lib/venta/reglas";
import { buscarClienteParaVenta, buscarProductosParaVenta, registrarVenta as guardarVenta } from "@/lib/db/ventas";
import { generarTicketVentaPdf } from "@/lib/tickets/generarTicketVenta";

// La venta se confirma antes de emitir el comprobante. Un fallo del PDF
// devuelve una advertencia, nunca un rechazo que invite a duplicar la venta.
export async function registrarVenta(pedido: CrearVentaInput, usuarioid: number) {
  const ids = [...new Set(pedido.detalles.map((detalle) => detalle.productoid))];
  const [productos, cliente] = await Promise.all([
    buscarProductosParaVenta(ids),
    pedido.clienteid ? buscarClienteParaVenta(pedido.clienteid) : Promise.resolve(undefined),
  ]);
  const armada = armarVenta(pedido, productos, cliente);
  if (!armada.ok) return { ok: false as const, errores: armada.errores };
  const venta = await guardarVenta({
    clienteid: pedido.clienteid ?? null,
    usuarioid,
    tipopago: pedido.tipopago,
    total: armada.total,
    lineas: armada.lineas,
    descuentosDeStock: armada.descuentosDeStock,
  });
  const advertencias = [...armada.advertencias];
  try {
    await generarTicketVentaPdf({
      ventaId: venta.id,
      total: Number(venta.total),
      productos: venta.detalleventa.map((detalle) => ({
        nombre: detalle.producto.nombre,
        cantidad: Number(detalle.cantidad),
        subtotal: Number(detalle.subtotal)
      })),
    });
  } catch (error) {
    console.error("registrarVenta: comprobante", error);
    advertencias.push("La venta se registró, pero no se pudo generar el comprobante.");
  }
  return { ok: true as const, venta, advertencias };
}
