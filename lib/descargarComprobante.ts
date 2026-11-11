export async function obtenerComprobantePdf(url: string): Promise<Blob> {
  const respuesta = await fetch(url, { credentials: "same-origin" });
  if (respuesta.status === 401) throw new Error("Tu sesión venció. Ingresá nuevamente para descargar el comprobante.");
  if (respuesta.status === 403) throw new Error("No tenés permiso para descargar este comprobante.");
  if (respuesta.status === 404) throw new Error("No se encontró el comprobante o no tenés acceso a él.");
  if (!respuesta.ok) throw new Error("No se pudo generar el comprobante. Probá de nuevo.");
  if (!respuesta.headers.get("content-type")?.toLowerCase().startsWith("application/pdf")) {
    throw new Error("El servidor no devolvió un comprobante PDF. Probá de nuevo.");
  }

  const pdf = await respuesta.blob();
  const encabezado = await pdf.slice(0, 5).text();
  if (encabezado !== "%PDF-") throw new Error("El comprobante recibido no es un PDF válido.");
  return pdf;
}
