/**
 * El flujo principal, de punta a punta: la sección 5 de `docs/spec.md` recorrida
 * por un navegador.
 *
 * Es una prueba larga y no siete cortas, a propósito: los errores que importan
 * están en las costuras, en que lo que se vende hoy se pueda cobrar después.
 * Cada `test.step` es un paso de la spec; si falla, el reporte dice cuál.
 *
 * Busca como una persona (`getByLabel`, `getByRole`), nunca por clase o id. Y
 * los valores esperados salen de la spec y del seed, no de correr el código.
 */
import { expect, test } from "@playwright/test";
import { crearProductoSchema, productoBuscadoSchema } from "../lib/schemas/producto";
import { SESION } from "./sesiones";

test.use({ storageState: SESION.vendedor });

test("se vende fiado y se cobra por FIFO, al precio del día y sin fraccionar", async ({ page, playwright, baseURL }) => {
  test.setTimeout(120_000);

  const cliente = `Cliente E2E ${Date.now()}`;
  const CODIGO = `E2E-${crypto.randomUUID()}`;
  const PRODUCTO = `JUGO PRONTO NARANJA E2E ${crypto.randomUUID()}`;
  const productoid = await test.step("preparación: producto propio con precio inicial de 700 pesos", async () => {
    // Cada intento modifica su propio producto y no altera el seed compartido.
    const admin = await playwright.request.newContext({ baseURL, storageState: SESION.admin });
    try {
      const listado = await admin.get("/api/productos");
      expect(listado.status()).toBe(200);
      const [referencia] = crearProductoSchema.pick({ categoriaid: true }).array().parse(await listado.json());
      expect(referencia).toBeDefined();
      const creado = await admin.post("/api/productos", { data: {
        nombre: PRODUCTO,
        codigobarra: CODIGO,
        categoriaid: referencia!.categoriaid,
        preciolista: 700,
        permitestock: true,
        stockactual: 10,
      } });
      expect(creado.status()).toBe(201);
      return productoBuscadoSchema.parse(await creado.json()).id;
    } finally {
      await admin.dispose();
    }
  });

  await test.step("antes del paso 4: se da de alta el cliente (H4)", async () => {
    await page.goto("/clientes/nuevo");
    await page.getByLabel("Nombre").fill(cliente);
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByText(cliente)).toBeVisible();
  });

  await test.step("1. el vendedor entra al punto de venta", async () => {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: /Registrar una venta/ }).click();
    await expect(page).toHaveURL(/\/ventas\/nueva$/);
    await expect(page.getByRole("heading", { name: "Nueva venta", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("banner").getByText("Vendedor", { exact: true })).toBeVisible();
  });

  await test.step("2. escanea dos veces el mismo producto: una línea, cantidad 2", async () => {
    const buscador = page.getByLabel("Escanear o buscar producto");

    await buscador.fill(CODIGO);
    await buscador.press("Enter");
    await expect(page.getByLabel(`Cantidad de ${PRODUCTO}`)).toHaveValue("1");

    await buscador.fill(CODIGO);
    await buscador.press("Enter");
    await expect(page.getByLabel(`Cantidad de ${PRODUCTO}`)).toHaveValue("2");
    await expect(page.getByText(/1\.400,00/).first()).toBeVisible();
  });

  await test.step("3. elige cuenta corriente: sin cliente, la venta se bloquea (H4)", async () => {
    await page.getByLabel("Tipo de pago").selectOption({ label: "Cuenta corriente" });

    await expect(page.getByLabel("Cliente")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("link", { name: "Crear un cliente" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar venta" })).toBeDisabled();
  });

  await test.step("3. Consumidor Final tampoco puede fiar (H4)", async () => {
    await page.getByLabel("Cliente").fill("Consumidor Final");
    await page.getByRole("list", { name: "Resultados de clientes" }).getByRole("button", { name: "Consumidor Final" }).click();
    await expect(page.getByLabel("Cliente")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("button", { name: "Registrar venta" })).toBeDisabled();
    await expect(page.getByLabel(`Cantidad de ${PRODUCTO}`)).toHaveValue("2");
  });

  await test.step("4. con un cliente real, la venta se registra", async () => {
    await page.getByLabel("Cliente").fill(cliente);
    await page.getByRole("list", { name: "Resultados de clientes" }).getByRole("button", { name: cliente }).click();
    await page.getByRole("button", { name: "Registrar venta" }).click();

    await expect(page.getByText("Venta registrada")).toBeVisible();
    const recientes = page.getByRole("complementary").getByRole("listitem");
    await expect(recientes.first()).toBeVisible();
    expect(await recientes.count()).toBeLessThanOrEqual(3);
  });

  await test.step("4. consulta el listado separado de ventas", async () => {
    await page.getByRole("link", { name: "Ver todas las ventas" }).click();
    await expect(page).toHaveURL(/\/ventas$/);
    await expect(page.getByRole("heading", { name: "Ventas", exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Listado de ventas" }).getByRole("listitem")).not.toHaveCount(0);
    expect(await page.getByRole("list", { name: "Listado de ventas" }).getByRole("listitem").count()).toBeLessThanOrEqual(10);
  });

  await test.step("5 y 6. días después, abre la cuenta del cliente: debe las unidades", async () => {
    await page.goto("/clientes");
    await page.getByRole("link", { name: `Mostrar deuda de ${cliente}` }).click();

    await expect(page.getByRole("heading", { name: cliente })).toBeVisible();
    await expect(page.getByRole("cell", { name: PRODUCTO })).toBeVisible();
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("1.400,00");
  });

  await test.step("7. la deuda se revaloriza: si sube el precio, sube lo que debe", async () => {
    const admin = await playwright.request.newContext({ baseURL, storageState: SESION.admin });
    try {
      const respuesta = await admin.put(`/api/productos/${productoid}`, { data: { preciolista: 800 } });
      expect(respuesta.status()).toBe(200);
    } finally {
      await admin.dispose();
    }

    await page.reload();
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("1.600,00");
  });

  await test.step("7. un pago que no alcanza no fracciona: queda todo como saldo a favor", async () => {
    await page.getByLabel("Monto recibido").fill("1000");
    await page.getByRole("button", { name: "Registrar cobro" }).click();

    await expect(page.getByText("Cobro registrado correctamente.")).toBeVisible();
    await expect(page.getByLabel("Monto recibido")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Registrar cobro", exact: true })).toBeEnabled();
    await expect(page.getByText("Saldo a favor").first().locator("..")).toContainText("1.000,00");
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("1.600,00");
    await expect(page.getByRole("cell", { name: PRODUCTO })).toBeVisible();
  });

  await test.step("7. el siguiente pago usa el saldo, salda el producto y guarda el sobrante", async () => {
    await page.getByLabel("Monto recibido").fill("700");
    await page.getByRole("button", { name: "Registrar cobro" }).click();

    await expect(page.getByLabel("Monto recibido")).toHaveValue("");
    await expect(page.getByRole("button", { name: "Registrar cobro", exact: true })).toBeEnabled();
    await expect(page.getByText("Cobro registrado correctamente.")).toBeVisible();
    await expect(page.getByText("No hay productos pendientes")).toBeVisible();
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("0,00");
    await expect(page.getByText("Saldo a favor").first().locator("..")).toContainText("100,00");
  });

  await test.step("8. el comprobante del cobro se abre en PDF para imprimir", async () => {
    const direccion = await page.getByRole("link", { name: "Imprimir comprobante" }).getAttribute("href");

    const respuesta = await page.request.get(direccion!);
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("application/pdf");
    expect((await respuesta.body()).subarray(0, 4).toString()).toBe("%PDF");
  });
});
