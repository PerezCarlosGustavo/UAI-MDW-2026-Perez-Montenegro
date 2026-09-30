import { createClient } from "@supabase/supabase-js";

const STORAGE_TIMEOUT_MS = 10_000;

export async function subirTicket({
  pdfBuffer,
  ventaId,
  bucketName = "Facturas",
}: {
  pdfBuffer: Buffer;
  ventaId: number | string;
  bucketName?: string;
}) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (input, init) => {
          const timeoutSignal = AbortSignal.timeout(STORAGE_TIMEOUT_MS);
          const signal = init?.signal
            ? AbortSignal.any([init.signal, timeoutSignal])
            : timeoutSignal;
            //Copiá todas las propiedades que tenga init dentro del objeto que le estoy pasando a fetch
          return fetch(input, { ...init, signal });
        },
      },
    });

    const fileName = `ticket-venta-${String(ventaId)}.pdf`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    return {
      fileName,
      path: data?.path ?? fileName,
      publicUrl: publicUrlData?.publicUrl ?? null,
    };
  } catch (error) {
    console.error("No se pudo guardar el ticket en Supabase Storage:", error);
    return null;
  }
}