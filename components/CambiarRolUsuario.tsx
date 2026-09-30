"use client";

// Client Component porque tiene estado (lo que se eligió, si está guardando,
// el error) y responde a eventos del navegador. La lista en sí se arma en el
// servidor; esto es solo el control de cada fila.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES } from "@/lib/schemas/usuario";

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
        <select
          value={rolElegido}
          onChange={(evento) => setRolElegido(evento.target.value as Props["rol"])}
          disabled={esUnoMismo || guardando}
          className="rounded border border-slate-300 px-2 py-1"
        >
          {ROLES.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={activoElegido}
          onChange={(evento) => setActivoElegido(evento.target.checked)}
          disabled={esUnoMismo || guardando}
        />
        Activo
      </label>

      <button
        type="button"
        onClick={guardar}
        disabled={!huboCambios || guardando}
        className="rounded bg-slate-900 px-3 py-1 text-sm text-white disabled:bg-slate-300"
      >
        {guardando ? "Guardando..." : "Guardar"}
      </button>

      {esUnoMismo ? <span className="text-xs text-slate-500">(sos vos)</span> : null}
      {error ? (
        <p role="alert" className="w-full text-sm text-red-700">
          Error: {error}
        </p>
      ) : null}
    </div>
  );
}
