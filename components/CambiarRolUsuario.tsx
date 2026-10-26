"use client";

// Client Component porque tiene estado (lo que se eligió, si está guardando,
// el error) y responde a eventos del navegador. La lista en sí se arma en el
// servidor; esto es solo el control de cada fila.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectNativo } from "@/components/ui/select-nativo";
import { ROLES } from "@/lib/schemas/usuario";

const NOMBRE_ROL: Record<(typeof ROLES)[number], string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  PENDIENTE: "Pendiente",
};

type Props = {
  id: number;
  rol: (typeof ROLES)[number];
  activo: boolean;
  esUnoMismo: boolean;
};

export default function CambiarRolUsuario({ id, rol, activo, esUnoMismo }: Props) {
  const router = useRouter();
  const [rolElegido, setRolElegido] = useState(rol);
  const [activoElegido, setActivoElegido] = useState(activo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const huboCambios = rolElegido !== rol || activoElegido !== activo;

  async function guardar() {
    setGuardando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: rolElegido, activo: activoElegido }),
      });

      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => null);
        throw new Error(cuerpo?.detalles?.join(" ") ?? cuerpo?.error ?? "No se pudo guardar");
      }

      // Vuelve a pedir la página al servidor para que la lista quede al día.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm">
        <span className="sr-only">Rol</span>
        <SelectNativo
          value={rolElegido}
          onChange={(evento) => setRolElegido(evento.target.value as Props["rol"])}
          disabled={esUnoMismo || guardando}
          className="w-auto"
        >
          {ROLES.map((opcion) => (
            <option key={opcion} value={opcion}>
              {NOMBRE_ROL[opcion]}
            </option>
          ))}
        </SelectNativo>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activoElegido}
          onChange={(evento) => setActivoElegido(evento.target.checked)}
          disabled={esUnoMismo || guardando}
          className="size-4 accent-primary"
        />
        Activo
      </label>

      <Button size="sm" onClick={guardar} disabled={!huboCambios || guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </Button>

      {esUnoMismo ? <span className="text-xs text-muted-foreground">(sos vos)</span> : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-destructive">
          Error: {error}
        </p>
      ) : null}
    </div>
  );
}
