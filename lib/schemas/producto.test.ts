import { describe, expect, it } from "vitest";
import { actualizarProductoSchema, crearProductoSchema, datosDeFormularioProducto, formularioProductoSchema } from "./producto";

function formulario(campos: Record<string, string>) {
  const formData = new FormData();
  for (const [campo, valor] of Object.entries(campos)) formData.set(campo, valor);
  return formData;
}

const valido = {
  nombre: "Yerba 1kg",
  categoriaid: "2",
  codigobarra: "779",
  preciolista: "2500",
  permitestock: "on",
  stockactual: "10",
};

describe("datosDeFormularioProducto", () => {
  it("manda null si el código de barras está vacío, porque la columna es única", () => {
    const datos = datosDeFormularioProducto(formulario({ ...valido, codigobarra: "  " }));
    expect(datos.codigobarra).toBeNull();
  });

  it("deja el stock en 0 si el producto no controla stock", () => {
    const datos = datosDeFormularioProducto(formulario({ nombre: "Pan", categoriaid: "10", preciolista: "900" }));
    expect(datos.permitestock).toBe(false);
    expect(datos.stockactual).toBe(0);
  });

  it("no manda el stock si no se tocó, para no pisar una venta que entró mientras se editaba", () => {
    const datos = datosDeFormularioProducto(formulario({ ...valido, stockactual: "-3" }), -3);
    expect(datos.stockactual).toBeUndefined();
  });

  it("manda el stock si se cambió", () => {
    const datos = datosDeFormularioProducto(formulario({ ...valido, stockactual: "8" }), 10);
    expect(datos.stockactual).toBe("8");
  });
});

describe("formularioProductoSchema", () => {
  const errores = (campos: Record<string, string>) => {
    const resultado = formularioProductoSchema.safeParse(datosDeFormularioProducto(formulario(campos)));
    return resultado.success ? {} : resultado.error.flatten().fieldErrors;
  };

  it("acepta un producto completo", () => {
    expect(errores(valido)).toEqual({});
  });

  it("un precio vacío es un error, no un producto a $0", () => {
    expect(errores({ ...valido, preciolista: "" }).preciolista).toEqual(["Ingresá un precio válido"]);
  });

  it("explica cada campo en castellano", () => {
    const resultado = errores({ ...valido, nombre: "", categoriaid: "", stockactual: "-1" });
    expect(resultado.nombre).toEqual(["El nombre es obligatorio"]);
    expect(resultado.categoriaid).toEqual(["Elegí una categoría"]);
    expect(resultado.stockactual).toEqual(["El stock no puede ser negativo"]);
  });
});


describe("stock mínimo", () => {
  it.each([-1, Infinity, NaN, 1000000000, 1.2345])("rechaza el mínimo inválido %s", (stockminimo) => {
    expect(actualizarProductoSchema.safeParse({ stockminimo }).success).toBe(false);
  });

  it("acepta cero y cantidades con tres decimales", () => {
    for (const stockminimo of [0, 5, 2.125]) {
      expect(actualizarProductoSchema.parse({ stockminimo })).toEqual({ stockminimo });
    }
  });

  it("crea sin mínimo si la API no lo informa y no lo modifica en una edición parcial", () => {
    expect(crearProductoSchema.parse({ nombre: "Yerba", categoriaid: 2, preciolista: 100 }).stockminimo).toBeNull();
    expect(actualizarProductoSchema.parse({ nombre: "Yerba" })).not.toHaveProperty("stockminimo");
  });

  it("ignora el mínimo enviado si el formulario no gestiona stock", () => {
    const datos = datosDeFormularioProducto(formulario({ ...valido, permitestock: "", stockminimo: "20" }));
    expect(formularioProductoSchema.parse(datos).stockminimo).toBeNull();
  });

  it("envía el mínimo sin pisar el stock actual sin cambios", () => {
    const datos = datosDeFormularioProducto(formulario({ ...valido, stockminimo: "3.125" }), 10);
    expect(formularioProductoSchema.parse(datos)).toMatchObject({ stockminimo: 3.125, stockactual: undefined });
  });
});


it("permite quitar el stock mínimo y distingue null de cero", () => {
  expect(actualizarProductoSchema.parse({ stockminimo: null }).stockminimo).toBeNull();
  expect(actualizarProductoSchema.parse({ stockminimo: 0 }).stockminimo).toBe(0);
  const datos = datosDeFormularioProducto(formulario({ ...valido, stockminimo: "" }));
  expect(formularioProductoSchema.parse(datos).stockminimo).toBeNull();
});
