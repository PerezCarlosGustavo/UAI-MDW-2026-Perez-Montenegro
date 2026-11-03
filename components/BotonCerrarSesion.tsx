"use client";

// Client Component porque signOut corre en el navegador: borra la cookie de
// sesión y redirige. No se puede hacer desde un Server Component.

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function BotonCerrarSesion() {
  const [saliendo, setSaliendo] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        setSaliendo(true);
        void signOut({ callbackUrl: "/ingresar" });
      }}
      disabled={saliendo}
    >
      {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
