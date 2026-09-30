import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import type { Rol } from "@prisma/client";
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
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      // Todo usuario nuevo entra como VENDEDOR, el rol con menos permisos.
      // `update` queda vacío a propósito: si ya existe, loguearse no le
      // cambia el rol. ADMIN se asigna solo desde la base (ver seed).
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

    // Corre en cada request que lee la sesión. Consultamos la base en vez de
    // confiar en lo que quedó guardado en el token, así un cambio de rol se
    // aplica sin tener que cerrar sesión (ver ADR 0007).
    async jwt({ token }) {
      if (!token.email) {
        return token;
      }

      const usuario = await prisma.usuario.findUnique({
        where: { email: token.email },
      });

      if (usuario && usuario.activo) {
        token.id = Number(usuario.id);
        token.rol = usuario.rol;
        token.nombre = usuario.nombre;
      } else {
        // Si lo borraron o lo desactivaron, el token deja de identificar a
        // alguien y obtenerUsuario devuelve null.
        delete token.id;
        delete token.rol;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id && token.rol) {
        session.user.id = token.id;
        session.user.rol = token.rol;
        session.user.nombre = token.nombre ?? "";
      }

      return session;
    },
  },
};


export async function obtenerUsuario() {
  const session = await getServerSession(authOptions);

  // Sin id no hay usuario válido. Antes se completaba con id 0 y rol
  // VENDEDOR, y eso dejaba pasar una sesión que no correspondía a nadie.
  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    rol: session.user.rol,
    nombre: session.user.nombre,
    email: session.user.email,
  };
}

export async function requerirUsuario(rol?: Rol) {
  const usuario = await obtenerUsuario();

  if (!usuario) {
    throw new ErrorAutorizacion(401, "No autenticado");
  }

  if (rol && usuario.rol !== rol) {
    throw new ErrorAutorizacion(403, "No autorizado");
  }

  return usuario;
}
