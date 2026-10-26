import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import SinDatos from "@/components/SinDatos";
import { requerirUsuario } from "@/lib/auth";

// Galería del sistema visual (clase 10): cada componente con todos sus
// estados, con datos fijos. Sirve para ver un componente antes de usarlo,
// para ver estados raros sin ensuciar la base y para que quien revisa un PR
// chequee contraste y foco en un solo lugar. Está detrás de la sesión.

export const dynamic = "force-dynamic";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-6">
      <h2 className="mb-4 text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function Sistema() {
  await requerirUsuario();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Sistema visual</p>
      <h1 className="mt-1 mb-6 text-3xl font-semibold">Componentes</h1>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap gap-3">
          <Button>Registrar venta</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Quitar</Button>
          <Button variant="destructive">Dar de baja</Button>
          <Button variant="link">Ver detalle</Button>
          <Button disabled>Registrando…</Button>
          <Button size="sm">Chico</Button>
          <Button size="lg">Grande</Button>
        </div>
      </Seccion>

      <Seccion titulo="Badges del dominio">
        <div className="flex flex-wrap gap-3">
          <Badge>Contado</Badge>
          <Badge variant="outline">Cuenta corriente</Badge>
          <Badge variant="secondary">Vendedor</Badge>
          <Badge>Administrador</Badge>
          <Badge variant="outline">Pendiente de aprobación</Badge>
          <Badge variant="destructive">Stock negativo</Badge>
          <Badge variant="secondary">Inactivo</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Cada badge dice el estado con palabras: el color acompaña, nunca es la única señal.
        </p>
      </Seccion>

      <Seccion titulo="Campos">
        <div className="grid max-w-md gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Monto recibido
            <Input type="number" placeholder="0,00" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Con error
            <Input aria-invalid defaultValue="-5" />
            <span className="text-sm font-normal text-destructive">El monto debe ser mayor a 0.</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Deshabilitado
            <Input disabled defaultValue="$ 2.500,00" />
          </label>
        </div>
      </Seccion>

      <Seccion titulo="Tarjeta">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Venta #128</CardTitle>
            <CardDescription>Cliente Demo · Cuenta corriente</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            2 × GASEOSA MANAOS LIMA — $ 5.000,00
          </CardContent>
        </Card>
        <Card className="mt-4 max-w-md">
          <CardHeader>
            <CardTitle>
              CALDOS PARA SABORIZAR LA VIRGINIA ALBAHACA Y AJO EDICIÓN ESPECIAL CON UN NOMBRE MUY LARGO
            </CardTitle>
            <CardDescription>Caso con texto larguísimo: no se tiene que cortar ni desbordar.</CardDescription>
          </CardHeader>
        </Card>
      </Seccion>

      <Seccion titulo="Alertas">
        <div className="grid max-w-xl gap-3">
          <Alert>
            <AlertTitle>Venta registrada</AlertTitle>
            <AlertDescription>Se generó la venta #128.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>No se pudo registrar la venta</AlertTitle>
            <AlertDescription>El cliente está inactivo.</AlertDescription>
          </Alert>
        </div>
      </Seccion>

      <Seccion titulo="Cargando (esqueleto)">
        <div className="grid max-w-md gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Seccion>

      <Seccion titulo="Vacío y sin resultados">
        <div className="grid gap-4 sm:grid-cols-2">
          <SinDatos
            titulo="Todavía no hay ventas"
            descripcion="Cuando registres la primera, va a aparecer acá."
            accion={<Button size="sm">Registrar venta</Button>}
          />
          <SinDatos
            titulo="Ningún cliente coincide con “fifi”"
            descripcion="Probá con otro nombre o borrá la búsqueda."
          />
        </div>
      </Seccion>
    </main>
  );
}
