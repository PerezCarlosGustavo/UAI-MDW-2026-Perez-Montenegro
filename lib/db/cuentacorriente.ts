import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { calcularFIFO, reconstruirPendientes, type MovimientoCuentaCorriente, type PendienteValorizado } from "@/lib/reglas/calcularFIFO";
import { calcularSaldoAFavor } from "@/lib/reglas/calcularSaldoAFavor";
import { TIPO_MOVIMIENTO_CC } from "@/lib/reglas/tiposMovimientoCuentaCorriente";

const MOVIMIENTOS_POR_PAGINA = 500;
const PENDIENTES_POR_PAGINA = 50;

async function listarMovimientos(
  tx: Prisma.TransactionClient,
  cuentacorrienteid: bigint
): Promise<MovimientoCuentaCorriente[]> {
  const movimientos: MovimientoCuentaCorriente[] = [];
  let ultimoId: bigint | undefined;

  while (true) {
    const pagina = await tx.cuentacorrientemovimiento.findMany({
      where: {
        cuentacorrienteid,
        ...(ultimoId === undefined ? {} : { id: { gt: ultimoId } }),
      },
      orderBy: { id: "asc" },
      take: MOVIMIENTOS_POR_PAGINA,
      select: {
        id: true,
        ventaid: true,
        productoid: true,
        tipo: true,
        cantidad: true,
        importe: true,
        fecha: true,
      },
    });

    movimientos.push(
      ...pagina.map((movimiento) => ({
        id: Number(movimiento.id),
        ventaid: movimiento.ventaid === null ? null : Number(movimiento.ventaid),
        productoid: movimiento.productoid === null ? null : Number(movimiento.productoid),
        tipo: movimiento.tipo,
        cantidad: movimiento.cantidad === null ? null : Number(movimiento.cantidad),
        importe: Number(movimiento.importe),
        fecha: movimiento.fecha,
      }))
    );

    if (pagina.length < MOVIMIENTOS_POR_PAGINA) break;
    const ultimoMovimiento = pagina[pagina.length - 1];
    if (!ultimoMovimiento) break;
    ultimoId = ultimoMovimiento.id;
  }

  return movimientos;
}

async function buscarProductos(
  tx: Prisma.TransactionClient,
  productoid: number[]
) {
  const productos: { id: number; nombre: string; preciolista: number }[] = [];
  const idsUnicos = [...new Set(productoid)];

  for (let inicio = 0; inicio < idsUnicos.length; inicio += MOVIMIENTOS_POR_PAGINA) {
    const ids = idsUnicos.slice(inicio, inicio + MOVIMIENTOS_POR_PAGINA);
    const pagina = await tx.producto.findMany({
      where: { id: { in: ids.map((id) => BigInt(id)) } },
      take: MOVIMIENTOS_POR_PAGINA,
      select: { id: true, nombre: true, preciolista: true },
    });
    productos.push(
      ...pagina.map((producto) => ({
        id: Number(producto.id),
        nombre: producto.nombre,
        preciolista: Number(producto.preciolista),
      }))
    );
  }

  return productos;
}

function valorizarPendientes(
  pendientes: ReturnType<typeof reconstruirPendientes>,
  productos: { id: number; nombre: string; preciolista: number }[]
): PendienteValorizado[] {
  const productoPorId = new Map(productos.map((producto) => [producto.id, producto]));

  return pendientes.map((pendiente) => {
    const producto = productoPorId.get(pendiente.productoid);
    if (!producto) throw new Error(`No se encontró el producto ${pendiente.productoid} de una deuda pendiente`);

    return {
      ...pendiente,
      nombre: producto.nombre,
      preciounitario: producto.preciolista,
    };
  });
}

function redondearImporte(importe: number) {
  return Math.round(importe * 100) / 100;
}

