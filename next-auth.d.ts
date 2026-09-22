import "next-auth";

declare module "next-auth" {
  interface User {
    id?: number;
    rol?: "ADMIN" | "VENDEDOR";
    nombre?: string;
    email?: string | null;
  }

  interface Session {
    user: {
      id: number;
      rol: "ADMIN" | "VENDEDOR";
      nombre: string;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    rol?: "ADMIN" | "VENDEDOR";
    nombre?: string;
    email?: string | null;
  }
}