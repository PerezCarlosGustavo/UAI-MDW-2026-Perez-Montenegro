import { promises as fs } from "node:fs";
import path from "node:path";
import * as React from "react";
import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { subirPdf } from "@/lib/servicios/storageService";
import { formatearFechaHora, formatearPesos } from "@/lib/utils";
import { TAMANO_58MM, estilosTicket as styles } from "./estilosTicket";

export type ProductoTicket = {
  nombre: string;
  cantidad: number;
  subtotal: number;
};

export type TicketVenta = {
  ventaId: bigint;
  productos: ProductoTicket[];
  total: number;
  fecha?: Date;
};

export type GenerarTicketVentaInput = TicketVenta & {
  destino?: string;
};

/** Arma el PDF y nada más: imprimir un comprobante no depende de Supabase. */
export async function renderizarTicketVenta({
  ventaId,
  productos,
  total,
  fecha = new Date(),
}: TicketVenta): Promise<Buffer> {
  const TicketDocument = () =>
    React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: TAMANO_58MM, style: styles.page },
        React.createElement(Text, { style: styles.title }, "Ticket de venta"),
        React.createElement(Text, { style: styles.meta }, `Venta #${String(ventaId)}`),
        React.createElement(Text, { style: styles.meta }, formatearFechaHora(fecha)),
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.column, { flex: 2 }] }, "Producto"),
          React.createElement(Text, { style: [styles.column, { flex: 0.7, textAlign: "center" }] }, "Cant."),
          React.createElement(Text, { style: [styles.column, { flex: 1.3, textAlign: "right" }] }, "Subtotal")
        ),
        ...productos.map((producto, index) =>
          React.createElement(
            View,
            { key: `${producto.nombre}-${index}`, style: styles.productRow },
            React.createElement(Text, { style: styles.productName }, String(producto.nombre)),
            React.createElement(Text, { style: styles.productQty }, String(producto.cantidad)),
            React.createElement(Text, { style: styles.productSubtotal }, formatearPesos(producto.subtotal))
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Total"),
          React.createElement(Text, { style: styles.totalValue }, formatearPesos(total))
        )
      )
    );

  return Buffer.from(await renderToBuffer(React.createElement(TicketDocument)));
}

export async function generarTicketVentaPdf({
  destino,
  ...ticket
}: GenerarTicketVentaInput): Promise<Buffer> {
  const pdfBuffer = await renderizarTicketVenta(ticket);
  if (destino) {
    await fs.mkdir(destino, { recursive: true });
    await fs.writeFile(path.join(destino, `ticket-venta-${ticket.ventaId.toString()}.pdf`), pdfBuffer);
  }
  await subirPdf({ pdfBuffer, ventaId: ticket.ventaId.toString() });

  return pdfBuffer;
}
