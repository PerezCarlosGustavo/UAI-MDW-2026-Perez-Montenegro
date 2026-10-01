import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import { responderJson } from "@/lib/utils";
import { armarVenta } from "@/lib/venta/reglas";
import {
  buscarClienteParaVenta,
  buscarProductosParaVenta,
  listarVentasVisiblesPara,
  registrarVenta,
} from "@/lib/db/ventas";
import { responderError } from "@/lib/errores";
import { generarTicketVentaPdf } from "@/lib/tickets/generarTicketVenta";
import { crearVentaSchema, listarVentasQuerySchema } from "@/lib/schemas/venta";

// GET /api/ventas?pagina=N → ADMIN ve todas; VENDEDOR, solo las suyas.
export async function GET(req: Request) {
  try {
    const usuario = await verificarPermiso("venta", "ver");

    const query = Object.fromEntries(new URL(req.url).searchParams);
    const resultado = listarVentasQuerySchema.safeParse(query);
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const ventas = await listarVentasVisiblesPara(usuario, resultado.data.pagina);

    return responderJson(ventas);
  } catch (error) {
    return responderError("GET /api/ventas", error);
  }
}

export async function POST(req: Request) {
  try {
    // El usuario sale de la sesión, nunca del body: la venta queda a nombre
    // de quien la registra.
    const usuario = await verificarPermiso("venta", "crear");

    const resultado = crearVentaSchema.safeParse(await req.json());
    if (!resultado.success) {
      return Response.json(
        { error: "Validación fallida", detalles: resultado.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }
    const pedido = resultado.data;

    // Se buscan los datos que las reglas necesitan; las reglas no consultan.
    const idsProductos = [...new Set(pedido.detalles.map((d) => d.productoid))];
    const [productos, cliente] = await Promise.all([
      buscarProductosParaVenta(idsProductos),
      pedido.clienteid ? buscarClienteParaVenta(pedido.clienteid) : Promise.resolve(undefined),
    ]);

    const armada = armarVenta(pedido, productos, cliente);
    if (!armada.ok) {
      return Response.json(
        { error: "Reglas de negocio fallidas", detalles: armada.errores },
        { status: 409 }
      );
    }

    const venta = await registrarVenta({
      clienteid: pedido.clienteid ?? null,
      usuarioid: usuario.id,
      tipopago: pedido.tipopago,
      total: armada.total,
      lineas: armada.lineas,
      descuentosDeStock: armada.descuentosDeStock,
    });

    const detalleTicket = venta.detalleventa.map((detalle) => ({
      nombre: detalle.producto.nombre,
      cantidad: Number(detalle.cantidad),
      subtotal: Number(detalle.subtotal),
    }));

    await generarTicketVentaPdf({
      ventaId: venta.id,
      productos: detalleTicket,
      total: Number(venta.total),
    });

    // Las advertencias (stock que quedó negativo) viajan con la venta para
    // que la pantalla las muestre sin frenar la caja.
    return responderJson({ ...venta, advertencias: armada.advertencias }, 201);
  } catch (error) {
    return responderError("POST /api/ventas", error);
  }
}
