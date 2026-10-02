import { Prisma, type Rol } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { filtroVentasVisiblesPara } from "@/lib/venta/pertenencia";
import { TIPO_MOVIMIENTO_CC } from "@/lib/reglas/tiposMovimientoCuentaCorriente";
import type { ClienteParaVenta, LineaVenta, ProductoParaVenta } from "@/lib/venta/reglas";

const VENTAS_POR_PAGINA = 50;

type UsuarioSesion = { id: number; rol: Rol };

// Lo que se devuelve de una venta. Del usuario y del cliente va solo id y
// nombre: antes se incluía el registro entero (con el email de otros).
const CAMPOS_VENTA = {
  id: true,
  fecha: true,
  tipopago: true,
  total: true,
  cliente: { select: { id: true, nombre: true } },
  usuario: { select: { id: true, nombre: true } },
  detalleventa: {
    select: {
      productoid: true,
      cantidad: true,
      preciounitario: true,
      subtotal: true,
      producto: { select: { nombre: true } },
    },
  },
} as const;

/** Ventas que este usuario puede ver, de a 50, las más nuevas primero. */
export async function listarVentasVisiblesPara(usuario: UsuarioSesion, pagina: number = 1) {
  return prisma.venta.findMany({
    where: filtroVentasVisiblesPara(usuario),
    orderBy: { fecha: "desc" },
    take: VENTAS_POR_PAGINA,
    skip: (pagina - 1) * VENTAS_POR_PAGINA,
    select: CAMPOS_VENTA,
  });
}

/** Una venta, solo si este usuario puede verla. `null` → 404. */
export async function obtenerVentaVisiblePara(id: bigint, usuario: UsuarioSesion) {
  return prisma.venta.findFirst({
    where: { id, ...filtroVentasVisiblesPara(usuario) },
    select: CAMPOS_VENTA,
  });
}

/** Productos del pedido, con los decimales pasados a number para las reglas. */
export async function buscarProductosParaVenta(ids: number[]): Promise<ProductoParaVenta[]> {
  const productos = await prisma.producto.findMany({
    where: { id: { in: ids.map((id) => BigInt(id)) } },
    select: {
      id: true,
      nombre: true,
      preciolista: true,
      permitestock: true,
      stockactual: true,
      activo: true,
    },
  });

  return productos.map((p) => ({
    ...p,
    id: Number(p.id),
    preciolista: Number(p.preciolista),
    stockactual: Number(p.stockactual),
  }));
}

/** `null` si el cliente no existe. */
export async function buscarClienteParaVenta(id: number): Promise<ClienteParaVenta> {
  return prisma.cliente.findUnique({
    where: { id: BigInt(id) },
    select: { activo: true, documento: true },
  });
}

/**
 * Guarda la venta y descuenta el stock EN UNA TRANSACCIÓN.
 *
 * Antes eran consultas sueltas: si fallaba el descuento del tercer producto,
 * la venta quedaba guardada con el stock a medio descontar. Con $transaction,
 * o se guarda todo o no se guarda nada.
 *
 * El decremento es atómico en la base (`decrement`), así que dos ventas
 * simultáneas del mismo producto no se pisan el stock.
 */
export async function registrarVenta(datos: {
  clienteid: number | null;
  usuarioid: number;
  tipopago: number;
  total: number;
  lineas: LineaVenta[];
  descuentosDeStock: { productoid: number; cantidad: number }[];
}) {
  return prisma.$transaction(async (tx) => {
    const venta = await tx.venta.create({
      data: {
        clienteid: datos.clienteid ? BigInt(datos.clienteid) : null,
        usuarioid: BigInt(datos.usuarioid),
        tipopago: datos.tipopago,
        total: datos.total,
        detalleventa: {
          create: datos.lineas.map((linea) => ({
            productoid: BigInt(linea.productoid),
            cantidad: linea.cantidad,
            preciounitario: linea.preciounitario,
            subtotal: linea.subtotal,
          })),
        },
      },
      select: CAMPOS_VENTA,
    });

    if (datos.tipopago === 1 && datos.clienteid !== null) {
      const cuentaCorriente = await tx.cuentacorriente.upsert({
        where: { clienteid: BigInt(datos.clienteid) },
        update: {},
        create: { clienteid: BigInt(datos.clienteid) },
        select: { id: true },
      });

      await tx.$queryRaw<Array<{ id: bigint }>>(Prisma.sql`
        SELECT "id" FROM "cuentacorriente"
        WHERE "id" = ${cuentaCorriente.id}
        FOR UPDATE
      `);

      await tx.cuentacorrientemovimiento.createMany({
        data: datos.lineas.map((linea) => ({
          cuentacorrienteid: cuentaCorriente.id,
          ventaid: venta.id,
          productoid: BigInt(linea.productoid),
          tipo: TIPO_MOVIMIENTO_CC.DEUDA_VENTA,
          cantidad: linea.cantidad,
          importe: 0,
        })),
      });
    }

    for (const descuento of datos.descuentosDeStock) {
      await tx.producto.update({
        where: { id: BigInt(descuento.productoid) },
        data: { stockactual: { decrement: descuento.cantidad } },
      });
    }

    return venta;
  }, { maxWait: 10_000, timeout: 15_000 });
}
