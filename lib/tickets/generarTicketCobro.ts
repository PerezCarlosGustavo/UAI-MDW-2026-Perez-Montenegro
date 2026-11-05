import * as React from "react";
import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatearFechaHora, formatearPesos } from "@/lib/utils";
import { TAMANO_58MM, estilosTicket as styles } from "./estilosTicket";

export type TicketCobro = {
  cobranzaid: number;
  cliente: string;
  fecha: Date;
  montoRecibido: number;
  liquidados: { nombre: string; cantidad: number; importe: number }[];
  saldoAFavorUsado: number;
  saldoAFavorGenerado: number;
  saldoAFavor: number;
};

function fila(etiqueta: string, importe: number) {
  return React.createElement(
    View,
    { key: etiqueta, style: styles.detalleRow },
    React.createElement(Text, { style: styles.detalleTexto }, etiqueta),
    React.createElement(Text, { style: styles.detalleTexto }, formatearPesos(importe))
  );
}

export async function renderizarTicketCobro(ticket: TicketCobro): Promise<Buffer> {
  const TicketDocument = () =>
    React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: TAMANO_58MM, style: styles.page },
        React.createElement(Text, { style: styles.title }, "Comprobante de cobro"),
        React.createElement(Text, { style: styles.meta }, `Cobro #${ticket.cobranzaid}`),
        React.createElement(Text, { style: styles.meta }, formatearFechaHora(ticket.fecha)),
        React.createElement(Text, { style: styles.meta }, `Cliente: ${ticket.cliente}`),
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.column, { flex: 2 }] }, "Liquidado"),
          React.createElement(Text, { style: [styles.column, { flex: 0.7, textAlign: "center" }] }, "Cant."),
          React.createElement(Text, { style: [styles.column, { flex: 1.3, textAlign: "right" }] }, "Importe")
        ),
        ticket.liquidados.length === 0
          ? React.createElement(Text, { style: styles.productName }, "Ningún producto: queda como saldo a favor.")
          : null,
        ...ticket.liquidados.map((producto, index) =>
          React.createElement(
            View,
            { key: `${producto.nombre}-${index}`, style: styles.productRow },
            React.createElement(Text, { style: styles.productName }, producto.nombre),
            React.createElement(Text, { style: styles.productQty }, String(producto.cantidad)),
            React.createElement(Text, { style: styles.productSubtotal }, formatearPesos(producto.importe))
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Recibido"),
          React.createElement(Text, { style: styles.totalValue }, formatearPesos(ticket.montoRecibido))
        ),
        ticket.saldoAFavorUsado > 0 ? fila("Saldo a favor usado", ticket.saldoAFavorUsado) : null,
        ticket.saldoAFavorGenerado > 0 ? fila("Saldo a favor generado", ticket.saldoAFavorGenerado) : null,
        fila("Saldo a favor actual", ticket.saldoAFavor)
      )
    );

  return Buffer.from(await renderToBuffer(React.createElement(TicketDocument)));
}
