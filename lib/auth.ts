import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db/client";
import { ErrorAutorizacion } from "@/lib/auth/errores";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }: { user: { email?: string | null; name?: string | null } }) {
      if (!user.email) {
        return false;
      }

      await prisma.usuario.upsert({
        where: { email: user.email },
        update: {},
        create: {
          email: user.email,
          nombre: user.name ?? "",
          usuario: user.email,
          rol: "VENDEDOR",
        },
      });

      return true;
    },

    async jwt({ token }: { token: { email?: string | null; id?: number; rol?: "ADMIN" | "VENDEDOR"; nombre?: string } }) {
      if (!token.email) {
        return token;
      }

      const usuario = await prisma.usuario.findUnique({
        where: { email: token.email },
      });

      if (usuario) {
        token.id = Number(usuario.id);
        token.rol = usuario.rol as "ADMIN" | "VENDEDOR";
        token.nombre = usuario.nombre;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = Number(token.id ?? 0);
        session.user.rol = (token.rol as "ADMIN" | "VENDEDOR") ?? "VENDEDOR";
        session.user.nombre = (token.nombre as string) ?? "";
      }

      return session;
    },
  },
};


export async function obtenerUsuario() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    rol: session.user.rol,
    nombre: session.user.nombre,
    email: session.user.email,
  };
}

export async function requerirUsuario(rol?: "ADMIN" | "VENDEDOR") {
  const usuario = await obtenerUsuario();

  if (!usuario) {
    throw new ErrorAutorizacion(401, "No autenticado");
  }

  if (rol && usuario.rol !== rol) {
    throw new ErrorAutorizacion(403, "No autorizado");
  }

  return usuario;
}
