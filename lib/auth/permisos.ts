import type { Rol } from "@prisma/client";

// Las ventas no tienen "editar": son inmutables (ADR 0006). Si hay un error se
// corrige con un movimiento posterior, no tocando la venta.
export const PERMISOS: {
  producto: Record<"crear" | "editar" | "ver" | "borrar", Rol[]>;
  cliente: Record<"crear" | "editar" | "ver" | "borrar", Rol[]>;
  venta: Record<"crear" | "ver", Rol[]>;
} = {
  producto: {
    crear: ["ADMIN"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"],
    // "borrar" es baja lógica (activo = false): hay ventas que lo referencian.
    borrar: ["ADMIN"],
  },
  cliente: {
    crear: ["ADMIN", "VENDEDOR"],
    editar: ["ADMIN"],
    ver: ["ADMIN", "VENDEDOR"],
    borrar: ["ADMIN"],
  },
  venta: {
    crear: ["ADMIN", "VENDEDOR"],
    ver: ["ADMIN", "VENDEDOR"],
  },
};
