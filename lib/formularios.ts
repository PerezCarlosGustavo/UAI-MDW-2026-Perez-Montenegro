// Lo que viaja entre una Server Action y su formulario.
//
// Los dos errores tienen dos lugares (clase 12): `errores` es de validación y
// va debajo de cada campo; `mensaje` es el rechazo de una regla y va arriba.
// `valores` es lo que la persona había escrito, para no vaciarle el formulario.
export type EstadoFormulario<Campo extends string = string> = {
  errores?: Partial<Record<Campo, string[]>>;
  mensaje?: string;
  valores?: Partial<Record<Campo, string>>;
};

export type CampoProducto = "nombre" | "categoriaid" | "codigobarra" | "preciolista" | "stockminimo" | "stockactual" | "permitestock";
export type EstadoProducto = EstadoFormulario<CampoProducto>;

export const SIN_ENVIAR: EstadoProducto = {};
