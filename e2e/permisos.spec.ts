/**
 * Los permisos, probados contra el servidor y no contra la pantalla.
 *
 * Ninguna prueba abre una página: le pegan directo a la API, como alguien con
 * `curl`. La pregunta no es si el botón está escondido, sino si el servidor dice
 * que no cuando alguien se saltea la pantalla.
 *
 * Cada fila sale de la sección "Roles" de `docs/api.md`, dada vuelta: quién NO
 * puede y qué tiene que contestar. Se escriben mirando el contrato, porque el
 * código dice lo que hace y no lo que debería hacer.
 *
 *   401  no sé quién sos
 *   403  sé quién sos, y tu rol no puede
 *   404  para vos, esto no existe: la venta de otro vendedor
 */
import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { SESION } from "./sesiones";

// Bodies válidos: lo que tiene que fallar es el permiso, no la validación.
const PRODUCTO = { nombre: "Intruso", categoriaid: 1, preciolista: 100 };
const CLIENTE = { nombre: "Intruso" };
const VENTA = { tipopago: 0, detalles: [{ productoid: 1, cantidad: 1 }] };
const COBRO = { clienteid: 1, monto: 100 };

type Pedido = (api: APIRequestContext) => Promise<APIResponse>;

const TODOS: [string, Pedido][] = [
  ["GET /api/productos", (api) => api.get("/api/productos")],
  ["POST /api/productos", (api) => api.post("/api/productos", { data: PRODUCTO })],
  ["GET /api/productos/:id", (api) => api.get("/api/productos/1")],
  ["PUT /api/productos/:id", (api) => api.put("/api/productos/1", { data: { preciolista: 1 } })],
  ["DELETE /api/productos/:id", (api) => api.delete("/api/productos/1")],
  ["GET /api/clientes", (api) => api.get("/api/clientes")],
  ["GET /api/clientes/:id", (api) => api.get("/api/clientes/1")],
  ["POST /api/clientes", (api) => api.post("/api/clientes", { data: CLIENTE })],
  ["PUT /api/clientes/:id", (api) => api.put("/api/clientes/1", { data: CLIENTE })],
  ["DELETE /api/clientes/:id", (api) => api.delete("/api/clientes/1")],
  ["GET /api/ventas", (api) => api.get("/api/ventas")],
  ["GET /api/ventas/:id", (api) => api.get("/api/ventas/1")],
  ["GET /api/ventas/:id/comprobante", (api) => api.get("/api/ventas/1/comprobante")],
  ["GET /api/ventas/mias", (api) => api.get("/api/ventas/mias")],
  ["POST /api/ventas", (api) => api.post("/api/ventas", { data: VENTA })],
  ["GET /api/cuentacorriente/:clienteid", (api) => api.get("/api/cuentacorriente/1")],
  ["POST /api/cobranza", (api) => api.post("/api/cobranza", { data: COBRO })],
  ["GET /api/cobranza/:id/comprobante", (api) => api.get("/api/cobranza/1/comprobante")],
  ["GET /api/usuarios", (api) => api.get("/api/usuarios")],
  ["PATCH /api/usuarios/:id", (api) => api.patch("/api/usuarios/1", { data: { rol: "VENDEDOR" } })],
];

test.describe("sin sesión: 401", () => {
  for (const [endpoint, pedir] of TODOS) {
    test(endpoint, async ({ request }) => {
      expect((await pedir(request)).status()).toBe(401);
    });
  }
});

test.describe("un usuario desactivado deja de estar autenticado: 401 (H1)", () => {
  test.use({ storageState: SESION.inactivo });

  for (const [endpoint, pedir] of TODOS) {
    test(endpoint, async ({ request }) => {
      expect((await pedir(request)).status()).toBe(401);
    });
  }
});

test.describe("PENDIENTE no puede nada: 403", () => {
  test.use({ storageState: SESION.pendiente });

  for (const [endpoint, pedir] of TODOS) {
    test(endpoint, async ({ request }) => {
      expect((await pedir(request)).status()).toBe(403);
    });
  }
});

test.describe("VENDEDOR no administra: 403", () => {
  test.use({ storageState: SESION.vendedor });

  const soloAdmin = [
    "POST /api/productos",
    "PUT /api/productos/:id",
    "DELETE /api/productos/:id",
    "PUT /api/clientes/:id",
    "DELETE /api/clientes/:id",
    "GET /api/usuarios",
    "PATCH /api/usuarios/:id",
  ];

  for (const [endpoint, pedir] of TODOS.filter(([nombre]) => soloAdmin.includes(nombre))) {
    test(endpoint, async ({ request }) => {
      expect((await pedir(request)).status()).toBe(403);
    });
  }

  test("GET /api/productos sí puede", async ({ request }) => {
    expect((await request.get("/api/productos")).status()).toBe(200);
  });
});

test.describe("ADMIN no tiene ventas propias", () => {
  test.use({ storageState: SESION.admin });

  test("GET /api/ventas/mias: 403", async ({ request }) => {
    expect((await request.get("/api/ventas/mias")).status()).toBe(403);
  });
});

test.describe("cada vendedor ve solo sus ventas", () => {
  let ventaId: number;

  test.beforeAll(async ({ playwright, baseURL }) => {
    const vendedor = await playwright.request.newContext({ baseURL, storageState: SESION.vendedor });
    const [producto] = await (await vendedor.get("/api/productos")).json();

    const respuesta = await vendedor.post("/api/ventas", {
      data: { tipopago: 0, detalles: [{ productoid: producto.id, cantidad: 1 }] },
    });
    expect(respuesta.status()).toBe(201);
    ventaId = (await respuesta.json()).id;
    await vendedor.dispose();
  });

  test.describe("quien la registró", () => {
    test.use({ storageState: SESION.vendedor });

    test("la ve", async ({ request }) => {
      expect((await request.get(`/api/ventas/${ventaId}`)).status()).toBe(200);
    });
  });

  test.describe("otro vendedor", () => {
    test.use({ storageState: SESION.otroVendedor });

    test("recibe 404, igual que si no existiera", async ({ request }) => {
      expect((await request.get(`/api/ventas/${ventaId}`)).status()).toBe(404);
    });

    test("su comprobante también da 404", async ({ request }) => {
      expect((await request.get(`/api/ventas/${ventaId}/comprobante`)).status()).toBe(404);
    });

    test("no la ve en su lista", async ({ request }) => {
      const ventas: { id: number }[] = await (await request.get("/api/ventas")).json();
      expect(ventas.map((venta) => venta.id)).not.toContain(ventaId);
    });
  });

  test.describe("el administrador", () => {
    test.use({ storageState: SESION.admin });

    test("la ve", async ({ request }) => {
      expect((await request.get(`/api/ventas/${ventaId}`)).status()).toBe(200);
    });
  });
});
