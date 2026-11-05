/**
 * Corre una vez antes de todas las pruebas: deja la base lista y arma una
 * sesión por cada persona que las pruebas necesitan.
 *
 * Las pruebas no pasan por Google: el login pide una persona. Lo que hace
 * NextAuth después del login es escribir una cookie cifrada con el secreto, y
 * esto escribe la misma cookie, con la misma función y el secreto de prueba.
 *
 * Fijate lo que no hay: ningún "modo prueba" en `lib/auth.ts`, ningún usuario
 * mágico, ningún `if (process.env.E2E)`. El rol lo sigue leyendo el callback
 * `jwt` desde la base, por eso los usuarios tienen que existir acá.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, type Rol } from "@prisma/client";
import { encode } from "next-auth/jwt";
import { SESION } from "./sesiones";

/** El nombre de la cookie en http. En https NextAuth le agrega `__Secure-`. */
const COOKIE = "next-auth.session-token";

async function guardarSesion(archivo: string, email: string) {
  const valor = await encode({ token: { email }, secret: process.env.AUTH_SECRET! });

  mkdirSync(path.dirname(archivo), { recursive: true });
  writeFileSync(
    archivo,
    JSON.stringify({
      cookies: [
        {
          name: COOKIE,
          value: valor,
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    })
  );
}

export default async function preparar() {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

  const prisma = new PrismaClient();

  const personas: { archivo: string; email: string; rol: Rol; activo?: boolean }[] = [
    { archivo: SESION.admin, email: process.env.ADMIN_EMAIL!, rol: "ADMIN" },
    { archivo: SESION.vendedor, email: "vendedor@e2e.test", rol: "VENDEDOR" },
    { archivo: SESION.otroVendedor, email: "otro-vendedor@e2e.test", rol: "VENDEDOR" },
    { archivo: SESION.pendiente, email: "pendiente@e2e.test", rol: "PENDIENTE" },
    { archivo: SESION.inactivo, email: "inactivo@e2e.test", rol: "VENDEDOR", activo: false },
  ];

  try {
    for (const { archivo, email, rol, activo = true } of personas) {
      await prisma.usuario.upsert({
        where: { email },
        update: { rol, activo },
        create: { email, nombre: email, usuario: email, rol, activo },
      });
      await guardarSesion(archivo, email);
    }
  } finally {
    await prisma.$disconnect();
  }
}
