import { TIPO_MOVIMIENTO_CC } from "./tiposMovimientoCuentaCorriente";

export type MovimientoCuentaCorriente = {
  id: number;
  ventaid: number | null;
  productoid: number | null;
  tipo: number;
  cantidad: number | null;
  importe: number;
  fecha: Date;
};

export type PendienteCuentaCorriente = {
  movimientoid: number;
  ventaid: number;
  productoid: number;
  cantidad: number;
  fecha: Date;
};

export type PendienteValorizado = PendienteCuentaCorriente & {
  nombre: string;
  preciounitario: number;
};

function redondearImporte(importe: number) {
  return Math.round(importe * 100) / 100;
}

function redondearCantidad(cantidad: number) {
  return Math.round(cantidad * 1000) / 1000;
}

export function reconstruirPendientes(movimientos: MovimientoCuentaCorriente[]) {
  const pendientes: PendienteCuentaCorriente[] = [];

  for (const movimiento of movimientos) {
    if (
      movimiento.tipo === TIPO_MOVIMIENTO_CC.DEUDA_VENTA &&
      movimiento.ventaid !== null &&
      movimiento.productoid !== null &&
      movimiento.cantidad !== null
    ) {
      pendientes.push({
        movimientoid: movimiento.id,
        ventaid: movimiento.ventaid,
        productoid: movimiento.productoid,
        cantidad: movimiento.cantidad,
        fecha: movimiento.fecha,
      });
      continue;
    }

    if (
      movimiento.tipo !== TIPO_MOVIMIENTO_CC.PRODUCTO_LIQUIDADO ||
      movimiento.ventaid === null ||
      movimiento.productoid === null ||
      movimiento.cantidad === null
    ) {
      continue;
    }

    let cantidadLiquidada = movimiento.cantidad;
    for (const pendiente of pendientes) {
      if (
        cantidadLiquidada <= 0 ||
        pendiente.ventaid !== movimiento.ventaid ||
        pendiente.productoid !== movimiento.productoid
      ) {
        continue;
      }

      const cantidadAplicada = Math.min(pendiente.cantidad, cantidadLiquidada);
      pendiente.cantidad = redondearCantidad(pendiente.cantidad - cantidadAplicada);
      cantidadLiquidada = redondearCantidad(cantidadLiquidada - cantidadAplicada);
    }
  }

  return pendientes.filter((pendiente) => pendiente.cantidad > 0);
}

export function calcularFIFO(
  pendientes: PendienteValorizado[],
  monto: number,
  saldoAFavorInicial = 0
) {
  const pagados: (PendienteValorizado & { importe: number })[] = [];
  let saldoAFavorDisponible = redondearImporte(saldoAFavorInicial);
  let montoRestante = redondearImporte(monto);

  for (const pendiente of pendientes) {
    const importe = redondearImporte(pendiente.cantidad * pendiente.preciounitario);
    const disponible = redondearImporte(saldoAFavorDisponible + montoRestante);

    if (disponible < importe) break;

    const saldoUsado = Math.min(saldoAFavorDisponible, importe);
    saldoAFavorDisponible = redondearImporte(saldoAFavorDisponible - saldoUsado);
    montoRestante = redondearImporte(montoRestante - (importe - saldoUsado));
    pagados.push({ ...pendiente, importe });
  }

  const saldoAFavor = redondearImporte(saldoAFavorDisponible + montoRestante);

  return {
    pagados,
    saldoAFavorUsado: redondearImporte(saldoAFavorInicial - saldoAFavorDisponible),
    saldoAFavorGenerado: montoRestante,
    saldoAFavor,
    importeLiquidado: redondearImporte(pagados.reduce((suma, item) => suma + item.importe, 0)),
  };
}
