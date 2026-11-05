"use server";

// "use server" no vuelve privado esto: cada función exportada es un endpoint
// público con otra sintaxis (clase 12). Por eso cada una verifica permiso y
// datos otra vez, aunque la pantalla ya lo haya hecho.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ErrorAutorizacion } from "@/lib/auth/errores";
import { verificarPermiso } from "@/lib/auth/verificarPermiso";
import {
  MENSAJE_RECHAZO_PRODUCTO,
  modificarProducto,
  registrarProducto,
} from "@/lib/casos/guardarProducto";
import type { CampoProducto, EstadoProducto } from "@/lib/formularios";
import {
  datosDeFormularioProducto,
  formularioProductoSchema,
  idProductoSchema,
} from "@/lib/schemas/producto";

// Sin permiso se contesta con un mensaje; lo que no sea de permisos sigue su
// camino hasta error.tsx.
function rechazoDePermiso(error: unknown): EstadoProducto {
  if (error instanceof ErrorAutorizacion) return { mensaje: "No tenés permiso para hacer esto." };
  throw error;
}

function valoresEscritos(formData: FormData): EstadoProducto["valores"] {
  const texto = (campo: CampoProducto) => {
    const valor = formData.get(campo);
    return typeof valor === "string" ? valor : "";
  };

  return {
    nombre: texto("nombre"),
    categoriaid: texto("categoriaid"),
    codigobarra: texto("codigobarra"),
    preciolista: texto("preciolista"),
    stockactual: texto("stockactual"),
    stockminimo: texto("stockminimo"),
    permitestock: texto("permitestock"),
  };
}

// El catálogo se ve en estas dos pantallas: las dos quedaron viejas.
function refrescarCatalogo() {
  revalidatePath("/productos");
  revalidatePath("/ventas");
}

export async function crearProductoAction(_estado: EstadoProducto, formData: FormData): Promise<EstadoProducto> {
  try {
    await verificarPermiso("producto", "crear");
  } catch (error) {
    return rechazoDePermiso(error);
  }

  const valores = valoresEscritos(formData);
  const datos = formularioProductoSchema.safeParse(datosDeFormularioProducto(formData));
  if (!datos.success) return { errores: datos.error.flatten().fieldErrors, valores };

  const resultado = await registrarProducto({ ...datos.data, stockactual: datos.data.stockactual ?? 0, activo: true });
  if (!resultado.ok) return { mensaje: MENSAJE_RECHAZO_PRODUCTO[resultado.motivo], valores };

  refrescarCatalogo();
  // redirect funciona lanzando una excepción: lo de abajo no se ejecutaría.
  redirect("/productos");
}

// El id y el stock con el que se abrió el formulario los fija la página en el
// servidor con .bind: no son campos que se puedan editar con el inspector.
export async function editarProductoAction(
  id: number,
  stockAlAbrir: number,
  _estado: EstadoProducto,
  formData: FormData
): Promise<EstadoProducto> {
  try {
    await verificarPermiso("producto", "editar");
  } catch (error) {
    return rechazoDePermiso(error);
  }

  const idValido = idProductoSchema.safeParse(id);
  if (!idValido.success) return { mensaje: MENSAJE_RECHAZO_PRODUCTO.producto_inexistente };

  const valores = valoresEscritos(formData);
  const datos = formularioProductoSchema.safeParse(datosDeFormularioProducto(formData, stockAlAbrir));
  if (!datos.success) return { errores: datos.error.flatten().fieldErrors, valores };

  const resultado = await modificarProducto(BigInt(idValido.data), datos.data);
  if (!resultado.ok) return { mensaje: MENSAJE_RECHAZO_PRODUCTO[resultado.motivo], valores };

  refrescarCatalogo();
  redirect("/productos");
}

// Baja lógica y su reversa. Las ventas viejas siguen apuntando al producto.
export async function cambiarEstadoProductoAction(id: number, activar: boolean): Promise<EstadoProducto> {
  try {
    await verificarPermiso("producto", activar ? "editar" : "borrar");
  } catch (error) {
    return rechazoDePermiso(error);
  }

  const idValido = idProductoSchema.safeParse(id);
  if (!idValido.success) return { mensaje: MENSAJE_RECHAZO_PRODUCTO.producto_inexistente };

  const resultado = await modificarProducto(BigInt(idValido.data), { activo: activar });
  if (!resultado.ok) return { mensaje: MENSAJE_RECHAZO_PRODUCTO[resultado.motivo] };

  refrescarCatalogo();
  return {};
}
