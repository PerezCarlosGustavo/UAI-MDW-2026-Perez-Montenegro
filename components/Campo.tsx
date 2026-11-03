"use client";

// Etiqueta, control, ayuda y error, conectados una vez y bien. El id sale de
// useId y no del nombre del campo: dos formularios en la misma página darían
// ids repetidos y romperían justo esta conexión.

import { useId } from "react";

type PropsDelControl = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type Props = {
  etiqueta: string;
  ayuda?: string;
  errores?: string[];
  children: (control: PropsDelControl) => React.ReactNode;
};

export default function Campo({ etiqueta, ayuda, errores, children }: Props) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const hayError = Boolean(errores?.length);
  const descripcion = [ayuda ? idAyuda : null, hayError ? idError : null].filter(Boolean).join(" ");

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children({
        id,
        "aria-describedby": descripcion || undefined,
        "aria-invalid": hayError ? true : undefined,
      })}
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      ) : null}
      {hayError ? (
        <p id={idError} className="text-sm text-destructive">
          {errores?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
