import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import BotonIngresarGoogle from "@/components/BotonIngresarGoogle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// Si el login falla, NextAuth vuelve acá con ?error=<código>. Se muestra un
// mensaje para la persona, nunca el detalle técnico (que queda en los logs).
function mensajeDeError(codigo: string) {
  if (codigo === "AccessDenied") return "No se pudo validar tu cuenta. Probá de nuevo.";
  if (codigo === "OAuthSignin" || codigo === "OAuthCallback") {
    return "Google no respondió como esperábamos. Probá de nuevo en unos minutos.";
  }
  return "No pudimos iniciar tu sesión. Probá de nuevo; si sigue pasando, avisale al administrador.";
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function Ingresar({ searchParams }: Props) {
  // Quien ya tiene sesión no tiene nada que hacer acá.
  if (await obtenerUsuario()) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Punto de venta</p>
          <CardTitle className="text-2xl">Almacén POS</CardTitle>
          <CardDescription>
            Ventas, stock y cuentas corrientes del almacén. Ingresá con tu cuenta de Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{mensajeDeError(error)}</AlertDescription>
            </Alert>
          ) : null}

          <BotonIngresarGoogle />

          <p className="text-xs text-muted-foreground">
            Si es tu primera vez, tu cuenta queda pendiente hasta que un administrador te asigne un rol.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
