import type { Rol } from "@prisma/client";

// Las ventas no tienen "editar": son inmutables (ADR 0006). Si hay un error se
// corrige con un movimiento posterior, no tocando la venta.
export const PERMISOS: {
  producto: Record<"crear" | "editar" | "ver", Rol[]>;
  cliente: Record<"crear" | "editar" | "ver", Rol[]>;
  venta: Record<"crear" | "ver", Rol[]>;
} = {
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
  },
};
