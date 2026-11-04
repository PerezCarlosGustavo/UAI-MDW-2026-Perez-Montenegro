"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  titulo: string;
  ocupado?: boolean;
  children: (cerrar: () => void) => ReactNode;
};

export default function BotonAgregar({ titulo, ocupado = false, children }: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Dialog open={abierto} onOpenChange={(valor) => { if (!ocupado) setAbierto(valor); }}>
      <DialogTrigger asChild>
        <Button type="button" disabled={ocupado}>
          <span aria-hidden="true">+</span> Agregar
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        onEscapeKeyDown={(evento) => { if (ocupado) evento.preventDefault(); }}
        onInteractOutside={(evento) => { if (ocupado) evento.preventDefault(); }}
      >
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="text-lg font-semibold">{titulo}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            disabled={ocupado}
            onClick={() => setAbierto(false)}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        {children(() => setAbierto(false))}
      </DialogContent>
    </Dialog>
  );
}
