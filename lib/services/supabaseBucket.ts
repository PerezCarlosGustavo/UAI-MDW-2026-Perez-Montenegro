import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function subirTicketVentaSupabase({
  pdfBuffer,
  ventaId,
  bucketName = "facturas",
}: {
  pdfBuffer: Buffer;
  ventaId: number | string;
  bucketName?: string;
}) {
  const fileName = `ticket-venta-${String(ventaId)}.pdf`;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) {
    throw new Error(`No se pudo guardar el ticket en Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

  return {
    fileName,
    path: data?.path ?? fileName,
    publicUrl: publicUrlData?.publicUrl ?? null,
  };
}
