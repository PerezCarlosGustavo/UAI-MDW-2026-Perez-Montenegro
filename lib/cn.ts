import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper de shadcn/ui para combinar clases de Tailwind: junta las condiciones
// (clsx) y resuelve choques como "p-2 p-4" quedándose con la última (twMerge).
// Vive en lib/cn.ts y no en lib/utils.ts porque utils.ts ya tiene los helpers
// del proyecto y la regla de AGENTS.md es que ese archivo no tenga
// dependencias.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
