export const PERMISOS: Record<
  "producto" | "cliente" | "venta",
  Record<"crear" | "editar" | "ver", string[]>
> = {
  producto: {
    crear: ["ADMIN"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"],
  },
  cliente: {
    crear: ["ADMIN", "VENDEDOR"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"],
  },
  venta: {
    crear: ["ADMIN", "VENDEDOR"],
    ver: ["ADMIN", "VENDEDOR"],
    editar: ["ADMIN", "VENDEDOR"],
  },
};
