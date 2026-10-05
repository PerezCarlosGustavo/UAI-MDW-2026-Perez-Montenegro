import type { CrearVentaInput } from "@/lib/schemas/venta";
import { validarStock } from "@/lib/reglas/validarStock";
import { validarVentaFiado } from "@/lib/reglas/validarVentaFiado";

/**
 * Reglas de negocio de una venta nueva. Función pura: no consulta la base ni
 * conoce Prisma; recibe el pedido y los datos que ya se buscaron (productos y
 * cliente) y decide.
 *
 * - El precio sale del catálogo (preciolista), nunca del cliente.
 * - Producto inexistente o inactivo → error (409).
 * - Cliente inexistente o inactivo → error (409).
 * - Stock insuficiente NO bloquea la venta (spec §6 y ADR 0004): se vende
 *   igual, el stock queda negativo y se devuelve una advertencia.
 * - Solo se descuenta stock de productos con permitestock = true.
 */

export type ProductoParaVenta = {
  id: number;
  nombre: string;
  preciolista: number;
  permitestock: boolean;
  stockactual: number;
  activo: boolean;
};

export type ClienteParaVenta = { activo: boolean; documento: string | null } | null;

export type LineaVenta = {
  productoid: number;
  cantidad: number;
  preciounitario: number;
  subtotal: number;
};

type VentaArmada =
  | { ok: false; errores: string[] }
  | {
      ok: true;
      lineas: LineaVenta[];
      total: number;
      descuentosDeStock: { productoid: number; cantidad: number }[];
      advertencias: string[];
    };

// Plata con dos decimales. Sin esto, 3 × 0.1 da 0.30000000000000004.
function redondear(importe: number) {
  return Math.round(importe * 100) / 100;
}

export function armarVenta(
  pedido: CrearVentaInput,
  productos: ProductoParaVenta[],
  // undefined = el pedido no trae cliente; null = trae uno que no existe.
  cliente: ClienteParaVenta | undefined
): VentaArmada {
  const errores: string[] = [];

  const validacionFiado = validarVentaFiado(
    pedido.clienteid ?? null,
    pedido.tipopago,
    cliente?.documento === "0"
  );
  if (!validacionFiado.ok) errores.push(validacionFiado.error);

  if (cliente === null) errores.push("El cliente no existe.");
  if (cliente && !cliente.activo) errores.push("El cliente está inactivo.");

  const productoPorId = new Map(productos.map((p) => [p.id, p]));
  const lineas: LineaVenta[] = [];

  for (const detalle of pedido.detalles) {
    const producto = productoPorId.get(detalle.productoid);

    if (!producto) {
      errores.push(`El producto ${detalle.productoid} no existe.`);
      continue;
    }

    if (!producto.activo) {
      errores.push(`El producto ${producto.nombre} está inactivo.`);
      continue;
    }

    lineas.push({
      productoid: producto.id,
      cantidad: detalle.cantidad,
      preciounitario: producto.preciolista,
      subtotal: redondear(detalle.cantidad * producto.preciolista),
    });
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  // Si el mismo producto viene en dos líneas, para el stock cuenta la suma.
  const cantidadPorProducto = new Map<number, number>();
  for (const linea of lineas) {
    cantidadPorProducto.set(
      linea.productoid,
      (cantidadPorProducto.get(linea.productoid) ?? 0) + linea.cantidad
    );
  }

  const items = [...cantidadPorProducto].map(([productoid, cantidad]) => {
    const producto = productoPorId.get(productoid)!;
    return {
      productoid,
      cantidad,
      stockactual: producto.stockactual,
      permitestock: producto.permitestock,
    };
  });

  const advertencias = validarStock(items).faltantes.map((faltante) => {
    const nombre = productoPorId.get(faltante.productoid)!.nombre;
    return `Stock insuficiente para ${nombre}: había ${faltante.disponible} y se vendieron ${faltante.requerido}. El stock queda en negativo, hay que ajustarlo.`;
  });

  return {
    ok: true,
    lineas,
    total: redondear(lineas.reduce((suma, linea) => suma + linea.subtotal, 0)),
    descuentosDeStock: items
      .filter((item) => item.permitestock)
      .map(({ productoid, cantidad }) => ({ productoid, cantidad })),
    advertencias,
  };
}
