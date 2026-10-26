"use client";

// Client Component porque necesita usePathname() para saber en qué pantalla
// estás y marcarla (aria-current). Es lo único de la barra que corre en el
// navegador.

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
};

export default function EnlaceNavegacion({ href, children }: Props) {
  const ruta = usePathname();
  const activo = href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        activo
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
