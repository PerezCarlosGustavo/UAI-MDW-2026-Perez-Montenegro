import { z } from "zod";

// El id de la URL de un comprobante. Un id que no es número responde 400.
export const comprobanteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ComprobanteParams = z.infer<typeof comprobanteParamsSchema>;