export async function obtenerEstadoCuentaCorriente(clienteid: number, pagina: number) {
  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUnique({
      where: { id: BigInt(clienteid) },
      select: { id: true },
    });
    if (!cliente) return null;

    const cuenta = await tx.cuentacorriente.findUnique({
      where: { clienteid: cliente.id },
      select: { id: true },
    });

    if (!cuenta) {
      return {
        clienteid,
        pendientes: [],
        totalPendientes: 0,
        totalDeuda: 0,
        saldoAFavor: 0,
        pagina,
        porPagina: PENDIENTES_POR_PAGINA,
        totalPaginas: 0,
      };
    }

    const movimientos = await listarMovimientos(tx, cuenta.id);
    const pendientes = reconstruirPendientes(movimientos);
    const productos = await buscarProductos(tx, pendientes.map((pendiente) => pendiente.productoid));
    const valorizados = valorizarPendientes(pendientes, productos);
    const inicio = (pagina - 1) * PENDIENTES_POR_PAGINA;
    const totalDeuda = redondearImporte(
      valorizados.reduce((total, pendiente) => total + pendiente.cantidad * pendiente.preciounitario, 0)
    );

    return {
      clienteid,
      pendientes: valorizados.slice(inicio, inicio + PENDIENTES_POR_PAGINA).map((pendiente) => ({
        movimientoid: pendiente.movimientoid,
        ventaid: pendiente.ventaid,
        productoid: pendiente.productoid,
        nombre: pendiente.nombre,
        cantidad: pendiente.cantidad,
        fecha: pendiente.fecha,
        precioUnitario: pendiente.preciounitario,
        subtotalActual: redondearImporte(pendiente.cantidad * pendiente.preciounitario),
      })),
      totalPendientes: valorizados.length,
      totalDeuda,
      saldoAFavor: calcularSaldoAFavor(movimientos).saldo,
      pagina,
      porPagina: PENDIENTES_POR_PAGINA,
      totalPaginas: Math.ceil(valorizados.length / PENDIENTES_POR_PAGINA),
    };
  }, {
    maxWait: 10_000,
    timeout: 30_000,
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  });
}

export async function registrarCobranza(clienteid: number, monto: number) {
  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUnique({
      where: { id: BigInt(clienteid) },
      select: { id: true },
    });
    if (!cliente) return null;

    const cuenta = await tx.cuentacorriente.upsert({
      where: { clienteid: cliente.id },
      update: {},
      create: { clienteid: cliente.id },
      select: { id: true },
    });

    await tx.$queryRaw<Array<{ id: bigint }>>(Prisma.sql`
      SELECT "id" FROM "cuentacorriente"
      WHERE "id" = ${cuenta.id}
      FOR UPDATE
    `);

    const movimientos = await listarMovimientos(tx, cuenta.id);
    const pendientes = reconstruirPendientes(movimientos);
    const productos = await buscarProductos(tx, pendientes.map((pendiente) => pendiente.productoid));
    const valorizados = valorizarPendientes(pendientes, productos);
    const saldoInicial = calcularSaldoAFavor(movimientos).saldo;
    const resultado = calcularFIFO(valorizados, monto, saldoInicial);

    const nuevosMovimientos: Prisma.cuentacorrientemovimientoCreateManyInput[] = [];
    nuevosMovimientos.push({
      cuentacorrienteid: cuenta.id,
      tipo: TIPO_MOVIMIENTO_CC.PAGO_RECIBIDO,
      cantidad: null,
      importe: monto,
    });

    if (resultado.saldoAFavorUsado > 0) {
      nuevosMovimientos.push({
        cuentacorrienteid: cuenta.id,
        tipo: TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR_UTILIZADO,
        cantidad: null,
        importe: resultado.saldoAFavorUsado,
      });
    }

    for (const pagado of resultado.pagados) {
      nuevosMovimientos.push({
        cuentacorrienteid: cuenta.id,
        ventaid: BigInt(pagado.ventaid),
        productoid: BigInt(pagado.productoid),
        tipo: TIPO_MOVIMIENTO_CC.PRODUCTO_LIQUIDADO,
        cantidad: pagado.cantidad,
        importe: pagado.importe,
      });
    }

    if (resultado.saldoAFavorGenerado > 0) {
      nuevosMovimientos.push({
        cuentacorrienteid: cuenta.id,
        tipo: TIPO_MOVIMIENTO_CC.SALDO_A_FAVOR,
        cantidad: null,
        importe: resultado.saldoAFavorGenerado,
      });
    }

    await tx.cuentacorrientemovimiento.createMany({ data: nuevosMovimientos });

    const deudaAntes = redondearImporte(
      valorizados.reduce((total, pendiente) => total + pendiente.cantidad * pendiente.preciounitario, 0)
    );

    return {
      clienteid,
      montoRecibido: monto,
      pagados: resultado.pagados.map((pagado) => ({
        ventaid: pagado.ventaid,
        productoid: pagado.productoid,
        nombre: pagado.nombre,
        cantidad: pagado.cantidad,
        precioPagado: pagado.preciounitario,
        importe: pagado.importe,
      })),
      deudaAntes,
      deudaRestante: redondearImporte(deudaAntes - resultado.importeLiquidado),
      saldoAFavorUsado: resultado.saldoAFavorUsado,
      saldoAFavorGenerado: resultado.saldoAFavorGenerado,
      saldoAFavor: resultado.saldoAFavor,
    };
  }, { maxWait: 10_000, timeout: 30_000 });
}