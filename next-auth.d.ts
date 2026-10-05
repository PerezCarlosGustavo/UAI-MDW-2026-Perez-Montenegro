import "next-auth";
import type { Rol } from "@prisma/client";

// El rol sale del enum de Prisma y no de una unión escrita a mano: si alguna
// vez cambia en el schema, TypeScript avisa en todos lados.
declare module "next-auth" {
  interface User {
    id?: number;
    rol?: Rol;
    nombre?: string;
    email?: string | null;
  }

  interface Session {
    user: {
      id: number;
      rol: Rol;
      nombre: string;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    rol?: Rol;
    nombre?: string;
    email?: string | null;
  }
}
