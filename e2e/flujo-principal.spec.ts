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
import { readFile } from "node:fs/promises";
import { SESION } from "./sesiones";

// Del seed: 700 pesos. Las cuentas de abajo salen de las reglas de la sección 6.
const CODIGO = "7790036000565";
const PRODUCTO = "JUGO PRONTO NARANJA X 200ML";

test.use({ storageState: SESION.vendedor });

test("se vende fiado y se cobra por FIFO, al precio del día y sin fraccionar", async ({ page, playwright, baseURL }) => {
  test.setTimeout(120_000);

  const cliente = `Cliente E2E ${Date.now()}`;

  await test.step("antes del paso 4: se da de alta el cliente (H4)", async () => {
    await page.goto("/clientes/nuevo");
    await page.getByLabel("Nombre").fill(cliente);
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByText(cliente)).toBeVisible();
  });

  await test.step("1. el vendedor entra al punto de venta", async () => {
    await page.goto("/ventas");
    await expect(page.getByRole("heading", { name: "Ventas", exact: true })).toBeVisible();
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

  await test.step("3. Consumidor Final tampoco puede fiar: lo rechaza el servidor (H4)", async () => {
    await page.getByLabel("Cliente").selectOption({ label: "Consumidor Final" });
    await page.getByRole("button", { name: "Registrar venta" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "tiene que elegir un cliente" })).toBeVisible();
    // El rechazo no le vacía la venta al vendedor.
    await expect(page.getByLabel(`Cantidad de ${PRODUCTO}`)).toHaveValue("2");
  });

  await test.step("4. con un cliente real, la venta se registra", async () => {
    await page.getByLabel("Cliente").selectOption({ label: cliente });
    await page.getByRole("button", { name: "Registrar venta" }).click();

    await expect(page.getByText("Venta registrada")).toBeVisible();
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
    const [producto] = await (await admin.get(`/api/productos?q=${CODIGO}`)).json();

    const respuesta = await admin.put(`/api/productos/${producto.id}`, { data: { preciolista: 800 } });
    expect(respuesta.status()).toBe(200);
    await admin.dispose();

    await page.reload();
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("1.600,00");
  });

  await test.step("7. un pago que no alcanza no fracciona: queda todo como saldo a favor", async () => {
    await page.getByLabel("Monto recibido").fill("1000");
    await page.getByRole("button", { name: "Registrar cobro" }).click();

    await expect(page.getByText("Cobro registrado correctamente.")).toBeVisible();
    await expect(page.getByText("Saldo a favor").first().locator("..")).toContainText("1.000,00");
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("1.600,00");
    await expect(page.getByRole("cell", { name: PRODUCTO })).toBeVisible();
  });

  await test.step("7. el siguiente pago usa el saldo, salda el producto y guarda el sobrante", async () => {
    await page.getByLabel("Monto recibido").fill("700");
    await page.getByRole("button", { name: "Registrar cobro" }).click();

    await expect(page.getByText("No hay productos pendientes")).toBeVisible();
    await expect(page.getByText("Deuda actual").locator("..")).toContainText("0,00");
    await expect(page.getByText("Saldo a favor").first().locator("..")).toContainText("100,00");
  });

  await test.step("8. el comprobante del cobro se descarga en PDF para imprimir", async () => {
    const [descarga] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Descargar comprobante" }).click(),
    ]);
    expect(descarga.suggestedFilename()).toMatch(/^comprobante-cobro-\d+\.pdf$/);
    const ruta = await descarga.path();
    expect(ruta).not.toBeNull();
    expect((await readFile(ruta!)).subarray(0, 4).toString()).toBe("%PDF");
  });
});
