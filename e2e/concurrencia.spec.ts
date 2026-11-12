/**
 * Reglas que se rompen si dos personas hacen lo mismo al mismo tiempo.
 *
 * Una prueba de concurrencia no mira la pantalla: manda los pedidos juntos con
 * `Promise.all` y después cuenta filas en la base. Si el código consulta y
 * después guarda, entre las dos cosas entra otro pedido y la cuenta no da.
 *
 * Los valores esperados salen de la sección 6 de `docs/spec.md`, no de correr
 * el código.
 */
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { SESION } from "./sesiones";

const PRECIO = 1000;
const PEDIDOS = 10;

// Spec §6, cancelación FIFO sin fraccionar: un producto fiado se marca PAGADO
// una sola vez. Si el cliente debe 1 unidad y entran 10 cobros que cada uno
// alcanza para pagarla, uno solo la liquida y los otros nueve van enteros a
// saldo a favor (acreditación de saldo a favor).
test("diez cobros simultáneos liquidan el producto fiado una sola vez", async ({ playwright, baseURL }) => {
  test.setTimeout(120_000);

  const prisma = new PrismaClient();
  const admin = await playwright.request.newContext({ baseURL, storageState: SESION.admin });
  const vendedor = await playwright.request.newContext({ baseURL, storageState: SESION.vendedor });
  const marca = Date.now();

  try {
    // Un producto propio: el precio no depende de lo que hagan otras pruebas.
    const categoria = await prisma.categoria.findFirstOrThrow({ select: { id: true } });
    const producto = await admin.post("/api/productos", {
      data: {
        nombre: `Concurrencia ${marca}`,
        categoriaid: Number(categoria.id),
        preciolista: PRECIO,
        permitestock: false,
      },
    });
    expect(producto.status()).toBe(201);
    const productoid = Number((await producto.json()).id);

    const cliente = await vendedor.post("/api/clientes", { data: { nombre: `Cliente concurrencia ${marca}` } });
    expect(cliente.status()).toBe(201);
    const clienteid = Number((await cliente.json()).id);

    const venta = await vendedor.post("/api/ventas", {
      data: { tipopago: 1, clienteid, detalles: [{ productoid, cantidad: 1 }] },
    });
    expect(venta.status()).toBe(201);

    // Con el servidor recién levantado, el pool de Prisma tiene una sola
    // conexión abierta: el primer cobro la toma y termina antes de que los
    // otros consigan la suya, así que nunca se pisan. Diez consultas juntas
    // abren las conexiones, como en producción con el sistema en uso.
    const calentamiento = await Promise.all(
      Array.from({ length: PEDIDOS }, () => vendedor.get(`/api/cuentacorriente/${clienteid}`))
    );
    expect(calentamiento.map((r) => r.status())).toEqual(Array(PEDIDOS).fill(200));

    const respuestas = await Promise.all(
      Array.from({ length: PEDIDOS }, () =>
        vendedor.post("/api/cobranza", { data: { clienteid, monto: PRECIO } })
      )
    );
    expect(respuestas.map((r) => r.status())).toEqual(Array(PEDIDOS).fill(200));

    const cuenta = await prisma.cuentacorriente.findUniqueOrThrow({
      where: { clienteid: BigInt(clienteid) },
      select: { id: true },
    });
    const contar = (tipo: number) =>
      prisma.cuentacorrientemovimiento.count({ where: { cuentacorrienteid: cuenta.id, tipo } });
    const sumar = async (tipo: number) =>
      Number(
        (await prisma.cuentacorrientemovimiento.aggregate({
          where: { cuentacorrienteid: cuenta.id, tipo },
          _sum: { importe: true },
        }))._sum.importe ?? 0
      );

    // 1 deuda, 10 pagos, 1 liquidación y 9 saldos a favor de 1000.
    expect(await contar(1), "deuda de la venta").toBe(1);
    expect(await contar(5), "pagos recibidos").toBe(PEDIDOS);
    expect(await contar(3), "veces que se liquidó el producto").toBe(1);
    expect(await sumar(2), "saldo a favor generado").toBe(PRECIO * (PEDIDOS - 1));
  } finally {
    await admin.dispose();
    await vendedor.dispose();
    await prisma.$disconnect();
  }
});
