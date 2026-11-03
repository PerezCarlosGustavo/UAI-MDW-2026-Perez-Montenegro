import * as React from "react";

import { cn } from "@/lib/cn";

// Un <select> del navegador con el mismo estilo que Input. Los componentes
// base de shadcn no traen uno nativo, y para esta app el nativo alcanza: es
// accesible de fábrica (teclado, lector de pantalla) y en el celular abre el
// selector del sistema.
function SelectNativo({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "[&>option]:bg-background [&>option]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export { SelectNativo };
